import { useState, useEffect } from 'react';
import './App.css';

// Define the structure of the bias data
interface BiasData {
  name: string;
  bias: string;
}

function App() {
  const [bias, setBias] = useState<BiasData | string>('Loading...');
  const [publication, setPublication] = useState('');

  useEffect(() => {
    // Send message to the background script to check for bias
    chrome.runtime.sendMessage({ action: 'checkBias' });

    // Listen for the response from the background script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'biasResult') {
        if (typeof message.bias === 'string') {
          setBias(message.bias);  // If there's an error or no bias data
        } else {
          setBias(message.bias);
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
        <p>
          {typeof bias === 'string' ? bias : `${publication} : ${bias.bias}`}
        </p>
      </div>
    </>
  );
}

export default App;
