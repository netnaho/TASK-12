import { format } from '@fast-csv/format';
import type { IExporter, ExportOptions } from './interfaces';

export class CsvExporter implements IExporter {
  readonly contentType = 'text/csv';
  readonly extension = 'csv';

  async export(
    rows: Record<string, unknown>[],
    options: ExportOptions,
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      const stream = format({ headers: true, writeBOM: true });
      stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);

      // Write header row using friendly header names
      const header: Record<string, string> = {};
      for (const col of options.columns) {
        header[col.key] = col.header;
      }

      for (const row of rows) {
        const mapped: Record<string, unknown> = {};
        for (const col of options.columns) {
          mapped[col.header] = row[col.key] ?? '';
        }
        stream.write(mapped);
      }

      stream.end();
    });
  }
}
