import { useState, useEffect } from 'react';
import './App.css'

function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.title && message.content) {
        setTitle(message.title);
        setContent(message.content);
      }
    });
  });

  const handleReload = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  };

  return (
    <>
      <h1>NewsLens</h1>
      <div className="card">
        <button onClick={handleReload}>Reload</button>
      </div>
      <div>
        <h2>Title:</h2>
        <p>{title}</p> {/* Display the title */}
        <h2>Content:</h2>
        <p>{content}</p> {/* Display the content */}
      </div>
    </>
  );
}

export default App;
