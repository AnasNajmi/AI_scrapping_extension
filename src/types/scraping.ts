export interface PaginationConfig {
  type: 'no_pagination' | 'click_pagination' | 'infinite_scroll';
  maxPages?: number;
  maxScrolls?: number;
  idleTimeout?: number;
  nextSelector?: string;
}

export interface ExtractionField {
  name: string;
  selector: string;
  type: 'text' | 'url' | 'attribute';
  attribute?: string;
  required?: boolean;
}

export interface ExtractionConfig {
  fields: ExtractionField[];
  pagination: PaginationConfig;
  maxRows?: number;
  dedupeKey?: string;
}

export interface ExtractedRow {
  [fieldName: string]: string | null;
}

export interface RowMetadata {
  sourceUrl: string;
  pageIndex: number;
  rowIndex: number;
  timestamp: number;
}

export type ExtractedRowWithMeta = ExtractedRow & { _meta: RowMetadata };

export interface ExtractionResult {
  success: boolean;
  data: ExtractedRowWithMeta[];
  stats: {
    totalPages: number;
    totalRows: number;
    duplicatesRemoved: number;
    errors: number;
  };
  errors: string[];
  performance: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

export interface ContentScriptMessage {
  action: 'extract' | 'extractCurrentPage' | 'scrollPage' | 'clickNextPage' | 'getPageInfo';
  config?: ExtractionConfig;
  scrollConfig?: { maxScrolls: number; idleTimeout: number };
  nextSelector?: string;
}

export interface ContentScriptResponse {
  success: boolean;
  data?: any;
  error?: string;
  pageInfo?: { url: string; title: string; domain: string };
}
