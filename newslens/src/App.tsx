import { useState } from 'react';
import './App.css'

function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const onClick = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.id !== undefined) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const title = document.title;
          const content = document.body.innerText.slice(0, 50000); // Get first 500 characters of the body
          return { title, content };
        }
      }, (results) => {
        const [result] = results;
        if (result && result.result) {
          const { title, content } = result.result;
          setTitle(title);  // Set the title in state
          setContent(content);  // Set the content in state
        }
      });
    } else {
      console.error('Tab ID is undefined.');
    }
  };

  return (
    <>
      <h1>NewsLens</h1>
      <div className="card">
        <button onClick={() => onClick()}>
          <p>Click me</p>
        </button>
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
