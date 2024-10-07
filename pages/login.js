import { useState } from 'react';
import { startAuthentication } from "@simplewebauthn/browser";

import axios from 'axios';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      // Step 1: Fetch authentication options from the server using Axios
      const res = await axios.get(`/api/auth?email=${email}`);
      const options = res.data;

      // Step 2: Use WebAuthn API to authenticate
      const authResponse = await startAuthentication(options);

      // Step 3: Send the authentication response back to the server for verification using Axios
      const verifyRes = await axios.post('/api/verify-auth', authResponse);

      if (verifyRes.data.verified) {
        setMessage(`Successfully logged in: ${email}`);
      } else {
        setMessage('Failed to log in');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setMessage('An error occurred during login.');
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleLogin}>Log In</button>
      {message && <p>{message}</p>}
      <Link href="/">
        <button>Back to Home</button>
      </Link>
    </div>
  );
}
