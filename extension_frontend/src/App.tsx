import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [bias, setBias] = useState<{ bias?: string; agreeance?: string; totalVotes?: number; agreeRatio?: number; allsidesPage?: string } | string>('Loading...');
  const [publication, setPublication] = useState('');
  const [title, setTitle] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [showBias, setShowBias] = useState(true); // Toggle state for showing bias vs. title/content

  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'checkBias' });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'biasResult') {
        setBias(message.bias);
        setPublication(message.bias.sourceName);
      }
      if (message.action === 'contentResult') {
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

  // const handleReload = () => {
  //   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  //     if (tabs[0].id) {
  //       chrome.tabs.reload(tabs[0].id);
  //     }
  //   });
  // };

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
            <h2>Title & Content</h2>
            <p>Title: {title}</p>
            <p>Content: {content}</p>
            {/* <button onClick={handleReload}> Reload web page</button> */}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
