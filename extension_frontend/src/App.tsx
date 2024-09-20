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
      <h1>NewsLens</h1>

      <div>
        <h2>MBFC Bias</h2>
        {typeof biasData === 'string' ? (
          <p>{biasData}</p>  // Show error or loading message
        ) : (
          <div>
            <p><strong>Publication:</strong> {publication}</p>
            <p><strong>Bias:</strong> {biasData.bias}</p>
            <p><strong>Factual Reporting:</strong> {biasData.factual_reporting}</p>
            <p><strong>Country:</strong> {biasData.country}</p>
            <p><strong>Credibility:</strong> {biasData.credibility}</p>
            <p><strong>Domain:</strong> {biasData.domain}</p>
            <p><strong>MBFC URL:</strong> <a href={biasData.mbfc_url} target="_blank" rel="noopener noreferrer">Visit Source</a></p>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
