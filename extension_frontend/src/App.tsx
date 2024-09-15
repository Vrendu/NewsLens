import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [bias, setBias] = useState<{ bias?: string; agreeance?: string; totalVotes?: number; agreeRatio?: number; allsidesPage?: string } | string>('Loading...');
  const [publication, setPublication] = useState('');
  const [title, setTitle] = useState('Default Title');
  const [content, setContent] = useState('Default Content');

  // Fetch the news article from content script
  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'checkBias' });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'biasResult') {
        setBias(message.bias); // Assuming message.bias is an object
        setPublication(message.bias.sourceName);
      }
      if (message.action === 'contentData') {
        setTitle(message.title);
        setContent(message.content);
      }
    });
  }, );


  return (
    <>
      <h1>NewsLens</h1>
      
      <div>
        <h2>Bias</h2>
        <p>
          {typeof bias === 'string' ? bias : publication + " : " + bias.bias || 'No bias data available'}
          {title && <p>Title: {title}</p>}
          {content && <p>Content: {content}</p>}
        </p>
      </div>
    </>
  );
}

export default App;
