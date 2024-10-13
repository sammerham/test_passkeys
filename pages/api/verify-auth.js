// /pages/api/verify-auth.js

import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';
import { getCookie } from 'cookies-next';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getCookie('userId', { req, res });

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user ID found' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        webauthnCredentials: true,
        didKeys: true, // Include the DID keys in the response
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Retrieve the challenge stored in cookies
    const expectedChallenge = getCookie('challenge', { req, res });
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Challenge not found' });
    }

    // Retrieve the credential ID from the request body
    const credentialId = req.body.id; // Ensure this matches the key used in the login request
    const credential = user.webauthnCredentials.find(cred => cred.credentialId === credentialId);

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Perform the verification
    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge: expectedChallenge,
      expectedOrigin: 'http://localhost:3000', // Replace with your origin
      expectedRPID: 'localhost',
      authenticator: {
        credentialPublicKey: Buffer.from(credential.publicKey, 'base64'), // Ensure the public key is a Buffer
        counter: credential.counter, // Include the counter from the credential
      },
    });

    if (verification.verified) {
      // Include the user's DIDs in the response
      const dids = user.didKeys.map(did => did.didKey);
      res.status(200).json({ verified: true, dids });
    } else {
      res.status(400).json({ verified: false, error: 'Verification failed' });
    }
  } catch (error) {
    console.error('Error during authentication verification:', error);
    res.status(500).json({ error: 'Failed to verify authentication.' });
  }
}
