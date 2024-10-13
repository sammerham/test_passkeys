import { useState } from 'react';
import axios from 'axios';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

export default function Home() {
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      // Step 1: Fetch authentication options from the server
      const res = await axios.get(`/api/auth`);
      const options = res.data;

      // Step 2: Start the authentication process
      const authResponse = await startAuthentication(options);

      // Step 3: Send the authentication response back to the server for verification
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
      // Step 1: Fetch registration options from the server
      const res = await axios.get(`/api/register`);
      const options = res.data;

      // Step 2: Start the registration process
      const registrationResponse = await startRegistration(options);

      // Step 3: Send the registration response back to the server for verification
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
      <h1>Welcome to the PassKey Authentication</h1>
      <button onClick={handleLogin} style={{ margin: '10px' }}>Login</button>
      <button onClick={handleRegister} style={{ margin: '10px' }}>Register</button>

      {/* Display message from login or registration */}
      {message && <p>{message}</p>}
    </div>
  );
}
