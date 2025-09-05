import { useState } from 'react';
import CurrentPagePanel from './components/CurrentPagePanel.js';
import URLsPanel from './components/URLsPanel.js';
import FileImagePanel from './components/FileImagePanel.js';

const TABS = [
  { key: 'current', label: 'Current Page', icon: '📄' },
  { key: 'urls', label: 'URLs', icon: '🔗' },
  { key: 'file', label: 'File & Image', icon: '📁' }
];

function App() {
  const [activeTab, setActiveTab] = useState('current');

  return (
    <div className="h-screen bg-white text-gray-900 flex flex-col">
      <header className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Web Scraper</h1>
            <p className="text-sm text-gray-600">AI-powered data extraction</p>
          </div>
        </div>
      </header>

      <nav className="bg-gray-50 border-b border-gray-200">
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === tab.key
                  ? 'bg-purple-600 text-white border-b-2 border-purple-400'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
        {activeTab === 'current' && <CurrentPagePanel />}
        {activeTab === 'urls' && <URLsPanel />}
        {activeTab === 'file' && <FileImagePanel />}
        </div>
      </main>

      <footer className="bg-gray-50 p-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>v1.0.0</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>disconnected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;