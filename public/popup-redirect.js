// Immediately open MemoDock in a dedicated full tab on clicking the extension icon
try {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    window.close();
  } else {
    window.open('/index.html', '_blank');
    window.close();
  }
} catch (err) {
  // Fallback to normal popup if restricted
}
