// contentScript.js

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'biasResult') {
        // Handle the bias result here, e.g., update the frontend
        console.log('Bias Result:', message.bias);
    }
});
