import { useState } from 'react';
import CurrentPagePanel from './components/CurrentPagePanel';
import URLsPanel from './components/URLsPanel';
import FileImagePanel from './components/FileImagePanel';

console.log('App.tsx loading...');

const TABS = [
  { key: 'current', label: 'Current Page', icon: '📄' },
  { key: 'urls', label: 'URLs', icon: '🔗' },
  { key: 'file', label: 'File & Image', icon: '📁' }
];

function App() {
  console.log('App component rendering...');
  const [activeTab, setActiveTab] = useState('current');

  console.log('About to return JSX...');

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="bg-card p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-glow">
              <span className="text-primary-foreground font-bold text-sm">AI</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">AI Web Scraper</h1>
              <p className="text-sm text-muted-foreground">Intelligent data extraction</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 bg-gradient-primary text-primary-foreground text-sm font-medium rounded-md hover:shadow-glow transition-all">
              Try Pro
            </button>
            <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-destructive-foreground text-xs font-bold">1</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-card border-b border-border">
        <div className="flex px-4">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-3 text-sm font-medium transition-all flex items-center space-x-2 border-b-2 ${
                activeTab === tab.key
                  ? 'text-foreground border-primary bg-primary/10'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="w-full max-w-4xl mx-auto p-6">
          {activeTab === 'current' && <CurrentPagePanel />}
          {activeTab === 'urls' && <URLsPanel />}
          {activeTab === 'file' && <FileImagePanel />}
        </div>
      </main>
    </div>
  );
}

export default App;