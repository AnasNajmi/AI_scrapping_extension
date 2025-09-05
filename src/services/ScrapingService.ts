import type { ExtractionConfig, ExtractionResult, ExtractedRowWithMeta, ContentScriptMessage } from '../types/scraping.js';

export class ScrapingService {
  private static instance: ScrapingService | null = null;

  public static getInstance(): ScrapingService {
    if (!ScrapingService.instance) {
      ScrapingService.instance = new ScrapingService();
    }
    return ScrapingService.instance;
  }

  private async getActiveTab(): Promise<chrome.tabs.Tab> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0] || !tabs[0].id) throw new Error('No active tab found');
    
    // Check if tab is accessible
    const tab = tabs[0];
    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('moz-extension://')) {
      throw new Error('Cannot access browser internal pages. Please navigate to a regular website.');
    }
    
    return tab;
  }

  private async injectContentScript(tabId: number): Promise<void> {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // First, check if content script is already loaded
        const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' }).catch(() => null);
        
        if (response && response.success) {
          return; // Content script is already loaded and responding
        }
        
        // Inject content script
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        });
        
        // Wait for script to load and test connection
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const testResponse = await chrome.tabs.sendMessage(tabId, { action: 'ping' }).catch(() => null);
        if (testResponse && testResponse.success) {
          return;
        }
        
      } catch (error: any) {
        console.error(`Content script injection attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          if (error.message?.includes('Cannot access') || error.message?.includes('chrome://')) {
            throw new Error('Cannot access this page. Please navigate to a regular website and try again.');
          }
          throw new Error('Unable to access the current page. Please refresh and try again.');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async sendMessage(tabId: number, message: ContentScriptMessage): Promise<any> {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, message);
        if (!response.success) throw new Error(response.error || 'Content script operation failed');
        return response;
      } catch (error: any) {
        const isConnectionError = error.message?.includes('port is moved into back/forward cache') || error.message?.includes('message channel is closed') || error.message?.includes('Receiving end does not exist');
        if (isConnectionError && attempt < maxRetries) {
          await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }
        if (attempt === maxRetries) {
          if (isConnectionError) throw new Error('Connection lost to the page. Please refresh the page and try again.');
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async extractCurrentPage(config: ExtractionConfig): Promise<ExtractionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    try {
      const tab = await this.getActiveTab();
      if (!tab.id) throw new Error('Invalid tab ID');
      await this.injectContentScript(tab.id);
      const response = await this.sendMessage(tab.id, { action: 'extractCurrentPage', config });
      const extractedData: ExtractedRowWithMeta[] = response.data || [];
      const deduplicatedData = this.deduplicateData(extractedData, config.dedupeKey);
      const endTime = Date.now();
      return {
        success: true,
        data: deduplicatedData,
        stats: {
          totalPages: 1,
          totalRows: deduplicatedData.length,
          duplicatesRemoved: extractedData.length - deduplicatedData.length,
          errors: 0
        },
        errors: [],
        performance: { startTime, endTime, duration: endTime - startTime }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      return {
        success: false,
        data: [],
        stats: { totalPages: 0, totalRows: 0, duplicatesRemoved: 0, errors: 1 },
        errors,
        performance: { startTime, endTime: Date.now(), duration: Date.now() - startTime }
      };
    }
  }

  async extractWithPagination(config: ExtractionConfig): Promise<ExtractionResult> {
    const startTime = Date.now();
    const allData: ExtractedRowWithMeta[] = [];
    const errors: string[] = [];
    let currentPage = 0;
    try {
      const tab = await this.getActiveTab();
      if (!tab.id) throw new Error('Invalid tab ID');
      await this.injectContentScript(tab.id);
      switch (config.pagination.type) {
        case 'no_pagination': return await this.extractCurrentPage(config);
        case 'infinite_scroll': return await this.extractWithInfiniteScroll(config, tab.id);
        case 'click_pagination': return await this.extractWithClickPagination(config, tab.id);
        default: throw new Error(`Unsupported pagination type: ${config.pagination.type}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      return {
        success: false,
        data: allData,
        stats: { totalPages: currentPage, totalRows: allData.length, duplicatesRemoved: 0, errors: errors.length },
        errors,
        performance: { startTime, endTime: Date.now(), duration: Date.now() - startTime }
      };
    }
  }

  private async extractWithInfiniteScroll(config: ExtractionConfig, tabId: number): Promise<ExtractionResult> {
    const startTime = Date.now();
    try {
      await this.sendMessage(tabId, { action: 'scrollPage', scrollConfig: { maxScrolls: config.pagination.maxScrolls || 10, idleTimeout: config.pagination.idleTimeout || 5000 } });
      const response = await this.sendMessage(tabId, { action: 'extractCurrentPage', config });
      const extractedData: ExtractedRowWithMeta[] = response.data || [];
      const deduplicatedData = this.deduplicateData(extractedData, config.dedupeKey);
      return {
        success: true,
        data: deduplicatedData,
        stats: { totalPages: 1, totalRows: deduplicatedData.length, duplicatesRemoved: extractedData.length - deduplicatedData.length, errors: 0 },
        errors: [],
        performance: { startTime, endTime: Date.now(), duration: Date.now() - startTime }
      };
    } catch (error) { throw error; }
  }

  private async extractWithClickPagination(config: ExtractionConfig, tabId: number): Promise<ExtractionResult> {
    const startTime = Date.now();
    const allData: ExtractedRowWithMeta[] = [];
    let currentPage = 0;
    const maxPages = config.pagination.maxPages || 10;
    try {
      while (currentPage < maxPages) {
        await this.injectContentScript(tabId);
        const response = await this.sendMessage(tabId, { action: 'extractCurrentPage', config });
        const pageData: ExtractedRowWithMeta[] = response.data || [];
        pageData.forEach(row => { row._meta.pageIndex = currentPage; });
        allData.push(...pageData);
        currentPage++;
        if (config.pagination.nextSelector) {
          await this.injectContentScript(tabId);
          const clickResponse = await this.sendMessage(tabId, { action: 'clickNextPage', nextSelector: config.pagination.nextSelector });
          if (!clickResponse.success) break;
          await new Promise(resolve => setTimeout(resolve, 3000));
          await this.injectContentScript(tabId);
        } else break;
      }
      const deduplicatedData = this.deduplicateData(allData, config.dedupeKey);
      return {
        success: true,
        data: deduplicatedData,
        stats: { totalPages: currentPage, totalRows: deduplicatedData.length, duplicatesRemoved: allData.length - deduplicatedData.length, errors: 0 },
        errors: [],
        performance: { startTime, endTime: Date.now(), duration: Date.now() - startTime }
      };
    } catch (error) { throw error; }
  }

  private deduplicateData(data: ExtractedRowWithMeta[], dedupeKey?: string): ExtractedRowWithMeta[] {
    if (!dedupeKey || data.length === 0) return data;
    const seen = new Set<string>();
    const deduplicated: ExtractedRowWithMeta[] = [];
    for (const row of data) {
      const keyValue = row[dedupeKey];
      if (keyValue && typeof keyValue === 'string') {
        const key = keyValue.trim().toLowerCase();
        if (!seen.has(key)) { seen.add(key); deduplicated.push(row); }
      } else deduplicated.push(row);
    }
    return deduplicated;
  }

  async getCurrentPageInfo(): Promise<{ url: string; title: string; domain: string }> {
    try {
      const tab = await this.getActiveTab();
      if (!tab.id) throw new Error('Invalid tab ID');
      
      // Wait a bit for page to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await this.injectContentScript(tab.id);
      const response = await this.sendMessage(tab.id, { action: 'getPageInfo' });
      return response.pageInfo;
    } catch (error: any) {
      console.error('Failed to get page info:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('Cannot access')) {
        throw new Error('Cannot access this page. Please navigate to a regular website.');
      } else if (error.message?.includes('No active tab')) {
        throw new Error('No active tab found. Please make sure you have a tab open.');
      } else if (error.message?.includes('refresh')) {
        throw error; // Re-throw refresh message as-is
      } else {
        throw new Error('Unable to access the current page. Please refresh and try again.');
      }
    }
  }
}
