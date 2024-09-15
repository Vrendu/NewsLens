// contentScript.js

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'checkBias') {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const title = tabs[0].title;
            const content = tabs[0].innerHTML;

            chrome.runtime.sendMessage({ action: 'contentResult', title: title, content: content });
        });
    }
})


       


