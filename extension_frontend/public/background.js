// background.js

// Define patterns for CNN sections: Business and general CNN news
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
    // Matches anything that comes after foxnews.com/opinion
    {
        pattern: /^https:\/\/www\.foxnews\.com\/opinion/,
        publication: "Fox News (Opinion)"
    },
    // Matches anything that comes after foxbusiness.com
    {
        pattern: /^https:\/\/www\.foxbusiness\.com/,
        publication: "Fox News Business"
    },
    // Matches any other URL that comes after foxnews.com
    {
        pattern: /^https:\/\/www\.foxnews\.com/,
        publication: "Fox News (Online News)"
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
                const response = await fetch("https://storage.googleapis.com/kagglesdsdata/datasets/1491526/2641594/allsides.json?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=gcp-kaggle-com%40kaggle-161607.iam.gserviceaccount.com%2F20240914%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20240914T005736Z&X-Goog-Expires=259200&X-Goog-SignedHeaders=host&X-Goog-Signature=7693fce5165af3a2a4abb76dacb839a1547bb52c903f240fa1b84941eab9caac4afed4483172ee9e71eda97e07d6f630d2229aa43eeadf79bce2bdcd10b71ca1d49f566b6f551ee743e462923e113cdb4c3348d15b78baad4445d50a80edd4662d462863321348944013d899354718fd663e10f436f1623140dd081d5ea15768893e03cb22ff59085d55f00acd07ee0a073d13c917a7c5cdb5e0f25a959fa336b74596cadb2b7990b35a68f4c4bfa2d97b434c28511ed5f73539c383d46adf2a1130c0e1592e76ffb7de6e03c7b6af59b4309520fb67628e1fffd9f1a97891552c1158d9e98e624affb61d18cbd4a67f16bc64b5086dfb1418e0c12c025f44b8");
                if (!response.ok) {
                    throw new Error("Failed to fetch bias data.");
                }

                const biasData = await response.json();
               // console.log(biasData);

                // Determine the bias for the matched publication
                const bias = determineBias(publication, biasData);
                //console.log("bias: ", bias);

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
                    chrome.runtime.sendMessage({ action: 'contentResult', title, content });
                    console.log("Title: ", title);
                    console.log("Content: ", content);
                    // Send the title and content to the FastAPI server /search endpoint
                    fetch('http://127.0.0.1:8000/search', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ title, content }) // Stringify the body here
                    })
                        .then(response => response.json())
                        .then(data => {
                            console.log(data);
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
