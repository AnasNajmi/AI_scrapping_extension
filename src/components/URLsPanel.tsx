import { useState } from 'react';

function URLsPanel() {
  const [urls, setUrls] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [scraperTemplates, setScraperTemplates] = useState([{ id: 1, name: 'Scraper 1' }]);

  const addUrl = () => {
    setUrls([...urls, '']);
  };

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const clearAllUrls = () => {
    setUrls(['']);
  };

  const handleScrape = async () => {
    const validUrls = urls.filter(url => url.trim() !== '');
    if (validUrls.length === 0) {
      alert('Please enter at least one valid URL');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Scraping URLs:', validUrls);
    } catch (error) {
      console.error('URL scraping failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNewScraperTemplate = () => {
    const newId = scraperTemplates.length + 1;
    setScraperTemplates([...scraperTemplates, { id: newId, name: `Scraper ${newId}` }]);
  };

  const deleteScraperTemplate = (id: number) => {
    if (scraperTemplates.length > 1) {
      setScraperTemplates(scraperTemplates.filter(template => template.id !== id));
    }
  };

  const uploadCSVUrls = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const csvUrls = text.split('\n').map(line => line.trim()).filter(line => line !== '');
        setUrls(csvUrls.length > 0 ? csvUrls : ['']);
      };
      reader.readAsText(file);
    }
  };

  const validUrlsCount = urls.filter(url => url.trim() !== '').length;

  return (
    <div className="p-4 space-y-6">
      {/* Step 1: Add URLs */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            1
          </div>
          <h2 className="text-lg font-semibold text-white">Add URLs to Scrape</h2>
        </div>

        <div className="space-y-3">
          {urls.map((url, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="url"
                value={url}
                onChange={(e) => updateUrl(index, e.target.value)}
                placeholder={`Enter URL ${index + 1}...`}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
              />
              {urls.length > 1 && (
                <button
                  onClick={() => removeUrl(index)}
                  className="w-8 h-8 text-red-400 hover:text-red-300 transition-colors flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-3 mt-4">
          <button
            onClick={addUrl}
            className="px-4 py-2 text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1"
          >
            <span>+</span>
            <span>Add URL</span>
          </button>

          <span className="text-gray-500">|</span>

          <label className="px-4 py-2 text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1 cursor-pointer">
            <span>�</span>
            <span>Upload CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={uploadCSVUrls}
              className="hidden"
            />
          </label>

          {urls.length > 1 && (
            <>
              <span className="text-gray-500">|</span>
              <button
                onClick={clearAllUrls}
                className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
              >
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Step 2: Select a Scraper Template */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              2
            </div>
            <h2 className="text-lg font-semibold text-white">Select a Scraper Template</h2>
          </div>
          <button
            className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 text-sm"
            onClick={addNewScraperTemplate}
          >
            <span>+</span>
            <span>New Scraper Template</span>
          </button>
        </div>

        {scraperTemplates.map(template => (
          <div key={template.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4">
            <div className="flex items-center space-x-6 mb-4">
              <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-white font-medium">{template.name}</span>
              <div className="ml-auto flex items-center space-x-2">
                <button
                  className="w-5 h-5 text-gray-400 hover:text-red-400 transition-colors"
                  onClick={() => deleteScraperTemplate(template.id)}
                  title="Delete scraper template"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-400 mb-3">Get started with</div>
              
              <button className="w-full p-3 rounded-lg border-2 border-purple-600 bg-purple-600/10 transition-colors hover:bg-purple-600/20">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-purple-400">✨</span>
                  <span className="text-white">AI Suggest Fields</span>
                </div>
              </button>

              <div className="text-center text-gray-500 text-sm py-2">OR</div>

              <button className="w-full p-3 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors hover:bg-gray-700/50">
                <div className="flex items-center justify-center space-x-2">
                  <span>📝</span>
                  <span className="text-white">Enter Manually</span>
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Scrape Button */}
      <button
        onClick={handleScrape}
        disabled={isLoading || validUrlsCount === 0}
        className={`mt-8 w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          isLoading || validUrlsCount === 0
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Processing {validUrlsCount} URLs...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <span>🌐</span>
            <span>Scrape {validUrlsCount > 0 ? `${validUrlsCount} URLs` : 'URLs'}</span>
          </div>
        )}
      </button>
    </div>
  );
}

export default URLsPanel;
