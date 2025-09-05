function SettingsPanel() {
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">Export Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Default Export Format
              </label>
              <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="xlsx">Excel (XLSX)</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="include-headers" 
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                defaultChecked
              />
              <label htmlFor="include-headers" className="text-sm text-gray-300">
                Include headers in exported files
              </label>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">Scraping Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Request Delay (seconds)
              </label>
              <input 
                type="number" 
                min="0" 
                max="10" 
                step="0.1"
                defaultValue="1"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Delay between requests to avoid being blocked
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Retries
              </label>
              <input 
                type="number" 
                min="0" 
                max="5" 
                defaultValue="3"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="auto-scroll" 
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="auto-scroll" className="text-sm text-gray-300">
                Enable infinite scroll detection
              </label>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">Storage Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                History Retention (days)
              </label>
              <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="0">Never delete</option>
              </select>
            </div>
            
            <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              Clear All History
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">About</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>Web Scraper Extension v1.0.0</p>
            <p>Built for extracting data from websites with ease</p>
            <div className="flex items-center space-x-4 mt-4">
              <button className="text-purple-400 hover:text-purple-300 transition-colors">
                Documentation
              </button>
              <button className="text-purple-400 hover:text-purple-300 transition-colors">
                Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
