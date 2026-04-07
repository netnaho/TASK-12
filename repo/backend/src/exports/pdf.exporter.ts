import PDFDocument from 'pdfkit';
import type { IExporter, ExportOptions } from './interfaces';

export class PdfExporter implements IExporter {
  readonly contentType = 'application/pdf';
  readonly extension = 'pdf';

  async export(
    rows: Record<string, unknown>[],
    options: ExportOptions,
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Watermark
      if (options.watermark) {
        doc
          .save()
          .rotate(-45, { origin: [300, 400] })
          .opacity(0.08)
          .fontSize(40)
          .text(options.watermark, 80, 300, { align: 'center' })
          .restore()
          .opacity(1);
      }

      // Title
      doc.fontSize(16).font('Helvetica-Bold').text(options.filename, { align: 'center' });
      doc.moveDown();

      // Column widths
      const colCount = options.columns.length;
      const pageWidth = doc.page.width - 80;
      const colWidth = pageWidth / colCount;

      // Header row
      doc.fontSize(10).font('Helvetica-Bold');
      let x = 40;
      for (const col of options.columns) {
        doc.text(col.header, x, doc.y, { width: colWidth, lineBreak: false });
        x += colWidth;
      }
      doc.moveDown(0.5);
      doc
        .moveTo(40, doc.y)
        .lineTo(40 + pageWidth, doc.y)
        .stroke();
      doc.moveDown(0.5);

      // Data rows
      doc.fontSize(9).font('Helvetica');
      for (const row of rows) {
        // New page if needed
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
        }
        x = 40;
        const rowY = doc.y;
        for (const col of options.columns) {
          const val = row[col.key] != null ? String(row[col.key]) : '';
          doc.text(val, x, rowY, { width: colWidth, lineBreak: false });
          x += colWidth;
        }
        doc.moveDown(0.4);
      }

      doc.end();
    });
  }
}
