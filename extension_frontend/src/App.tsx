import { useState, useEffect } from 'react';
import './App.css';

// Define the structure of the bias data
interface BiasData {
  name: string;
  mbfc_url: string;
  domain: string;
  bias: string;
  factual_reporting: string;
  country: string;
  credibility: string;
  faviconUrl: string;
}

// Define the structure of related articles


// Function to map biases to colors
const getBiasColor = (bias: string) => {
  switch (bias.toLowerCase()) {
    case 'least biased':
      return '#4caf50'; // Green
    case 'left':
    case 'left-center':
      return '#2196f3'; // Blue
    case 'right':
    case 'right-center':
      return '#f44336'; // Red
    case 'pro-science':
      return '#ff9800'; // Orange
    case 'questionable':
    case 'conspiracy-pseudoscience':
    case 'pseudoscience':
      return '#9e9e9e'; // Gray
    case 'satire':
      return '#9c27b0'; // Purple
    default:
      return '#ffffff'; // White as fallback
  }
};

function App() {
  const [biasData, setBiasData] = useState<BiasData | string>('Loading...');
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [publication, setPublication] = useState('');
  const [logo, setLogo] = useState('');
  const [activeTab, setActiveTab] = useState<'bias' | 'articles'>('bias'); 

  useEffect(() => {
    
    chrome.runtime.sendMessage({ action: 'checkBias' });

    
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'biasResult') {
        if (typeof message.bias === 'string') {
          setBiasData(message.bias);  // If there's an error or no bias data
        } else {
          setLogo(message.faviconUrl);
          setBiasData(message.bias);
          setPublication(message.publication);
        }
      }

      if (message.action === 'relatedArticles') {
        setRelatedArticles(message.articles || []);
        console.log("Related articles:" + relatedArticles);
      }
    });
  }, []);

  // Listen for active tab change and trigger fetchRelatedArticles
  useEffect(() => {
    if (activeTab === 'articles') {
      chrome.runtime.sendMessage({ action: 'fetchRelatedArticles' });
    }
  }, [activeTab]);

  return (
    <>
      <div className="container">
        <h1 className="title">NewsLens</h1>

        {/* Tab Navigation */}
        <div className="tabs">
          <span
            className={`tab ${activeTab === 'bias' ? 'active' : ''}`}
            onClick={() => setActiveTab('bias')}
          >
            Bias Details
          </span>
          <span
            className={`tab ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => setActiveTab('articles')}
          >
            Related Articles
          </span>
        </div>

        <div className="card">
          {/* Show content based on the active tab */}
          {activeTab === 'bias' ? (
            // Bias Details View
            typeof biasData === 'string' ? (
              <p className="error-message">{biasData}</p>  
            ) : (
              <div className="content">
                <div className="publication-header">
                  {logo && (
                    <img src={logo} alt="Favicon" className="favicon" />
                  )}
                </div>
                <ul className="bias-details">
                  <li>
                    <strong>{publication}'s Bias: </strong>
                    <span style={{ background: getBiasColor((biasData as BiasData).bias) }} className="bias-color">
                      {(biasData as BiasData).bias}
                    </span>
                  </li>
                  <li><strong>Factual Reporting:</strong> {(biasData as BiasData).factual_reporting}</li>
                  <li><strong>Credibility:</strong> {(biasData as BiasData).credibility}</li>
                  <a href={(biasData as BiasData).mbfc_url} target="_blank" rel="noopener noreferrer" className="source-link">Media Bias Fact Check Analysis</a>
                </ul>
              </div>
            )
          ) : (
            <div className="related-articles content">
              <h2>Related Articles</h2>
              {relatedArticles.length > 0 ? (
                <ul className="related-articles-list">
                  {relatedArticles.map((article, index) => (
                    <li key={index}>
                      <a href={article['link']} target="_blank" rel="noopener noreferrer" className="article-link">Read Article</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No related articles found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
