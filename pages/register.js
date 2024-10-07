import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import axios from 'axios';
import Link from 'next/link';

export default function Register() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSignup = async () => {
    try {
      // Step 1: Fetch registration options from the server using Axios
      const res = await axios.get(`/api/register?email=${email}`);
      const options = res.data;

      // Step 2: Use WebAuthn API to create credentials
      const registrationResponse = await startRegistration(options);

      // Step 3: Send the registration response back to the server for verification using Axios
      const verifyRes = await axios.post('/api/verify-register', registrationResponse);

      if (verifyRes.data.verified) {
        setMessage('Registration successful!');
      } else {
        setMessage('Registration failed.');
      }
    } catch (error) {
      // Check if the error is from the backend
      if (error.response && error.response.data && error.response.data.error) {
        setMessage(`Error: ${error.response.data.error}`);
      } else {
        // Generic error handling
        console.error('Error during registration:', error);
        setMessage('An error occurred during registration.');
      }
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleSignup}>Sign Up</button>
      {message && <p>{message}</p>}
      <Link href="/">
        <button>Back to Home</button>
      </Link>
    </div>
  );
}
