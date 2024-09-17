// background.js


const domainPatterns = [
    // Matches URLs with a date or a word followed by business-related sections for CNN Business
    {
        pattern: /^https:\/\/www\.cnn\.com\/(\d{4}\/\d{2}\/\d{2}|[a-zA-Z]+)\/(business|investing|markets|media|tech|success|economy|companies)/,
        publication: "CNN Business"
    },
    // Matches any other cnn.com URL (non-business sections)
    {
        pattern: /^https:\/\/www\.cnn\.com/,
        publication: "CNN (Online News)"
    },
    {
        pattern: /^https:\/\/www\.foxnews\.com/,
        publication: "Fox News (Online News)"
    },
    // Matches anything that comes after foxnews.com/opinion
    {
        pattern: /^https:\/\/www\.foxnews\.com\/opinion/,
        publication: "Fox News (Opinion)"
    },

    {
        pattern: /^https:\/\/www\.foxbusiness\.com/,
        publication: "Fox News Business"
    }
];


// Function to match the URL to a specific publication
function getPublication(url) {
    for (const { pattern, publication } of domainPatterns) {
        if (pattern.test(url)) {
            return publication;
        }
    }
    return null;
}

// Listener to check the political bias of the current active tab
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === 'checkBias') {
        // Get the active tab URL
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const activeTab = tabs[0];
            const url = activeTab.url;

            // Determine which news publication the URL belongs to (specific to CNN)
            const publication = getPublication(url);

            if (!publication) {
                //console.log('No publication found for the current URL');
                chrome.runtime.sendMessage({
                    action: 'biasResult',
                    bias: 'No publication found for this URL'
                });
                return;
            }

            // Fetch the bias data from the AllSides dataset
            try {
                const response = await fetch("https://storage.googleapis.com/kagglesdsdata/datasets/1491526/2641594/allsides.json?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=gcp-kaggle-com%40kaggle-161607.iam.gserviceaccount.com%2F20240917%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20240917T013139Z&X-Goog-Expires=259200&X-Goog-SignedHeaders=host&X-Goog-Signature=07cf353b19bf206712e8f156fd0edd0d288b61c978f71238e01d7d21a3bb70e9ca7633080bf372c1ff579fc5a41ff9182243d360d12dfafe8776c6af78a1ce00cdc9e5d1ad355f5e5cf0a1dd027a94ee517fd95c4a42593ada28c6aa10d08fe8544019c09e767fd3f2074a757f7a308624b7b9a0507dce28ce7db415b1315d6b90304c61f79a84d82d89b62f98ca9580e955acaff307c3de73c7ebaa6b3334226681d9f7dea32f5f1f3e8ebd1447eca6a5a51dc91ff1bc8fce31efac19ab25bc10c25ede06fabe2b966aa09ad28db16bcc15a3136e9eed24dd1784fc6a2e30cd59a72fa1b6a3fe1fe478e3d6b8ca1fa3b6d92db315e828f150b1bb33897c7235");
                if (!response.ok) {
                    throw new Error("Failed to fetch bias data.");
                }

                const biasData = await response.json();
               

                // Determine the bias for the matched publication
                const bias = determineBias(publication, biasData);
                console.log("bias: ", bias);

                if (bias) {
                    chrome.runtime.sendMessage({
                        action: 'biasResult',
                        bias: bias, 
                        publication: publication
                    });
                } else {
                    chrome.runtime.sendMessage({
                        action: 'biasResult',
                        bias: 'No bias information found for ' + publication
                    });
                }

            } catch (error) {
                //console.error("Error fetching bias data:", error);
                chrome.runtime.sendMessage({
                    action: 'biasResult',
                    bias: 'Error fetching bias data'
                });
            }
        });
    }
    if (message.action === 'getPageContent') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: getPageContent
            }, (results) => {
                if (results && results[0] && results[0].result) {
                    const { title, content } = results[0].result;

                    // Extract keywords from the content
                    const keywords = extractKeywords(content);
                    chrome.runtime.sendMessage({ action: 'contentResult', title, keywords });

                    // Send the keywords and title to the backend instead of the entire content
                    fetch('http://127.0.0.1:8000/search', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ title, keywords })  // Send title and keywords
                    })
                        .then(response => response.json())
                        .then(data => {
                            chrome.runtime.sendMessage({ action: 'contentResult', results: data });
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        });
                }
            });
        });
    }
});

function getPageContent() {
    return {
        title: document.title,
        content: document.body.innerText.slice(0, 10000) // Slice the first 10,000 characters
    };
}
function extractKeywords(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g); // Match all words
    const wordFreq = {};

    // Count word frequencies
    words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Define common stop words to exclude
    const stopWords = ["the", "and", "or", "but", "if", "with", "in", "of", "on", "to", "for", "is", "it", "this"];

    // Get the top 10 most frequent words, excluding stop words
    const sortedWords = Object.entries(wordFreq)
        .filter(([word]) => !stopWords.includes(word))  // Filter out stop words
        .sort(([, a], [, b]) => b - a)  // Sort by frequency
        .slice(0, 10);  // Take top 10 words

    return sortedWords.map(([word]) => word);  // Return just the keywords
}


// Function to determine bias from the fetched dataset
function determineBias(publication, biasData) {
    const lowerCasePublication = publication.toLowerCase();
    for (const source of biasData) {
        const lowerCaseSourceName = source.name.toLowerCase();
        if (lowerCaseSourceName.includes(lowerCasePublication) || lowerCasePublication.includes(lowerCaseSourceName)) {
            return {
                bias: source.bias,
                agreeance: source.agreeance_text,
                totalVotes: source.total_votes,
                agreeRatio: source.agree_ratio,
                allsidesPage: source.allsides_page,
                sourceName: source.name
            };
        }
    }
    return null;
}
