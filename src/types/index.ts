// TypeScript interfaces for Agentic AI Web Scraper

export interface ExtractionResult {
  emails: string[];
  phoneNumbers: string[];
  images: string[];
}

export interface ScrapeRequest {
  url: string;
  template: string;
}

export interface ExtractedRow {
  [key: string]: string | string[];
}

export interface Meta {
  pageIndex: number;
  rowIndex: number;
  extractedAt: string;
  source: string;
}

export interface ExtractedRowWithMeta {
  [key: string]: string | string[] | Meta;
  _meta: Meta;
}

export interface FieldConfig {
  name: string;
  selector: string;
  type: 'text' | 'url' | 'image' | 'email' | 'phone' | 'number';
  required: boolean;
  transform?: string;
}

export interface ExtractionConfig {
  fields: FieldConfig[];
  pagination: {
    type: 'no_pagination' | 'click_pagination' | 'infinite_scroll';
    maxPages?: number;
    maxScrolls?: number;
    idleTimeout?: number;
    nextSelector?: string;
  };
  maxRows?: number;
  dedupeKey?: string;
}

export interface ExtractionStats {
  totalPages: number;
  totalRows: number;
  duplicatesRemoved: number;
  errors: number;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
}

export interface ExtendedExtractionResult {
  success: boolean;
  data: ExtractedRowWithMeta[];
  stats: ExtractionStats;
  errors: string[];
  performance: PerformanceMetrics;
}
