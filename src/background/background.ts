// Background script for Agentic AI Web Scraper
// Handles extension events, messaging, and automation

chrome.runtime.onInstalled.addListener(() => {
  console.log('Agentic AI Web Scraper installed!');
  
  // Set up declarative content rules for better page access
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { schemes: ['http', 'https'] }
          })
        ],
        actions: [new chrome.declarativeContent.ShowAction()]
      }
    ]);
  });
});

// Handle action click to open sidepanel
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
      console.log('Sidepanel opened for tab:', tab.id);
    } catch (error) {
      console.error('Failed to open sidepanel:', error);
      // Fallback: try to notify user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/react.svg',
        title: 'Web Scraper',
        message: 'Unable to open sidepanel. Please try again.'
      });
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
  } else if (message.type === 'CHECK_TAB_ACCESS') {
    // Check if current tab is accessible
    if (sender.tab) {
      const tab = sender.tab;
      const isAccessible = tab.url && 
        !tab.url.startsWith('chrome://') && 
        !tab.url.startsWith('chrome-extension://') &&
        !tab.url.startsWith('about:') &&
        !tab.url.startsWith('moz-extension://');
      
      sendResponse({ 
        accessible: isAccessible, 
        url: tab.url,
        reason: isAccessible ? 'ok' : 'browser-internal'
      });
    } else {
      sendResponse({ accessible: false, reason: 'no-tab' });
    }
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
      url: tab.url,
      accessible: !tab.url.startsWith('chrome://') && 
        !tab.url.startsWith('chrome-extension://') &&
        !tab.url.startsWith('about:')
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
