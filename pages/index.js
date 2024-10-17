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
    // Step 1: Fetch login options from the backend
    const res = await fetch(`/api/auth`, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const options = await res.json();

    // Convert Buffer to Base64 URL string for the startAuthentication function
    options.allowCredentials = options.allowCredentials.map(cred => {
      const base64Id = Buffer.from(cred.id).toString('base64');
      const base64UrlId = base64Id.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return {
        id: base64UrlId,  // Use base64 URL format
        type: cred.type,
      };
    });

    // Step 2: Start authentication using the WebAuthn API
    const authResponse = await startAuthentication(options);

    // Step 3: Verify the authentication response with the backend
    const verifyRes = await axios.post('/api/verify-auth', authResponse);

    if (verifyRes.data.verified) {
      setMessage('Successfully logged in.');
    } else {
      setMessage('Login failed.');
    }
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      // Gracefully handle the case where the user is not registered or cancels the login
      setMessage('No credentials found. You are not registered. Please register.');
    } else {
      console.error('Error during login:', error);
      setMessage('An error occurred during login.');
    }
  }
};






const handleRegister = async () => {
  try {
    // Step 1: Attempt to get existing credentials using only platform (local) authenticators
    const credentials = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32), // Dummy challenge for checking credentials
        allowCredentials: [],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Use platform authenticators like fingerprint readers
        },
        userVerification: "required" // Require biometric verification
      }
    });

    if (credentials) {
      setMessage('User is already registered. Please log in.');
      return; // Exit early if credentials are found
    }

    // Step 2: Proceed with registration if no credentials are found
    const res = await axios.get(`/api/register`);
    const options = await res.data;

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
      setMessage('Registration was canceled. Proceeding to fallback or retry...');

      // Retry or handle the case where registration is canceled
      try {
        const res = await axios.get(`/api/register`);
        const options = await res.data;

        const registrationResponse = await startRegistration(options);
        const verifyRes = await axios.post('/api/verify-register', registrationResponse);

        if (verifyRes.data.verified) {
          setMessage('Registration successful!');
        } else {
          setMessage('Registration failed.');
        }
      } catch (retryError) {
        setMessage('Retry failed. Please try again later.');
      }

    } else {
      console.error('Error during registration:', error);
      setMessage('An unexpected error occurred during registration.');
    }
  } finally {
    // Redirect to the home page without refreshing, regardless of success or failure
    setTimeout(() => {
      setMessage('Redirecting to the home page...');
      window.history.pushState({}, '', '/'); // Change URL without refresh
    }, 2000); // Optional delay for user to read the final message before redirect
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
