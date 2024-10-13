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
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge: user.webauthnCredentials[0].challenge, // Ensure challenge is stored
      expectedOrigin: 'http://localhost:3000', // Replace with your origin
      expectedRPID: 'localhost',
    });

    if (verification.verified) {
      res.status(200).json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: 'Verification failed' });
    }
  } catch (error) {
    console.error('Error during authentication verification:', error);
    res.status(500).json({ error: 'Failed to verify authentication.' });
  }
}
