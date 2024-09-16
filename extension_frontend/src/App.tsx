import { useState, useEffect } from 'react';
import './App.css';

// Define the structure of a URL item
interface UrlItem {
  url: string;
  source: string;
  date: string;
}

function App() {
  const [bias, setBias] = useState<{ bias?: string; agreeance?: string; totalVotes?: number; agreeRatio?: number; allsidesPage?: string } | string>('Loading...');
  const [publication, setPublication] = useState('');
  const [urls, setUrls] = useState<UrlItem[]>([]);  // Array of UrlItems
  const [showBias, setShowBias] = useState(true);

  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'checkBias' });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'biasResult') {
        setBias(message.bias);
        setPublication(message.bias.sourceName);
      }
      if (message.action === 'contentResult') {
        setUrls(message.results || []);  // Set URLs from the backend
      }
    });
  }, []);

  const toggleView = () => {
    setShowBias((prevShowBias) => {
      if (prevShowBias === true) {
        if (!urls.length) {
          chrome.runtime.sendMessage({ action: 'getPageContent' });
        }
      }
      return !prevShowBias;
    });
  };

  return (
    <>
      <h1>NewsLens</h1>

      <button onClick={toggleView}>
        {showBias ? 'Comparison' : 'Bias Data'}
      </button>

      <div>
        {showBias ? (
          <div>
            <h2>Bias</h2>
            <p>
              {typeof bias === 'string' ? bias : publication + " : " + bias.bias || 'No bias data available'}
              <br />
              {typeof bias === 'string' ? '' : ' (' + bias.agreeance + ' - ' + bias.agreeRatio?.toPrecision(3) + '%)'}
              <br />
              {typeof bias === 'string' ? '' : ' Total vote: ' + bias.totalVotes}
            </p>
          </div>
        ) : (
          <div>
            <h2>Related Articles</h2>
            <ul>
              {urls.map((item, index) => (
                <li key={index}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.url} - {item.source} (Date: {item.date})
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
