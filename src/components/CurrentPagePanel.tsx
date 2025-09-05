import { useState, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ScrapingService } from '../services/ScrapingService';
import type { ExtractionConfig, ExtractionResult, ExtractionField } from '../types/scraping';

interface PaginationOption {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const PAGINATION_OPTIONS: PaginationOption[] = [
  {
    key: 'no_pagination',
    label: 'No pagination',
    description: 'Scrape content only on this current page.',
    icon: '📄'
  },
  {
    key: 'click_pagination',
    label: 'Click pagination',
    description: 'Scrape content by clicking through page links.',
    icon: '🖱️'
  },
  {
    key: 'infinite_scroll',
    label: 'Infinite scroll',
    description: 'Scrape content by scrolling down to load items.',
    icon: '⏬'
  }
];

function CurrentPagePanel() {
  const [selectedPagination, setSelectedPagination] = useState('no_pagination');
  const [showPaginationDropdown, setShowPaginationDropdown] = useState(false);
  const [scraperTemplates, setScraperTemplates] = useState([{ id: 1, name: 'Scraper 1' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPageInfo, setCurrentPageInfo] = useState<{ url: string; title: string; domain: string } | null>(null);
  const [showFields, setShowFields] = useState(false);
  const [fields, setFields] = useState(['Title', 'url', 'text']);

  const scrapingService = ScrapingService.getInstance();

  useEffect(() => {
    loadCurrentPageInfo();
  }, []);

  const loadCurrentPageInfo = async () => {
    try {
      const pageInfo = await scrapingService.getCurrentPageInfo();
      setCurrentPageInfo(pageInfo);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Failed to load page info:', err);
      
      // Handle specific error cases
      if (err instanceof Error) {
        if (err.message.includes('Cannot access browser internal pages')) {
          setError('Cannot access browser internal pages. Please navigate to a regular website.');
        } else if (err.message.includes('No active tab')) {
          setError('No active tab found. Please make sure you have a tab open.');
        } else if (err.message.includes('refresh')) {
          setError(err.message);
        } else {
          setError('Unable to access the current page. Please refresh and try again.');
        }
      } else {
        setError('Unable to access the current page. Please refresh and try again.');
      }
    }
  };

  const createSampleExtractionConfig = (): ExtractionConfig => {
    const extractionFields: ExtractionField[] = [
      {
        name: 'title',
        selector: 'h1, h2, h3, h4, .headline, .title, [class*="title"], [class*="headline"], .story-title, .article-title',
        type: 'text',
        required: false
      },
      {
        name: 'text',
        selector: 'p, .story-text, .article-content, .content, .description, [class*="content"], [class*="story"], .summary, .excerpt',
        type: 'text',
        required: false
      },
      {
        name: 'links',
        selector: 'a[href]',
        type: 'url',
        required: false
      },
      {
        name: 'images',
        selector: 'img[src]',
        type: 'url',
        required: false
      }
    ];

    return {
      fields: extractionFields,
      pagination: {
        type: selectedPagination as any,
        maxPages: 5,
        maxScrolls: 10,
        idleTimeout: 5000,
        nextSelector: 'a#pnnext, a[aria-label="Next"], a[aria-label="Next page"], .next, .pagination-next, [class*="next"]'
      },
      maxRows: 500
    };
  };

  const handleScrapeData = async () => {
    setIsLoading(true);
    setError(null);
    setExtractionResult(null);

    try {
      const config = createSampleExtractionConfig();
      console.log('Starting extraction with config:', config);

      let result: ExtractionResult;

      if (selectedPagination === 'no_pagination') {
        result = await scrapingService.extractCurrentPage(config);
      } else {
        result = await scrapingService.extractWithPagination(config);
      }

      setExtractionResult(result);

      if (!result.success && result.errors.length > 0) {
        setError(result.errors.join(', '));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Scraping failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAsCSV = () => {
    if (!extractionResult || extractionResult.data.length === 0) return;

    const headers = Object.keys(extractionResult.data[0]).filter(key => key !== '_meta');
    const csvContent = [
      headers.join(','),
      ...extractionResult.data.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row];
          const csvValue = typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : '';
          return csvValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `scraped-data-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAsJSON = () => {
    if (!extractionResult) return;

    const jsonContent = JSON.stringify(extractionResult, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `scraped-data-${Date.now()}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async () => {
    if (!extractionResult || extractionResult.data.length === 0) return;

    const headers = Object.keys(extractionResult.data[0]).filter(key => key !== '_meta');
    const tsvContent = [
      headers.join('\t'),
      ...extractionResult.data.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row];
          return typeof value === 'string' ? value : '';
        }).join('\t')
      )
    ].join('\n');

    try {
      await navigator.clipboard.writeText(tsvContent);
      alert('Data copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const selectedPaginationOption = PAGINATION_OPTIONS.find(opt => opt.key === selectedPagination);

  const addNewScraperTemplate = () => {
    const newId = scraperTemplates.length + 1;
    setScraperTemplates([...scraperTemplates, { id: newId, name: `Scraper ${newId}` }]);
  };

  const deleteScraperTemplate = (id: number) => {
    if (scraperTemplates.length <= 1) {
      alert('At least one scraper template must remain.');
      return;
    }
    setScraperTemplates(scraperTemplates.filter(template => template.id !== id));
  };

  const addField = () => {
    setFields([...fields, `Field ${fields.length + 1}`]);
  };

  const removeField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  return (
    <ErrorBoundary fallback="Error loading current page panel. Please refresh and try again.">
      <div className="space-y-8">
        {/* Step 1: Choose a Data Source */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-muted-foreground text-sm font-bold">1</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">Choose a Data Source</h2>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-muted rounded-lg p-1">
            <button className="bg-card text-foreground px-4 py-2 rounded-md text-sm font-medium shadow-sm">
              Current Page
            </button>
            <button className="text-muted-foreground px-4 py-2 rounded-md text-sm font-medium hover:text-foreground transition-colors">
              URLs
            </button>
            <button className="text-muted-foreground px-4 py-2 rounded-md text-sm font-medium hover:text-foreground transition-colors">
              File & Image
            </button>
          </div>

          {/* Current Page Info */}
          {currentPageInfo && (
            <div className="flex items-center space-x-3 p-4 bg-card border border-border rounded-lg">
              <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                <span className="text-success-foreground text-xs">G</span>
              </div>
              <div className="flex-1">
                <div className="text-foreground font-medium">{currentPageInfo.title}</div>
                <div className="text-muted-foreground text-sm">{currentPageInfo.domain}</div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="w-5 h-5 bg-destructive rounded-full flex items-center justify-center mt-0.5">
                <span className="text-destructive-foreground text-xs">✕</span>
              </div>
              <div className="flex-1">
                <span className="text-destructive text-sm block mb-2">{error}</span>
                <button
                  onClick={loadCurrentPageInfo}
                  className="px-3 py-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs rounded transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Pagination Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPaginationDropdown(!showPaginationDropdown)}
              className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{selectedPaginationOption?.icon}</span>
                <span className="text-foreground font-medium">{selectedPaginationOption?.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-glow">
                  <span className="text-primary-foreground text-sm">✨</span>
                </button>
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {showPaginationDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-elegant z-50">
                {PAGINATION_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => {
                      setSelectedPagination(option.key);
                      setShowPaginationDropdown(false);
                    }}
                    className="w-full flex items-start space-x-3 p-4 hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <span className="text-lg mt-0.5">{option.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-medium">{option.label}</span>
                        {option.key === selectedPagination && (
                          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Select a Scraper Template */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-muted-foreground text-sm font-bold">2</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Select a Scraper Template</h2>
            </div>
            <button
              className="flex items-center space-x-2 text-primary hover:text-primary-glow text-sm font-medium transition-colors"
              onClick={addNewScraperTemplate}
            >
              <span className="text-lg">+</span>
              <span>New Scraper Template</span>
            </button>
          </div>

          {scraperTemplates.map((template) => (
            <div key={template.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-xs">✓</span>
                  </div>
                  <span className="text-foreground font-medium">{template.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="w-6 h-6 text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                    onClick={() => deleteScraperTemplate(template.id)}
                    title="Delete scraper template"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    className="w-6 h-6 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                    onClick={() => setShowFields(!showFields)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-primary text-sm">✨</span>
                  <span className="text-primary text-sm font-medium">AI Improve Fields</span>
                </div>

                {showFields && (
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-6 h-6 text-muted-foreground flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={field}
                            onChange={(e) => {
                              const newFields = [...fields];
                              newFields[index] = e.target.value;
                              setFields(newFields);
                            }}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            placeholder="Field name"
                          />
                        </div>
                        <button
                          onClick={() => removeField(index)}
                          className="w-6 h-6 text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={addField}
                      className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="text-lg">+</span>
                      <span className="text-sm">Add a Field</span>
                    </button>

                    <div className="pt-4 border-t border-border">
                      <button className="flex items-center justify-between w-full p-3 bg-background border border-border rounded-md hover:border-primary/50 transition-colors">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                          </svg>
                          <span className="text-foreground text-sm">Output as a table</span>
                        </div>
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Extraction Results */}
        {extractionResult && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Extraction Results</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${extractionResult.success
                  ? 'bg-success/20 text-success'
                  : 'bg-destructive/20 text-destructive'
                }`}>
                {extractionResult.success ? 'Success' : 'Failed'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pages:</span>
                <span className="text-foreground font-medium">{extractionResult.stats.totalPages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Rows:</span>
                <span className="text-foreground font-medium">{extractionResult.stats.totalRows}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duplicates Removed:</span>
                <span className="text-foreground font-medium">{extractionResult.stats.duplicatesRemoved}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="text-foreground font-medium">{(extractionResult.performance.duration / 1000).toFixed(2)}s</span>
              </div>
            </div>

            {extractionResult.data.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={downloadAsCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-success hover:bg-success/90 text-success-foreground text-sm font-medium rounded-md transition-colors"
                >
                  <span>📊</span>
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={downloadAsJSON}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-md transition-colors"
                >
                  <span>📄</span>
                  <span>Download JSON</span>
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-medium rounded-md transition-colors"
                >
                  <span>📋</span>
                  <span>Copy Table</span>
                </button>
              </div>
            )}

            {extractionResult.data.length > 0 && (
              <div className="bg-background border border-border rounded-lg p-4 max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {Object.keys(extractionResult.data[0])
                        .filter(key => key !== '_meta')
                        .map((header) => (
                          <th key={header} className="px-3 py-2 text-left text-muted-foreground font-medium capitalize">
                            {header}
                          </th>
                        ))}
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractionResult.data.map((row, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/30">
                        {Object.keys(row)
                          .filter(key => key !== '_meta')
                          .map((key) => (
                            <td key={key} className="px-3 py-2 text-foreground max-w-xs truncate" title={String(row[key as keyof typeof row] || '')}>
                              {row[key as keyof typeof row] || '-'}
                            </td>
                          ))}
                        <td className="px-3 py-2 text-muted-foreground text-xs">
                          Page {row._meta.pageIndex + 1}, Row {row._meta.rowIndex + 1}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {extractionResult.errors.length > 0 && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="text-destructive font-medium mb-2">Errors:</h4>
                <ul className="text-destructive text-sm space-y-1">
                  {extractionResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Scrape Button */}
        <button
          onClick={handleScrapeData}
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-lg font-medium transition-all flex items-center justify-center space-x-3 ${isLoading
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-gradient-primary text-primary-foreground hover:shadow-glow'
            }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
              <span>Scraping...</span>
            </>
          ) : (
            <>
              <span className="text-lg">🔧</span>
              <span>Scrape</span>
            </>
          )}
        </button>
      </div>
    </ErrorBoundary>
  );
}

export default CurrentPagePanel;