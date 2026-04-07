import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../../../logging/logger';

const OUTPUT_DIR = '/tmp/leaseops-messages';

export interface MessageInput {
  id: string;
  recipientAddr: string;
  channel: string;
  subject?: string | null;
  renderedBody: string;
}

/**
 * Generates a downloadable offline message package file for manual delivery.
 *
 * Channel-specific formats:
 *  EMAIL        → JSON envelope with headers (to/from/subject/body)
 *  SMS          → plain-text with TO header and body
 *  ENTERPRISE_IM → JSON with recipient + text fields
 *  FILE / other → generic JSON envelope
 */
export class FileGenerator {
  private readonly outputDir: string;

  constructor(outputDir: string = OUTPUT_DIR) {
    this.outputDir = outputDir;
  }

  async generateMessageFile(message: MessageInput): Promise<string> {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const ext = this.fileExtension(message.channel);
    const uniqueSuffix = crypto.randomBytes(4).toString('hex');
    const filename = `${message.id}-${Date.now()}-${uniqueSuffix}.${ext}`;
    const filePath = path.join(this.outputDir, filename);
    const content = this.buildContent(message);

    fs.writeFileSync(filePath, content, 'utf-8');

    logger.info(
      { messageId: message.id, channel: message.channel, filePath },
      'Message package file generated',
    );

    return filePath;
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private fileExtension(channel: string): string {
    if (channel === 'SMS') return 'txt';
    return 'json';
  }

  private buildContent(message: MessageInput): string {
    switch (message.channel) {
      case 'SMS':
        return this.buildSmsContent(message);
      case 'ENTERPRISE_IM':
        return this.buildEnterpriseImContent(message);
      default:
        return this.buildEmailContent(message);
    }
  }

  private buildEmailContent(message: MessageInput): string {
    return JSON.stringify(
      {
        packageType: 'EMAIL',
        to: message.recipientAddr,
        from: 'noreply@leaseops.io',
        subject: message.subject ?? '(no subject)',
        body: message.renderedBody,
        generatedAt: new Date().toISOString(),
        instructions:
          'Compose and send this email to the recipient using your email client.',
      },
      null,
      2,
    );
  }

  private buildSmsContent(message: MessageInput): string {
    return [
      `TO: ${message.recipientAddr}`,
      `GENERATED: ${new Date().toISOString()}`,
      'CHANNEL: SMS',
      '---',
      message.renderedBody,
    ].join('\n');
  }

  private buildEnterpriseImContent(message: MessageInput): string {
    return JSON.stringify(
      {
        packageType: 'ENTERPRISE_IM',
        recipient: message.recipientAddr,
        subject: message.subject ?? null,
        text: message.renderedBody,
        generatedAt: new Date().toISOString(),
        instructions:
          'Send this message via your enterprise instant messaging platform ' +
          '(e.g. Slack, Microsoft Teams, Google Chat).',
      },
      null,
      2,
    );
  }
}

export const fileGenerator = new FileGenerator();
