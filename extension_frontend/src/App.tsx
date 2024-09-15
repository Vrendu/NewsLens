import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [bias, setBias] = useState<{ bias?: string; agreeance?: string; totalVotes?: number; agreeRatio?: number; allsidesPage?: string } | string>('Loading...');
  const [publication, setPublication] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  //const [searchResults, setSearchResults] = useState('dummy result');
  const [showBias, setShowBias] = useState(true); // Toggle state for showing bias vs. title/content

  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'checkBias' });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'biasResult') {
        setBias(message.bias);
        setPublication(message.bias.sourceName);
      }
      if (message.action === 'contentResult') {
        //setSearchResults(message.searchResults);
        setTitle(message.title);
        setContent(message.content);
      }
    });
  }, []);

  const toggleView = () => {
    setShowBias((prevShowBias) => {
      if (prevShowBias === true) {
        // If we are switching from Bias to Title & Content, request page content
        if (!title && !content) {
          chrome.runtime.sendMessage({ action: 'getPageContent' });
        }
      }
      return !prevShowBias;
    });
  };

  return (
    <>
      <h1>NewsLens</h1>

      {/* Toggle button */}
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
            </p>
          </div>
        ) : (
          <div>
            {/* {searchResults && 
              <p>Search Results: {JSON.stringify(searchResults)}</p>
            } */}

            <h2>Title</h2>
            <p>{title}</p>

            <h2>Content</h2>
            <p>{content}</p>
            {/* <button onClick={handleReload}> Reload web page</button> */}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
