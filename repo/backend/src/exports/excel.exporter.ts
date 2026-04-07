import ExcelJS from 'exceljs';
import type { IExporter, ExportOptions } from './interfaces';

export class ExcelExporter implements IExporter {
  readonly contentType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  readonly extension = 'xlsx';

  async export(
    rows: Record<string, unknown>[],
    options: ExportOptions,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    // Header row
    sheet.columns = options.columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? 20,
    }));

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    // Data rows
    for (const row of rows) {
      sheet.addRow(row);
    }

    // Watermark in header/footer
    if (options.watermark) {
      sheet.headerFooter.oddHeader = `&C&8${options.watermark}`;
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
