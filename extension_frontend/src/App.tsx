import { useState, useEffect } from 'react';
import './App.css';

// Define the structure of the bias data
interface BiasData {
  name: string;
  bias: string;
  agree: number;
  disagree: number;
  agree_ratio: number;
  allsides_page: string;
  total_votes: number;
}

function App() {
  const [bias, setBias] = useState<BiasData | string>('Loading...');
  const [publication, setPublication] = useState('');

  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'checkBias' });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'biasResult') {
        if (typeof message.bias === 'string') {
          setBias(message.bias); // If it's an error or message string
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
        <h2>AllSides Bias</h2>
        <p>
          {typeof bias === 'string' ? bias : `${publication} : ${bias.bias}`}
          <br />
          {typeof bias === 'string' ? '' : `Total Votes: ${bias.total_votes}`}
          <br />
          {typeof bias === 'string' ? '' : `Agree: ${bias.agree}, Disagree: ${bias.disagree}`}
          <br />
          {typeof bias === 'string' ? '' : `Agree Ratio: ${(bias.agree_ratio).toFixed(2)}`}
          <br />
          {typeof bias === 'string' ? '' : (
            <a href={bias.allsides_page} target="_blank" rel="noopener noreferrer">
              Read More...
            </a>
          )}
        </p>
      </div>
    </>
  );
}

export default App;
