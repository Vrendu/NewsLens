// background.js

// Listener to handle various actions sent by the frontend
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === 'checkBias') {
        handleCheckBias();
    }

    if (message.action === 'fetchRelatedArticles') {
        handleFetchRelatedArticles();
    }
});

// Function to handle bias checking for the active tab
async function handleCheckBias() {
    // Get the active tab's URL and title
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const activeTab = tabs[0];
        const url = activeTab?.url;
        const title = activeTab?.title;

        if (!url) {
            console.error('No URL found for the current tab');
            chrome.runtime.sendMessage({
                action: 'biasResult',
                bias: 'No URL found for the current tab',
            });
            return;
        }

        const domain = new URL(url).hostname;
       // console.log(`Extracted domain: ${domain}`);

        try {
            // Fetch bias data from the FastAPI backend using the domain name
            const biasResponse = await fetch('http://127.0.0.1:8000/check_bias_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ domain }),
            });

            if (!biasResponse.ok) {
                throw new Error('Failed to fetch bias data.');
            }

            const biasData = await biasResponse.json();
           // console.log('Bias data received:', biasData);

            const faviconUrl = activeTab.favIconUrl || '';

            // Send the retrieved bias data to the frontend
            if (biasData.data && biasData.data.length > 0) {
                chrome.runtime.sendMessage({
                    action: 'biasResult',
                    bias: biasData.data[0],  // Send the first matched result
                    publication: biasData.data[0].name,
                    faviconUrl: faviconUrl,
                });
            } else {
                console.warn('No bias data available for this domain.');
                chrome.runtime.sendMessage({
                    action: 'biasResult',
                    bias: 'No bias data available for this domain',
                });
            }
        } catch (error) {
            console.error('Error fetching bias data:', error);
            chrome.runtime.sendMessage({
                action: 'biasResult',
                bias: 'Server error',
            });
        }
    });
}


// // Function to determine if the URL is likely a news article
function isArticleUrl(url) {
    const articlePatterns = [
        /\/(news|article|story|post|202\d)\/?/i,  // Match URLs with "news", "article", "story", or year (e.g., 2021)
        /\/\d{4}\/\d{2}\/\d{2}\/?/i,  // Match URLs with date patterns like /2021/09/20/
        /\/(politics|world|health|science|technology|sports|opinion|entertainment)\/?/i  // Match category-based sections
    ];
    return articlePatterns.some((pattern) => pattern.test(url));
}


// Function to handle fetching related articles for the active tab
async function handleFetchRelatedArticles() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        const activeTabId = activeTab?.id;
        const url = activeTab?.url;

        if (!activeTabId) {
            console.error('No active tab found to fetch related articles.');
            return;
        } 

        if (!isArticleUrl(url)) {
            console.error('The active tab is not an article.');
            return;
        }

        // Use executeScript to get the title and innerText of the active tab
        chrome.scripting.executeScript(
            {
                target: { tabId: activeTabId },
                func: () => ({
                    title: document.title,
                    innerText: document.body.innerText.slice(0, 5000),  // Capture up to 5000 characters of innerText
                }),
            },
            async (results) => {
                if (results && results[0]) {
                    const { title, innerText } = results[0].result;

                    try {
                        // Send the title and innerText to the backend
                        const response = await fetch('http://127.0.0.1:8000/related_articles_by_text', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ title, innerText }),
                        });

                        if (response.ok) {
                            console.log(`Successfully sent title and innerText to backend: ${title}`);
                        } else {
                            console.error('Failed to send data to backend');
                        }
                    } catch (error) {
                        console.error('Error communicating with backend:', error);
                    }
                }
            }
        );
    });
}