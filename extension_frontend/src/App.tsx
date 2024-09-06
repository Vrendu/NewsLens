// A

import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);

  // Fetch the news article from content script
  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.title && message.content) {
        setTitle(message.title);
        setContent(message.content);
      }
    });
  }, []);

  // Reload tab function
  const handleReload = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  };

  // Restore user from local storage and listen for storage changes
  useEffect(() => {
    const syncUser = async () => {
      const user = localStorage.getItem('user');
      if (user) {
        setUser(JSON.parse(user));
      }
    };

    syncUser(); // Initial user fetch

    // Listen for local storage
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

      // Sync with localStorage for web app
      localStorage.setItem('user', JSON.stringify(data.user));

      alert('Login successful!');
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

      // Remove from localStorage for web app sync
      localStorage.removeItem('user');

      alert('Logged out successfully!');
    } else {
      alert('Logout failed.');
    }
  };

  return (
    <>
      <h1>NewsLens</h1>

      {user ? (
        <div>
          <button onClick={handleLogout}>Logout</button>
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

      <div className="card">
        <button onClick={handleReload}>Reload</button>
      </div>

      <div>
        <h2>Title:</h2>
        <p>{title}</p>
        <h2>Content:</h2>
        <p>{content}</p>
      </div>
    </>
  );
}

export default App;
