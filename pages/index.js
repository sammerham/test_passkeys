// index.js

import { useState } from 'react';
import axios from 'axios';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import crypto from 'crypto';

export default function Home() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.get(`/api/auth`);
      const options = res.data;

      console.log('Authentication Options:', options); // Log the options to inspect them

      // Convert Buffer to Base64 URL string for the startAuthentication function
      options.allowCredentials = options.allowCredentials.map(cred => {
        // Convert Buffer to standard Base64
        const base64Id = Buffer.from(cred.id).toString('base64');

        // Convert standard Base64 to Base64 URL
        const base64UrlId = base64Id.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        return {
          id: base64UrlId, // Use base64 URL format
          type: cred.type,
        };
      });

      const authResponse = await startAuthentication(options);
      const verifyRes = await axios.post('/api/verify-auth', authResponse);

      if (verifyRes.data.verified) {
        setMessage('Successfully logged in.');
      } else {
        setMessage('Login failed.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setMessage('An error occurred during login.');
    }
  };


  const handleRegister = async () => {
  try {
    // Step 1: Check if any WebAuthn credentials exist for the current user
    const credentials = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32), // Dummy challenge for checking credentials
        allowCredentials: [] // This checks for any existing credentials
      }
    });

    if (credentials) {
      // User already has credentials, no need to register again
      setMessage('User is already registered. Please log in.');
      return; // Exit early
    }

    // Step 2: If no credentials are found, proceed with registration
    const res = await axios.get(`/api/register`);
    const options = res.data;

    // Ensure options contain the proper challenge for registration
    if (!options.challenge) {
      throw new Error('Registration options do not contain a valid challenge.');
    }

    // Proceed with WebAuthn registration
    const registrationResponse = await startRegistration(options);
    const verifyRes = await axios.post('/api/verify-register', registrationResponse);

    if (verifyRes.data.verified) {
      setMessage('Registration successful!');
    } else {
      setMessage('Registration failed.');
    }
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      setMessage('No credentials found. Proceeding to registration.');
      // Allow registration if no credentials are found without triggering alternative auth (like QR codes)
      const res = await axios.get(`/api/register`);
      const options = res.data;

      const registrationResponse = await startRegistration(options);
      const verifyRes = await axios.post('/api/verify-register', registrationResponse);

      if (verifyRes.data.verified) {
        setMessage('Registration successful!');
      } else {
        setMessage('Registration failed.');
      }
    } else {
      console.error('Error during registration:', error);
      setMessage('An error occurred during registration.');
      setError('Failed to register.');
    }
  }
  };





  return (
    <div>
      <h1>Welcome to the PassKey Authentication</h1>
      <button onClick={handleLogin} style={{ margin: '10px' }}>Login</button>
      <button onClick={handleRegister} style={{ margin: '10px' }}>Register</button>

      {message && <p>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
