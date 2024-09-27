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
interface RelatedArticle {
  DocumentIdentifier: string;
  Themes: string;
  SourceCommonName: string;
  DATE: string;
}

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
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [publication, setPublication] = useState('');
  const [logo, setLogo] = useState('');

  useEffect(() => {
    // Send message to the background script to check for bias and related articles
    chrome.runtime.sendMessage({ action: 'checkBias' });

    // Listen for the response from the background script
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
      }
    });
  }, []);

  return (
    <>
      <div className="container">
        <h1 className="title">NewsLens</h1>

        <div className="card">
          {typeof biasData === 'string' ? (
            <p className="error-message">{biasData}</p>  // Show error or loading message
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
                <a href={(biasData as BiasData).mbfc_url} target="_blank" rel="noopener noreferrer" className="source-link">Read More</a>
              </ul>

              {/* Display Related Articles Section */}
              <div className="related-articles">
                <h2>Related Articles</h2>
                {relatedArticles.length > 0 ? (
                  <ul className="related-articles-list">
                    {relatedArticles.map((article, index) => (
                      <li key={index}>
                        <a href={article.DocumentIdentifier} target="_blank" rel="noopener noreferrer">
                          {article.SourceCommonName} - {new Date(article.DATE).toLocaleDateString()}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No related articles found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
