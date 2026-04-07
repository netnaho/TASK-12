export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
}

export interface ExportOptions {
  filename: string;
  watermark?: string;
  columns: ExportColumn[];
}

export interface IExporter {
  export(rows: Record<string, unknown>[], options: ExportOptions): Promise<Buffer>;
  readonly contentType: string;
  readonly extension: string;
}
