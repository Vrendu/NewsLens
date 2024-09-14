// contentScript.js

chrome.runtime.onMessage.addListener((message) => {
    
    if (message.action === 'checkBias') {
        // Extract the title of the page
        const title = document.title;

        // Extract meta description from the page
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

        console.log("Title:", title);
        console.log("Meta Description:", metaDescription);

        // Send the extracted data back to the background script
        chrome.runtime.sendMessage({
            action: 'compareBias',
            title: title,
            metaDescription: metaDescription
        });
    }
});
