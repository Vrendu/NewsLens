// contentScript.js

(() => {
    try {
        // Read user data from localStorage
        const user = localStorage.getItem('user');
        console.log('User data from localStorage:', user);

        if (user) {
            // Send the user data to the background script
            chrome.runtime.sendMessage({ action: 'syncUserFromLocalStorage', user: JSON.parse(user) });
        }
    } catch (error) {
        console.error('Error in content script:', error);
    }
})();
