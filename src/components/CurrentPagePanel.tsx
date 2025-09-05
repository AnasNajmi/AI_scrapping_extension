import { useState, useEffect } from 'react';
import { ScrapingService } from '../services/ScrapingService.js';
import type { ExtractionConfig, ExtractionResult, ExtractionField } from '../types/scraping.js';

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

  const scrapingService = ScrapingService.getInstance();

  useEffect(() => {
    loadCurrentPageInfo();
  }, []);

  const loadCurrentPageInfo = async () => {
    try {
      const pageInfo = await scrapingService.getCurrentPageInfo();
      setCurrentPageInfo(pageInfo);
    } catch (err) {
      console.error('Failed to load page info:', err);
      setError('Unable to access current page. Please refresh and try again.');
    }
  };

  const createSampleExtractionConfig = (): ExtractionConfig => {
    const fields: ExtractionField[] = [
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
      fields,
      pagination: {
        type: selectedPagination as any,
        maxPages: 5,
        maxScrolls: 10,
        idleTimeout: 5000,
        nextSelector: 'a[aria-label="Next"], .next, .pagination-next, [class*="next"]'
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

  return (
    <div className="p-4 space-y-6">
      {/* Step 1: Choose a Data Source */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            1
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Choose a Data Source</h2>
        </div>

        {/* Current Page Info */}
        {currentPageInfo && (
          <div className="flex items-center space-x-2 p-3 bg-green-900/20 border border-green-700 rounded-lg mb-4">
            <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <div className="flex-1">
              <div className="text-green-400 text-sm font-medium">{currentPageInfo.title}</div>
              <div className="text-green-300 text-xs">{currentPageInfo.domain}</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-700 rounded-lg mb-4">
            <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✕</span>
            </div>
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Pagination Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPaginationDropdown(!showPaginationDropdown)}
            className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{selectedPaginationOption?.icon}</span>
              <span className="text-gray-900">{selectedPaginationOption?.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">✨</span>
              </button>
              <svg
                className={`w-4 h-4 text-gray-600 transition-transform ${showPaginationDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showPaginationDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              {PAGINATION_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => {
                    setSelectedPagination(option.key);
                    setShowPaginationDropdown(false);
                  }}
                  className="w-full flex items-start space-x-3 p-3 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="text-lg mt-0.5">{option.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 font-medium">{option.label}</span>
                      {option.key === selectedPagination && (
                        <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Select a Scraper Template */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              2
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Select a Scraper Template</h2>
          </div>
          <button
            className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 text-sm"
            onClick={addNewScraperTemplate}
          >
            <span>+</span>
            <span>New Scraper Template</span>
          </button>
        </div>

        {scraperTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg p-4 border border-gray-300 mt-4">
            <div className="flex items-center space-x-6 mb-4">
              <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-gray-900 font-medium">{template.name}</span>
              <div className="ml-auto flex items-center space-x-2">
                <button 
                  className="w-5 h-5 text-gray-600 hover:text-red-600 transition-colors"
                  onClick={() => deleteScraperTemplate(template.id)}
                  title="Delete scraper template"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">Get started with</div>
              
              <button className="w-full p-3 rounded-lg border-2 border-purple-600 bg-purple-600/10 transition-colors hover:bg-purple-600/20">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-purple-400">✨</span>
                  <span className="text-gray-900">AI Suggest Fields</span>
                </div>
              </button>

              <div className="text-center text-gray-500 text-sm py-1">OR</div>

              <button className="w-full p-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors hover:bg-gray-50 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <span>📝</span>
                  <span className="text-gray-900">Enter Manually</span>
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Extraction Results */}
      {extractionResult && (
        <div className="bg-white rounded-lg p-4 border border-gray-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Extraction Results</h3>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              extractionResult.success 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {extractionResult.success ? 'Success' : 'Failed'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-600">Total Pages:</span>
              <span className="text-gray-900 ml-2">{extractionResult.stats.totalPages}</span>
            </div>
            <div>
              <span className="text-gray-400">Total Rows:</span>
              <span className="text-white ml-2">{extractionResult.stats.totalRows}</span>
            </div>
            <div>
              <span className="text-gray-400">Duplicates Removed:</span>
              <span className="text-white ml-2">{extractionResult.stats.duplicatesRemoved}</span>
            </div>
            <div>
              <span className="text-gray-400">Duration:</span>
              <span className="text-white ml-2">{(extractionResult.performance.duration / 1000).toFixed(2)}s</span>
            </div>
          </div>

          {extractionResult.data.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={downloadAsCSV}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
              >
                <span>📊</span>
                <span>Download CSV</span>
              </button>
              <button
                onClick={downloadAsJSON}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
              >
                <span>📄</span>
                <span>Download JSON</span>
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors"
              >
                <span>📋</span>
                <span>Copy Table</span>
              </button>
            </div>
          )}

          {extractionResult.data.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-2">Data Table (All {extractionResult.data.length} rows):</h4>
              <div className="bg-gray-900 rounded p-3 max-h-96 overflow-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      {Object.keys(extractionResult.data[0])
                        .filter(key => key !== '_meta')
                        .map((header) => (
                          <th key={header} className="px-2 py-2 text-gray-300 font-medium capitalize">
                            {header}
                          </th>
                        ))}
                      <th className="px-2 py-2 text-gray-300 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractionResult.data.map((row, index) => (
                      <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                        {Object.keys(row)
                          .filter(key => key !== '_meta')
                          .map((key) => (
                            <td key={key} className="px-2 py-2 text-gray-200 max-w-xs truncate" title={String(row[key as keyof typeof row] || '')}>
                              {row[key as keyof typeof row] || '-'}
                            </td>
                          ))}
                        <td className="px-2 py-2 text-gray-400 text-xs">
                          Page {row._meta.pageIndex + 1}, Row {row._meta.rowIndex + 1}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {extractionResult.data.length > 0 && (
            <details className="mt-4">
              <summary className="text-white font-medium mb-2 cursor-pointer hover:text-gray-300">
                View Raw JSON Data (Click to expand)
              </summary>
              <div className="bg-gray-900 rounded p-3 max-h-48 overflow-y-auto mt-2">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(extractionResult.data, null, 2)}
                </pre>
              </div>
            </details>
          )}

          {extractionResult.errors.length > 0 && (
            <div className="mt-3">
              <h4 className="text-red-400 font-medium mb-2">Errors:</h4>
              <ul className="text-red-300 text-xs space-y-1">
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
        className={`mt-8 w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
          isLoading 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-purple-600 hover:bg-purple-500 text-white'
        }`}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Scraping...</span>
          </>
        ) : (
          <>
            <span>🔧</span>
            <span>Scrape {selectedPaginationOption?.label}</span>
          </>
        )}
      </button>
    </div>
  );
}

export default CurrentPagePanel;
