// background.js

// Add a listener for messages from the content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'syncUserFromLocalStorage') {
        // Save user data to chrome.storage.sync
        chrome.storage.sync.set({ user: message.user }, () => {
            console.log('User synced from localStorage to chrome.storage.sync:', message.user);
        });
    }

    if (message.action === 'getUser') {
        chrome.storage.sync.get('user', (result) => {
            sendResponse({ user: result.user });
        });
        return true; // Keep the message channel open for async response
    }
});
