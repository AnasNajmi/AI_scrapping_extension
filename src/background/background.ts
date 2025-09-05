// Background script for Agentic AI Web Scraper
// Handles extension events, messaging, and automation

chrome.runtime.onInstalled.addListener(() => {
  console.log('Agentic AI Web Scraper installed!');
});

// Handle action click to open sidepanel
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
      console.log('Sidepanel opened for tab:', tab.id);
    } catch (error) {
      console.error('Failed to open sidepanel:', error);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.type === 'SCRAPE_REQUEST') {
    // Handle scrape request
    sendResponse({ status: 'received', data: null });
  } else if (message.type === 'SIDEPANEL_READY') {
    console.log('Sidepanel is ready');
    sendResponse({ status: 'acknowledged' });
  } else if (message.type === 'OPEN_SIDEPANEL') {
    // Open sidepanel for specific tab
    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('Failed to open sidepanel:', error);
        sendResponse({ success: false, error: error.message });
      });
    }
    return true; // Keep message channel open for async response
  }
  
  return true;
});

// Handle tab updates to manage sidepanel state
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tabId, tab.url);
    // Notify sidepanel of tab changes if needed
    chrome.runtime.sendMessage({
      type: 'TAB_UPDATED',
      tabId,
      url: tab.url
    }).catch(() => {
      // Sidepanel might not be open, ignore error
    });
  }
});

// Handle sidepanel specific events
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel') {
    console.log('Sidepanel connected');
    
    port.onDisconnect.addListener(() => {
      console.log('Sidepanel disconnected');
    });
    
    port.onMessage.addListener((message) => {
      console.log('Message from sidepanel:', message);
    });
  }
});
