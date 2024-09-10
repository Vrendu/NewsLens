// background.js

chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === 'checkBias') {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const activeTab = tabs[0];
            const url = activeTab.url;

            // Logic to determine which news publication the URL belongs to
            const publication = getPublication(url);

            if (!publication) {
                console.log('No publication found for the current URL');
                return;
            }

            // Fetch the bias data from AllSides
            try {
                const response = await fetch("https://storage.googleapis.com/kagglesdsdata/datasets/1491526/2641594/allsides.json?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=gcp-kaggle-com%40kaggle-161607.iam.gserviceaccount.com%2F20240910%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20240910T201409Z&X-Goog-Expires=259200&X-Goog-SignedHeaders=host&X-Goog-Signature=1d78418cacdc26d75a5e9f60dedd35ae6674ccd27933294e7d1d6e6b6db467b48df636a8c1cd02d9dd98e5fa02ef5497ccedc99c3a6629ff8c0b948f309ed33a415eab2e8448cdb38ea2154d2160f689601dd54fc7f3e3529c72a8f0169877bbbeba4632fc3b72f2d34cad27711043c5841b9caed724be075ac87d484f792e7256e4fe4891bc7956655bbdf5450160169f67e215177df94f15eb58f7d3a22e2926a3eef77525276135cdb5ff0cca03962a499ec493e49ec53050b1af170063851d746f5c7953ba8bc3d1fd5f4ea8913c6904b18ec59fd1459d4207ba822cc87703c5898c839511d4293a5d1831217a931a4fc632464f8b81f4603ec726299146");

                if (!response.ok) {
                    throw new Error("Failed to fetch bias data.");
                }

                const biasData = await response.json();
                console.log(biasData);

                // Process the biasData and find the bias for the URL's publication
                const bias = determineBias(publication, biasData);
                console.log(bias)

                if (bias) {
                    chrome.runtime.sendMessage({
                        action: 'biasResult',
                        bias: bias
                    });
                } else {
                    chrome.runtime.sendMessage({
                        action: 'biasResult',
                        bias: 'No bias information found for ' + publication
                    });
                }

            } catch (error) {
                console.error("Error fetching bias data:", error);
            }
        });
    }
});

function determineBias(publication, biasData) {
    for (const source of biasData) {
        if (publication.includes(source.name)) {
            return {
                bias: source.bias,
                agreeance: source.agreeance_text,
                totalVotes: source.total_votes,
                agreeRatio: source.agree_ratio,
                allsidesPage: source.allsides_page
            };
        }
    }
    return null;
}

function getPublication(url) {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace("www.", "");
    return "CNN Business";
}
