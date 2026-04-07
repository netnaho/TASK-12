export interface ExportData {
  title: string;
  columns: { key: string; label: string }[];
  rows: Record<string, any>[];
  metadata: {
    generatedAt: string;
    generatedBy: string;
    reportId: string;
  };
}

export interface ExportOptions {
  watermarkText: string;
  format: string;
}

export interface IReportExporter {
  export(data: ExportData, options: ExportOptions): Promise<Buffer>;
}
