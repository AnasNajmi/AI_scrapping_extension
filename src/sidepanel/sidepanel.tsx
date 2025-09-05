import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import '../index.css';

// Sidepanel-specific initialization
console.log('Sidepanel script loaded');

// Initialize React app in sidepanel
const root = ReactDOM.createRoot(document.getElementById('sidepanel-root')!);

root.render(
  <React.StrictMode>
    <div className="w-full h-screen bg-gray-900 text-white overflow-hidden">
      <App />
    </div>
  </React.StrictMode>
);

// Handle sidepanel-specific functionality
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Sidepanel received message:', message);
  
  if (message.type === 'SIDEPANEL_OPENED') {
    console.log('Sidepanel opened');
    sendResponse({ success: true });
  }
  
  return true;
});

// Notify background script that sidepanel is ready
chrome.runtime.sendMessage({
  type: 'SIDEPANEL_READY',
  timestamp: Date.now()
}).catch(error => {
  console.log('Could not send message to background script:', error);
});
