import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [bias, setBias] = useState<{ bias?: string; agreeance?: string; totalVotes?: number; agreeRatio?: number; allsidesPage?: string } | string>('Loading...');
  const [publication, setPublication] = useState('');

  // Fetch the news article from content script
  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'checkBias' });
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'biasResult') {
        //console.log('Bias Result:', message.bias);
        setBias(message.bias); // Assuming message.bias is an object
        setPublication(message.bias.sourceName);
      }

      if (message.action === 'compareBias') {
        console.log('Title:', message.title);
        console.log('Meta Description:', message.metaDescription);
      }
    });
  }, []);

  // Restore user from local storage and listen for storage changes
  useEffect(() => {
    const syncUser = async () => {
      const user = chrome.storage.sync.get('user');
      if (user) {
        setUser(user);
      }
    };

    syncUser(); // Initial user fetch

    // Listen for local storage changes
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes.user) {
        if (changes.user.newValue) {
          setUser(changes.user.newValue);
        } else {
          setUser(null);
        }
      }
    });

    const fetchCsrfToken = async () => {
      const res = await fetch('http://localhost:8000/api/csrf/csrf-token', {
        credentials: 'include',
      });
      const data = await res.json();
      localStorage.setItem('csrfToken', data.csrfToken);
    };

    fetchCsrfToken();
  }, []);

  const handleLogin = async () => {
    const csrfToken = localStorage.getItem('csrfToken') || '';

    const res = await fetch('http://localhost:8000/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ credential: email, password }),
      credentials: 'include',
    });

    const data = await res.json();
    if (res.ok) {
      setUser(data.user);

      // Save user to chrome.storage.sync
      chrome.storage.sync.set({ user: data.user }, () => {
        console.log('User saved to chrome.storage.sync:', data.user);
      });

    } else {
      alert('Login failed: ' + JSON.stringify(data.errors));
    }
  };

  const handleLogout = async () => {
    const csrfToken = localStorage.getItem('csrfToken') || '';

    const res = await fetch('http://localhost:8000/api/session', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': csrfToken,
      },
      credentials: 'include',
    });

    if (res.ok) {
      setUser(null);

      // Clear user from chrome.storage.sync
      chrome.storage.sync.remove('user', () => {
        console.log('User removed from chrome.storage.sync');
      });

    } else {
      alert('Logout failed.');
    }
  };

  const handleCheckBias = () => {
    //chrome.runtime.sendMessage({ action: 'checkBias' });
    //chrome.runtime.sendMessage({ action: 'compareBias'})
  };

  return (
    <>
      <h1>NewsLens</h1>

      {user ? (
        <div>
          <button onClick={handleLogout}>Logout</button>
          <button onClick={handleCheckBias}>Check Bias</button>
        </div>
      ) : (
        <div>
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      )}

      <div>
        <h2>Bias</h2>
        <p>
          {typeof bias === 'string' ? bias : publication + " : " + bias.bias || 'No bias data available'}
        </p>
      </div>
    </>
  );
}

export default App;
