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
}

function App() {
  const [biasData, setBiasData] = useState<BiasData | string>('Loading...');
  const [publication, setPublication] = useState('');

  useEffect(() => {
    // Send message to the background script to check for bias
    chrome.runtime.sendMessage({ action: 'checkBias' });

    // Listen for the response from the background script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'biasResult') {
        if (typeof message.bias === 'string') {
          setBiasData(message.bias);  // If there's an error or no bias data
        } else {
          setBiasData(message.bias);
          setPublication(message.bias.name);
        }
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
                <h3>{publication}</h3>
              </div>
              <ul className="bias-details">
                <li><strong>Bias:</strong> {biasData.bias}</li>
                <li><strong>Factual Reporting:</strong> {biasData.factual_reporting}</li>
                <li><strong>Country:</strong> {biasData.country}</li>
                <li><strong>Credibility:</strong> {biasData.credibility}</li>
                <li><strong>Domain:</strong> {biasData.domain}</li>
                <a href={biasData.mbfc_url} target="_blank" rel="noopener noreferrer" className="source-link">Read More</a>
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
