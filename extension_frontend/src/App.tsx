import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  // const [user, setUser] = useState(null);

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

  // Login function
  // const handleLogin = async () => {
  //   const res = await fetch('http://localhost:8000/api/session', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({ credential: email, password }),
  //     credentials: 'include', // Include cookies for JWT
  //   });

  //   const data = await res.json();
  //   if (res.ok) {
  //     setUser(data.user);
  //     alert('Login successful!');
  //   } else {
  //     alert('Login failed: ' + JSON.stringify(data.errors));
  //   }
  // };

  // // Signup function (optional)
  // const handleSignup = async () => {
  //   const res = await fetch('http://localhost:8000/api/users', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({ email, password, username: email.split('@')[0] }),
  //     credentials: 'include', // Include cookies for JWT
  //   });

  //   const data = await res.json();
  //   if (res.ok) {
  //     setUser(data.user);
  //     alert('Signup successful!');
  //   } else {
  //     alert('Signup failed: ' + JSON.stringify(data.errors));
  //   }
  // };

  // // Logout function
  // const handleLogout = async () => {
  //   const res = await fetch('http://localhost:8000/api/session', {
  //     method: 'DELETE',
  //     credentials: 'include',
  //   });

  //   if (res.ok) {
  //     setUser(null);
  //     alert('Logged out successfully!');
  //   }
  // };

  return (
    <>
      <h1>NewsLens</h1>

      {/* {user ? (
        <div> */}
          {/* <h2>Welcome, {user.username}</h2> */}
          {/* <button onClick={handleLogout}>Logout</button> */}
        {/* </div>
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
          <button onClick={handleSignup}>Signup</button>
        </div>
      )} */}

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
