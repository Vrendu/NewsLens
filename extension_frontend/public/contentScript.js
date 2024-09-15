// contentScript.js


(() => {
    try {
        const title = document.title;
        const content = document.body.innerText.slice(0, 10000); // Slice the first 10,000 characters of the content
        console.log("Title: " + title + "\nContent: " + content);
        chrome.runtime.sendMessage({ action: 'contentResult', title: title, content: content });
    } catch (error) {
        console.error("Error fetching page content:", error);
    }
})();