import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [bias, setBias] = useState<{ bias?: string; agreeance?: string; totalVotes?: number; agreeRatio?: number; allsidesPage?: string } | string>('Loading...');
  const [publication, setPublication] = useState('');
  const [content, setContent] = useState('');
  const [showBias, setShowBias] = useState(true); 

  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'checkBias' });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'biasResult') {
        setBias(message.bias);
        setPublication(message.bias.sourceName);
      }
      if (message.action === 'contentResult') {
        setContent(message.results?.search_results || 'Server error, please try again later.');
      }
    });
  }, []);

  const toggleView = () => {
    setShowBias((prevShowBias) => {
      if (prevShowBias === true) {
        if (!content) {
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
        {/* Conditionally render based on the toggle state */}
        {showBias ? (
          <div>
            <h2>Bias</h2>
            <p>
              {typeof bias === 'string' ? bias : publication + " : " + bias.bias || 'No bias data available'}
              <br />
              {typeof bias === 'string' ? '' : ' (' + bias.agreeance + ' - ' + bias.agreeRatio?.toPrecision(3) + '%)' }
              <br />
              {typeof bias === 'string' ? '' : ' Total vote: ' + bias.totalVotes}
              <br />
              


            </p>
          </div>
        ) : (
          <div>
              <h2>Content</h2>
              <p>{JSON.stringify(content)}</p>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
