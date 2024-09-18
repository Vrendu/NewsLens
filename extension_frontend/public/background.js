// Listener to check the political bias of the current active tab
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === 'checkBias') {
        // Get the active tab URL
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const activeTab = tabs[0];
            const url = activeTab.url;

            if (!url) {
                chrome.runtime.sendMessage({
                    action: 'biasResult',
                    bias: 'No URL found for the current tab'
                });
                return;
            }

            // Fetch the bias data from the FastAPI backend using the tab URL
            try {
                const response = await fetch('http://127.0.0.1:8000/check_bias', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url }) // Send the URL to the backend
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch bias data.');
                }

                const biasData = await response.json();

                // Send the retrieved bias data to the frontend
                if (biasData.name) {
                    chrome.runtime.sendMessage({
                        action: 'biasResult',
                        bias: biasData,
                        publication: biasData.name
                    });
                } else {
                    chrome.runtime.sendMessage({
                        action: 'biasResult',
                        bias: biasData.bias || 'No bias data available'
                    });
                }

            } catch (error) {
                chrome.runtime.sendMessage({
                    action: 'biasResult',
                    bias: 'Error fetching bias data'
                });
            }
        });
    }
});
