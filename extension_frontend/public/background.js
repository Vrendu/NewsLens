// background.js

// Add a listener for messages from the content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getUser') {
        chrome.storage.sync.get('user', (result) => {
            sendResponse({ user: result.user });
        });
        return true; // Keep the message channel open for async response
    }

    // listen from browser local storage
    if (message.action === 'setUser') {
        chrome.storage.sync.set({ user: message.user }, () => {
            console.log('User saved to chrome.storage.sync:', message.user);
        });
    }
});
