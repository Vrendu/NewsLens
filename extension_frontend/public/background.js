// Listener to check the political bias of the current active tab and related articles
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === 'checkBias') {
        // Get the active tab URL and title
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const activeTab = tabs[0];
            const url = activeTab.url;
            const title = activeTab.title;  // Get the title of the active tab

            if (!url) {
                console.error('No URL found for the current tab');
                chrome.runtime.sendMessage({
                    action: 'biasResult',
                    bias: 'No URL found for the current tab',
                });
                return;
            }

            const domain = new URL(url).hostname;
            console.log(`Extracted domain: ${domain}`);

            try {
                // 1. Fetch bias data from the FastAPI backend using the domain name
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
                console.log('Bias data received:', biasData);

                const faviconUrl = activeTab.favIconUrl || '';

                // 2. Send the retrieved bias data to the frontend
                if (biasData.data.length > 0) {
                    chrome.runtime.sendMessage({
                        action: 'biasResult',
                        bias: biasData.data[0],  // Send the first matched result
                        publication: biasData.data[0].name,
                        faviconUrl: faviconUrl,
                    });

                    // 3. If bias data exists, send the title and innerText to the backend to fetch related articles
                    const [innerTextResult] = await chrome.scripting.executeScript({
                        target: { tabId: activeTab.id },
                        function: () => document.body.innerText,  // Extract full article inner text
                    });

                    console.log('Inner text extraction result:', innerTextResult);

                    if (title && innerTextResult && innerTextResult.result) {
                        const relatedArticlesResponse = await fetch(
                            'http://127.0.0.1:8000/related_articles_by_text',
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ title, innerText: innerTextResult.result }),
                            }
                        );

                        if (!relatedArticlesResponse.ok) {
                            throw new Error('Failed to fetch related articles.');
                        }

                        const relatedData = await relatedArticlesResponse.json();
                        console.log('Related articles data received:', relatedData);

                        // 4. Send related articles data to the frontend
                        chrome.runtime.sendMessage({
                            action: 'relatedArticles',
                            articles: relatedData.related_articles,
                        });
                    } else {
                        console.warn('Title or innerText not extracted correctly.');
                    }
                } else {
                    chrome.runtime.sendMessage({
                        action: 'biasResult',
                        bias: 'No bias data available for this domain',
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                chrome.runtime.sendMessage({
                    action: 'biasResult',
                    bias: 'Server error',
                });
            }
        });
    }
});
