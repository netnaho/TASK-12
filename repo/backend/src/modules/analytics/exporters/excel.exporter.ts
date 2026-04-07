import ExcelJS from 'exceljs';
import { IReportExporter, ExportData, ExportOptions } from './exporter.interface';

export class ExcelExporter implements IReportExporter {
  async export(data: ExportData, options: ExportOptions): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LeaseOps';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(data.title || 'Report');

    const columnCount = data.columns.length;

    // Row 1: Watermark (merged across all columns, gray background)
    worksheet.mergeCells(1, 1, 1, columnCount);
    const watermarkCell = worksheet.getCell(1, 1);
    watermarkCell.value = `Exported by: ${options.watermarkText}`;
    watermarkCell.font = { italic: true, color: { argb: 'FF666666' }, size: 9 };
    watermarkCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    watermarkCell.alignment = { horizontal: 'center' };

    // Row 2: Headers (bold)
    const headerRow = worksheet.getRow(2);
    data.columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.label;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
      };
    });

    // Data rows starting row 3
    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows[i];
      const excelRow = worksheet.getRow(i + 3);
      data.columns.forEach((col, idx) => {
        excelRow.getCell(idx + 1).value = row[col.key] ?? '';
      });
    }

    // Auto-width columns
    worksheet.columns = data.columns.map((col) => {
      const maxDataLen = data.rows.reduce((max, row) => {
        const val = String(row[col.key] ?? '');
        return Math.max(max, val.length);
      }, col.label.length);
      return { width: Math.min(maxDataLen + 4, 50) };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
