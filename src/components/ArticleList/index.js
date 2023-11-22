// ArticleList.js
import React, { useEffect, useState } from 'react';

const ArticleList = () => {
    const [currentTab, setCurrentTab] = useState(null);

    useEffect(() => {
        // Get the currently active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            setCurrentTab(currentTab);
        });
    }, []);

    return (
        <div>
            <h2>Current Tab:</h2>
            <pre>{JSON.stringify(currentTab, null, 2)}</pre>
            {/* Add logic to retrieve and display articles from different sources */}
        </div>
    );
};

export default ArticleList;
