import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Build version for production
const root = ReactDOM.createRoot(document.getElementById('sidepanel-root')!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Handle sidepanel-specific functionality
if (typeof (globalThis as any).chrome !== 'undefined' && (globalThis as any).chrome.runtime) {
  (globalThis as any).chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
    console.log('Sidepanel received message:', message);
    
    if (message.type === 'SIDEPANEL_OPENED') {
      console.log('Sidepanel opened');
      sendResponse({ success: true });
    }
    
    return true;
  });

  // Notify background script that sidepanel is ready
  (globalThis as any).chrome.runtime.sendMessage({
    type: 'SIDEPANEL_READY',
    timestamp: Date.now()
  }).catch((error: any) => {
    console.log('Could not send message to background script:', error);
  });
}