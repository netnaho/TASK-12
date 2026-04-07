import { format } from '@fast-csv/format';
import { IReportExporter, ExportData, ExportOptions } from './exporter.interface';

export class CSVExporter implements IReportExporter {
  async export(data: ExportData, options: ExportOptions): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      const stream = format({ headers: false });

      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => reject(err));

      // Watermark comment row
      stream.write([`# Exported by: ${options.watermarkText}`]);

      // Header row
      stream.write(data.columns.map((col) => col.label));

      // Data rows
      for (const row of data.rows) {
        stream.write(data.columns.map((col) => row[col.key] ?? ''));
      }

      stream.end();
    });
  }
}
