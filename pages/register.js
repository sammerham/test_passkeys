// register.js
import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import axios from 'axios';
import Link from 'next/link';

export default function Register() {
  const [message, setMessage] = useState('');

  const handleSignup = async () => {
    try {
      // Step 1: Fetch registration options from the server
      const res = await axios.get('/api/register');
      const options = res.data;

      // Step 2: Use WebAuthn API to create credentials
      const registrationResponse = await startRegistration(options);

      // Step 3: Send the registration response to the server for verification
      const verifyRes = await axios.post('/api/verify-register', registrationResponse);

      if (verifyRes.data.verified) {
        setMessage('Registration successful!');
      } else {
        setMessage('Registration failed.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setMessage('An error occurred during registration.');
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <button onClick={handleSignup}>Sign Up</button>
      {message && <p>{message}</p>}
      <Link href="/">
        <button>Back to Home</button>
      </Link>
    </div>
  );
}
