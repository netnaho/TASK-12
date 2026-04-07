import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const { mockPrisma, mockGenerateFile } = vi.hoisted(() => ({
  mockPrisma: {
    outboundMessage: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
  mockGenerateFile: vi.fn(),
}));

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../src/modules/messaging/delivery/file-generator', () => ({
  fileGenerator: { generateMessageFile: mockGenerateFile },
}));

import { MessageQueue } from '../../../src/modules/messaging/queue/message-queue';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMsg(overrides: Partial<{
  id: string;
  channel: string;
  status: string;
  retryCount: number;
  recipientAddr: string;
  subject: string | null;
  renderedBody: string;
  isFailureAlert: boolean;
}> = {}) {
  return {
    id: 'msg-1',
    channel: 'EMAIL',
    status: 'QUEUED',
    retryCount: 0,
    recipientAddr: 'user@example.com',
    subject: 'Hello',
    renderedBody: 'Body text',
    isFailureAlert: false,
    ...overrides,
  } as any;
}

const OVERNIGHT_QUIET = { timezone: 'UTC', quietStartHr: 21, quietEndHr: 7 };

function utcHour(hour: number): Date {
  const d = new Date('2024-01-15T00:00:00.000Z');
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MessageQueue.processRetries', () => {
  let queue: MessageQueue;

  beforeEach(() => {
    vi.resetAllMocks();
    queue = new MessageQueue();
    mockPrisma.outboundMessage.update.mockResolvedValue({});
  });

  it('returns zeros when within quiet hours', async () => {
    // 22:00 UTC is within 21→7 quiet window
    vi.useFakeTimers();
    vi.setSystemTime(utcHour(22));

    const result = await queue.processRetries(OVERNIGHT_QUIET);

    expect(result).toEqual({ processed: 0, succeeded: 0, failed: 0, exhausted: 0 });
    expect(mockPrisma.outboundMessage.findMany).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('processes messages outside quiet hours', async () => {
    mockPrisma.outboundMessage.findMany.mockResolvedValue([]);

    vi.useFakeTimers();
    vi.setSystemTime(utcHour(12)); // midday — outside quiet window

    const result = await queue.processRetries(OVERNIGHT_QUIET);

    expect(mockPrisma.outboundMessage.findMany).toHaveBeenCalled();
    expect(result.processed).toBe(0);

    vi.useRealTimers();
  });

  it('marks QUEUED→EMAIL message DELIVERED after package generation', async () => {
    const msg = makeMsg({ status: 'QUEUED', channel: 'EMAIL' });
    mockPrisma.outboundMessage.findMany.mockResolvedValue([msg]);
    mockGenerateFile.mockResolvedValue('/tmp/leaseops-messages/msg-1-123.json');

    const result = await queue.processRetries();

    expect(mockPrisma.outboundMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'msg-1' },
        data: expect.objectContaining({ status: 'DELIVERED', fileOutputPath: expect.any(String) }),
      }),
    );
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('marks SMS message DELIVERED after package generation', async () => {
    const msg = makeMsg({ status: 'QUEUED', channel: 'SMS' });
    mockPrisma.outboundMessage.findMany.mockResolvedValue([msg]);
    mockGenerateFile.mockResolvedValue('/tmp/leaseops-messages/msg-1-123.txt');

    const result = await queue.processRetries();

    expect(result.succeeded).toBe(1);
  });

  it('marks ENTERPRISE_IM message DELIVERED after package generation', async () => {
    const msg = makeMsg({ status: 'QUEUED', channel: 'ENTERPRISE_IM' });
    mockPrisma.outboundMessage.findMany.mockResolvedValue([msg]);
    mockGenerateFile.mockResolvedValue('/tmp/leaseops-messages/msg-1-123.json');

    const result = await queue.processRetries();

    expect(result.succeeded).toBe(1);
  });

  it('transitions QUEUED→RETRY_1 when file generation fails', async () => {
    const msg = makeMsg({ status: 'QUEUED', channel: 'EMAIL', retryCount: 0 });
    mockPrisma.outboundMessage.findMany.mockResolvedValue([msg]);
    mockGenerateFile.mockRejectedValue(new Error('disk full'));

    const result = await queue.processRetries();

    expect(mockPrisma.outboundMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'RETRY_1', retryCount: 1 }),
      }),
    );
    expect(result.failed).toBe(1);
    expect(result.succeeded).toBe(0);
  });

  it('marks RETRY_3 message as FAILED with isFailureAlert=true when exhausted', async () => {
    const msg = makeMsg({ status: 'RETRY_3', channel: 'EMAIL', retryCount: 3 });
    mockPrisma.outboundMessage.findMany.mockResolvedValue([msg]);
    // File generation won't even be called — RETRY_3 is not retryable after exhaustion
    // But in the current logic RETRY_3 IS retryable (it transitions to FAILED via getNextStatus returning null)
    mockGenerateFile.mockRejectedValue(new Error('disk full'));

    const result = await queue.processRetries();

    const updateCall = mockPrisma.outboundMessage.update.mock.calls[0]?.[0];
    expect(updateCall?.data).toMatchObject({
      status: 'FAILED',
      isFailureAlert: true,
    });
    expect(result.exhausted).toBe(1);
  });

  it('non-packagable channel (IN_APP) results in retry transition', async () => {
    const msg = makeMsg({ status: 'QUEUED', channel: 'IN_APP', retryCount: 0 });
    mockPrisma.outboundMessage.findMany.mockResolvedValue([msg]);

    const result = await queue.processRetries();

    // No file generation attempted for IN_APP
    expect(mockGenerateFile).not.toHaveBeenCalled();
    // Should transition to RETRY_1
    expect(result.failed).toBe(1);
  });

  it('processes messages without quietConfig (no quiet hours check)', async () => {
    mockPrisma.outboundMessage.findMany.mockResolvedValue([]);

    const result = await queue.processRetries(null);

    expect(mockPrisma.outboundMessage.findMany).toHaveBeenCalled();
    expect(result.processed).toBe(0);
  });

  it('marks as FAILED when retryable status but nextDelay is null (RETRY_2 retryCount=2)', async () => {
    // RETRY_2 is retryable (→RETRY_3), but retryCount+1=3 exceeds RETRY_INTERVALS length → nextDelay=null
    const msg = makeMsg({ status: 'RETRY_2', channel: 'EMAIL', retryCount: 2 });
    mockPrisma.outboundMessage.findMany.mockResolvedValue([msg]);
    mockGenerateFile.mockRejectedValue(new Error('network error'));

    const result = await queue.processRetries();

    expect(mockPrisma.outboundMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED', isFailureAlert: true }),
      }),
    );
    expect(result.exhausted).toBe(1);
  });

  it('increments failed count when outboundMessage.update throws (catch block)', async () => {
    const msg = makeMsg({ status: 'RETRY_3', channel: 'EMAIL', retryCount: 3 });
    mockPrisma.outboundMessage.findMany.mockResolvedValue([msg]);
    mockPrisma.outboundMessage.update.mockRejectedValue(new Error('DB error'));

    const result = await queue.processRetries();

    expect(result.failed).toBe(1);
  });
});

describe('MessageQueue.attemptDelivery', () => {
  let queue: MessageQueue;

  beforeEach(() => {
    vi.resetAllMocks();
    queue = new MessageQueue();
  });

  it('returns success=true and filePath for EMAIL channel', async () => {
    mockGenerateFile.mockResolvedValue('/tmp/out.json');

    const result = await queue.attemptDelivery(makeMsg({ channel: 'EMAIL' }));

    expect(result.success).toBe(true);
    expect(result.filePath).toBe('/tmp/out.json');
  });

  it('returns success=false for IN_APP channel (not packagable)', async () => {
    const result = await queue.attemptDelivery(makeMsg({ channel: 'IN_APP' }));

    expect(result.success).toBe(false);
    expect(mockGenerateFile).not.toHaveBeenCalled();
  });

  it('returns success=false when file generation throws', async () => {
    mockGenerateFile.mockRejectedValue(new Error('disk error'));

    const result = await queue.attemptDelivery(makeMsg({ channel: 'EMAIL' }));

    expect(result.success).toBe(false);
  });
});
