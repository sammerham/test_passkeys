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
      const res = await axios.get(`/api/register`);
      const options = res.data;

      const registrationResponse = await startRegistration(options);
      const verifyRes = await axios.post('/api/verify-register', registrationResponse);

      if (verifyRes.data.verified) {
        // Generate DID after successful registration
        const { generate } = await import('@transmute/did-key-ed25519');

        const { didDocument } = await generate(
          {
            secureRandom: () => {
              return crypto.randomBytes(32); // Generate secure random bytes
            },
          },
          { accept: 'application/did+json' }
        );

        console.log('Generated DID Document:', didDocument);

        // Send the DID document and credential ID to the server for storage
        await axios.post('/api/store-did', {
          did: didDocument.id,
          credentialId: verifyRes.data.credentialId, // Ensure this is being passed correctly
        });

        setMessage('Registration successful! DID generated and stored.');
      } else {
        setMessage('Registration failed.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setMessage('An error occurred during registration.');
      setError('Failed to register.');
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
