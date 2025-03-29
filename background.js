// Background script for AI Studio Prompter extension
// This script runs persistently and manages connections

// Keep track of which tabs have our content script active
const activeTabsWithContentScript = new Set();

// Listen for signals from content scripts when they load
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CONTENT_SCRIPT_LOADED" && sender.tab) {
    // Track that this tab has our content script loaded
    activeTabsWithContentScript.add(sender.tab.id);
    console.log("Content script registered in tab:", sender.tab.id);
    sendResponse({ status: "acknowledged" });
  }
  
  // Handle checks about content script availability
  if (message.type === "CHECK_CONTENT_SCRIPT" && message.tabId) {
    const isActive = activeTabsWithContentScript.has(message.tabId);
    console.log(`Tab ${message.tabId} content script active: ${isActive}`);
    sendResponse({ isActive });
  }
});

// Clean up when tabs are closed or navigated away
chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabsWithContentScript.delete(tabId);
});

// When a tab navigates to a new page, we'll need to recheck
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    // The tab is navigating, so the content script will need to reload
    activeTabsWithContentScript.delete(tabId);
  }
});

console.log("AI Studio Prompter background script initialized");