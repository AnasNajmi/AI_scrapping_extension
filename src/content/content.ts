// Content script for web scraping extension

interface PageInfo {
  url: string;
  title: string;
  domain: string;
}

interface ExtractionField {
  name: string;
  selector: string;
  type: 'text' | 'url' | 'attribute';
  attribute?: string;
  required?: boolean;
}

interface PaginationConfig {
  type: 'no_pagination' | 'click_pagination' | 'infinite_scroll';
  maxPages?: number;
  maxScrolls?: number;
  idleTimeout?: number;
  nextSelector?: string;
}

interface ExtractionConfig {
  fields: ExtractionField[];
  pagination: PaginationConfig;
  maxRows?: number;
  dedupeKey?: string;
}

interface RowMetadata {
  sourceUrl: string;
  pageIndex: number;
  rowIndex: number;
  timestamp: number;
}

interface ExtractedRow {
  [fieldName: string]: string | null;
}

type ExtractedRowWithMeta = ExtractedRow & { _meta: RowMetadata };

// Get page information
function getPageInfo(): PageInfo {
  return {
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname
  };
}

// Extract data from the current page
function extractDataFromPage(config: ExtractionConfig): ExtractedRowWithMeta[] {
  const results: ExtractedRowWithMeta[] = [];
  const containers = new Set<Element>();

  // Find all containers that might hold data
  config.fields.forEach((field: ExtractionField) => {
    try {
      const elements = document.querySelectorAll(field.selector);
      elements.forEach(element => {
        // Try to find the closest container element
        let container = element.closest('[class*="item"], [class*="card"], [class*="post"], [class*="article"], [class*="product"], tr, li');
        if (!container) {
          container = element.parentElement;
        }
        if (container) {
          containers.add(container);
        }
      });
    } catch (error) {
      console.warn(`Invalid selector for field ${field.name}:`, field.selector);
    }
  });

  // If no containers found, use the entire page
  if (containers.size === 0) {
    containers.add(document.body);
  }

  let rowIndex = 0;
  containers.forEach(container => {
    const extractedData: ExtractedRow = {};
    const metadata: RowMetadata = {
      sourceUrl: window.location.href,
      pageIndex: 0,
      rowIndex: rowIndex++,
      timestamp: Date.now()
    };

    let hasData = false;

    config.fields.forEach((field: ExtractionField) => {
      try {
        const element = container.querySelector(field.selector);
        let value: string | null = null;

        if (element) {
          switch (field.type) {
            case 'text':
              value = element.textContent?.trim() || null;
              break;
            case 'url':
              value = (element as HTMLAnchorElement).href || 
                    (element as HTMLImageElement).src || 
                    element.getAttribute('href') || 
                    element.getAttribute('src') || null;
              break;
            case 'attribute':
              if (field.attribute) {
                value = element.getAttribute(field.attribute) || null;
              }
              break;
          }
        }

        if (value) {
          hasData = true;
        }

        extractedData[field.name] = value;
      } catch (error) {
        console.warn(`Error extracting field ${field.name}:`, error);
        extractedData[field.name] = null;
      }
    });

    // Only add if we found some data
    if (hasData) {
      const dataWithMeta = {
        ...extractedData,
        _meta: metadata
      } as ExtractedRowWithMeta;
      results.push(dataWithMeta);
    }
  });

  return results.slice(0, config.maxRows || 500);
}

// Scroll page for infinite scroll pagination
async function scrollPage(scrollConfig: { maxScrolls: number; idleTimeout: number }): Promise<boolean> {
  return new Promise((resolve) => {
    let scrollCount = 0;
    let lastHeight = document.body.scrollHeight;
    let idleTimer: NodeJS.Timeout;

    const scroll = () => {
      if (scrollCount >= scrollConfig.maxScrolls) {
        resolve(true);
        return;
      }

      window.scrollTo(0, document.body.scrollHeight);
      scrollCount++;

      // Clear existing timer
      if (idleTimer) {
        clearTimeout(idleTimer);
      }

      // Set timer to check for new content
      idleTimer = setTimeout(() => {
        const newHeight = document.body.scrollHeight;
        if (newHeight > lastHeight) {
          lastHeight = newHeight;
          scroll();
        } else {
          resolve(true);
        }
      }, scrollConfig.idleTimeout);
    };

    scroll();
  });
}

// Click next page for click pagination
function clickNextPage(nextSelector: string): boolean {
  try {
    const nextButton = document.querySelector(nextSelector) as HTMLElement;
    if (nextButton && nextButton.offsetParent !== null) { // Check if visible
      nextButton.click();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error clicking next page:', error);
    return false;
  }
}

// Message listener
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  try {
    switch (message.action) {
      case 'getPageInfo':
        sendResponse({
          success: true,
          pageInfo: getPageInfo()
        });
        break;

      case 'extractCurrentPage':
        if (!message.config) {
          sendResponse({
            success: false,
            error: 'No extraction config provided'
          });
          break;
        }
        
        try {
          const data = extractDataFromPage(message.config);
          sendResponse({
            success: true,
            data: data
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error during extraction'
          });
        }
        break;

      case 'scrollPage':
        if (!message.scrollConfig) {
          sendResponse({
            success: false,
            error: 'No scroll config provided'
          });
          break;
        }
        
        scrollPage(message.scrollConfig)
          .then(() => {
            sendResponse({
              success: true
            });
          })
          .catch((error) => {
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error during scrolling'
            });
          });
        return true; // Keep message channel open for async response
        
      case 'clickNextPage':
        if (!message.nextSelector) {
          sendResponse({
            success: false,
            error: 'No next selector provided'
          });
          break;
        }
        
        const success = clickNextPage(message.nextSelector);
        sendResponse({
          success: success
        });
        break;

      default:
        sendResponse({
          success: false,
          error: `Unknown action: ${message.action}`
        });
    }
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in content script'
    });
  }

  return false; // Don't keep message channel open unless explicitly needed
});

// Signal that content script is loaded
console.log('Web Scraper content script loaded');
