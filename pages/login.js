import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import axios from 'axios';
import Link from 'next/link';

export default function Login() {
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      // Step 1: Fetch authentication options from the server
      const res = await axios.get(`/api/auth`);  // No need for publicKey here
      const options = res.data;

      // Step 2: Start the authentication process with WebAuthn
      const authResponse = await startAuthentication(options);

      // Step 3: Send the authentication response (containing credentialID) back to the server for verification
      const verifyRes = await axios.post('/api/verify-auth', authResponse);

      if (verifyRes.data.verified) {
        setMessage('Successfully logged in.');
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
      <button onClick={handleLogin}>Log In</button>
      {message && <p>{message}</p>}
      <Link href="/">
        <button>Back to Home</button>
      </Link>
    </div>
  );
}
