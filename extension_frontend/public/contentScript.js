//contentScript.js

(() => {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            const title = document.title;
            const content = document.body.innerText.slice(0, 50000); // Get the first 50,000 characters

            if (chrome.runtime && chrome.runtime.sendMessage) {
                // Send the title and content to the background script or popup
                chrome.runtime.sendMessage({ title, content });
            } else {
                console.error('chrome.runtime or sendMessage is not available.');
            }
        } catch (error) {
            console.error('Error in content script:', error);
        }
   });  
})();
