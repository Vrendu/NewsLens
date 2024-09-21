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
  const [publication, setPublication] = useState('');
  const [logo, setLogo] = useState('');

  useEffect(() => {
    // Send message to the background script to check for bias
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
                {/* <h3>{publication}</h3> */}
              </div>
              <ul className="bias-details">
                <li>
                    <strong>{publication}'s Bias: </strong>
                    <span style={{ background: getBiasColor(biasData.bias) }} className="bias-color">
                     {biasData.bias}
                  </span>
                </li>
                <li><strong>Factual Reporting:</strong> {biasData.factual_reporting}</li>
                <li><strong>Credibility:</strong> {biasData.credibility}</li>
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
