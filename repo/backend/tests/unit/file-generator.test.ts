import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { FileGenerator } from '../../src/modules/messaging/delivery/file-generator';

describe('FileGenerator', () => {
  let tmpDir: string;
  let generator: FileGenerator;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'leaseops-test-'));
    generator = new FileGenerator(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const baseMsg = {
    id: 'msg-test-123',
    recipientAddr: 'user@example.com',
    channel: 'EMAIL',
    subject: 'Test Subject',
    renderedBody: 'Hello, this is the message body.',
  };

  it('creates an output directory if it does not exist', async () => {
    const subDir = path.join(tmpDir, 'new-subdir');
    const gen = new FileGenerator(subDir);

    await gen.generateMessageFile(baseMsg);

    expect(fs.existsSync(subDir)).toBe(true);
  });

  it('returns the absolute file path', async () => {
    const filePath = await generator.generateMessageFile(baseMsg);

    expect(path.isAbsolute(filePath)).toBe(true);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  // ─── EMAIL channel ─────────────────────────────────────────────

  describe('EMAIL channel', () => {
    it('generates a .json file', async () => {
      const filePath = await generator.generateMessageFile({ ...baseMsg, channel: 'EMAIL' });
      expect(filePath.endsWith('.json')).toBe(true);
    });

    it('file contains correct packageType, to, subject, and body', async () => {
      const filePath = await generator.generateMessageFile({ ...baseMsg, channel: 'EMAIL' });
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      expect(content.packageType).toBe('EMAIL');
      expect(content.to).toBe('user@example.com');
      expect(content.subject).toBe('Test Subject');
      expect(content.body).toBe('Hello, this is the message body.');
      expect(content.from).toBe('noreply@leaseops.io');
      expect(content.generatedAt).toBeDefined();
      expect(content.instructions).toContain('email');
    });

    it('uses "(no subject)" when subject is null', async () => {
      const filePath = await generator.generateMessageFile({
        ...baseMsg,
        channel: 'EMAIL',
        subject: null,
      });
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.subject).toBe('(no subject)');
    });
  });

  // ─── SMS channel ───────────────────────────────────────────────

  describe('SMS channel', () => {
    it('generates a .txt file', async () => {
      const filePath = await generator.generateMessageFile({ ...baseMsg, channel: 'SMS' });
      expect(filePath.endsWith('.txt')).toBe(true);
    });

    it('file contains TO header and body text', async () => {
      const filePath = await generator.generateMessageFile({ ...baseMsg, channel: 'SMS' });
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('TO: user@example.com');
      expect(content).toContain('Hello, this is the message body.');
      expect(content).toContain('CHANNEL: SMS');
    });
  });

  // ─── ENTERPRISE_IM channel ─────────────────────────────────────

  describe('ENTERPRISE_IM channel', () => {
    it('generates a .json file', async () => {
      const filePath = await generator.generateMessageFile({
        ...baseMsg,
        channel: 'ENTERPRISE_IM',
      });
      expect(filePath.endsWith('.json')).toBe(true);
    });

    it('file contains packageType ENTERPRISE_IM and recipient', async () => {
      const filePath = await generator.generateMessageFile({
        ...baseMsg,
        channel: 'ENTERPRISE_IM',
        subject: 'Team Alert',
      });
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      expect(content.packageType).toBe('ENTERPRISE_IM');
      expect(content.recipient).toBe('user@example.com');
      expect(content.subject).toBe('Team Alert');
      expect(content.text).toBe('Hello, this is the message body.');
      expect(content.instructions).toContain('enterprise');
    });
  });

  // ─── FILE naming ───────────────────────────────────────────────

  it('includes message id in the filename', async () => {
    const filePath = await generator.generateMessageFile(baseMsg);
    expect(path.basename(filePath)).toContain('msg-test-123');
  });

  it('generates unique filenames for multiple calls', async () => {
    const p1 = await generator.generateMessageFile(baseMsg);
    const p2 = await generator.generateMessageFile(baseMsg);
    expect(p1).not.toBe(p2);
  });
});
