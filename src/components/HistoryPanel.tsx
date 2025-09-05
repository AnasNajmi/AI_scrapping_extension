import { useState } from 'react';

interface HistoryItem {
  id: string;
  timestamp: Date;
  url?: string;
  filename?: string;
  type: 'current-page' | 'urls' | 'files';
  recordCount: number;
  status: 'success' | 'error';
}

function HistoryPanel() {
  const [history] = useState<HistoryItem[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      url: 'https://example.com',
      type: 'current-page',
      recordCount: 25,
      status: 'success'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      filename: 'product-list.csv',
      type: 'files',
      recordCount: 156,
      status: 'success'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      url: 'https://shop.example.com',
      type: 'urls',
      recordCount: 0,
      status: 'error'
    }
  ]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'current-page':
        return '🌐';
      case 'urls':
        return '🔗';
      case 'files':
        return '📁';
      default:
        return '📋';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'current-page':
        return 'Current Page';
      case 'urls':
        return 'URLs';
      case 'files':
        return 'Files';
      default:
        return 'Unknown';
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      console.log('Clearing history...');
      // Implementation would go here
    }
  };

  const rerunScraping = (item: HistoryItem) => {
    console.log('Re-running scraping for:', item);
    alert(`Re-running ${getTypeLabel(item.type)} scraping...`);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Scraping History</h2>
        <button
          onClick={clearHistory}
          className="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Clear All
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📜</div>
          <h3 className="text-lg font-medium text-white mb-2">No History Yet</h3>
          <p className="text-gray-400">Your scraping history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-2xl">{getTypeIcon(item.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-purple-400">
                        {getTypeLabel(item.type)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.status === 'success' 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {item.status === 'success' ? '✓ Success' : '✗ Error'}
                      </span>
                    </div>
                    
                    {item.url && (
                      <p className="text-white text-sm truncate mb-1">{item.url}</p>
                    )}
                    {item.filename && (
                      <p className="text-white text-sm truncate mb-1">{item.filename}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>{formatTimeAgo(item.timestamp)}</span>
                      <span>•</span>
                      <span>{item.recordCount} records</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {item.status === 'success' && (
                    <button className="p-2 text-gray-400 hover:text-white transition-colors" title="Download">
                      ⬇️
                    </button>
                  )}
                  <button 
                    onClick={() => rerunScraping(item)}
                    className="p-2 text-gray-400 hover:text-purple-400 transition-colors" 
                    title="Run again"
                  >
                    🔄
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="text-center">
          <button className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
            Load more history
          </button>
        </div>
      )}
    </div>
  );
}

export default HistoryPanel;
