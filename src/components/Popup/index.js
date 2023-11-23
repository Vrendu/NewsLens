import React, { useState, useEffect } from 'react';
import ArticleList from '.././ArticleList';
import Readability from '@mozilla/readability';
//import { JSDOM } from 'jsdom';

const Popup = () => {
    const [newsInfo, setNewsInfo] = useState(null);

    useEffect(() => {
        const extractNewsInfo = async () => {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                const response = await fetch(tab.url);

                if (!response.ok) {
                    throw new Error('Unable to fetch article');
                }

                const html = await response.text();
                const doc = new JSDOM(html, { url: tab.url });
                const reader = new Readability(doc.window.document);
                const article = reader.parse();

                console.log(article.title, "is the title");
                console.log(article.textContent, "is the content");

                setNewsInfo({
                    title: article.title,
                    content: article.textContent,
                });
            } catch (error) {
                console.error('Error fetching article:', error.message);
            }
        };

        extractNewsInfo();
    }, []);

    return (
        <div>
            <h1>NewsLens</h1>
            <h2>News Info:</h2>
            <div>{newsInfo && JSON.stringify(newsInfo, null, 2)}</div>
            <ArticleList />
        </div>
    );
};

export default Popup;
