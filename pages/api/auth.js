// /pages/api/auth.js

import { PrismaClient } from '@prisma/client';
import { getCookie, setCookie } from 'cookies-next'; // Ensure setCookie is imported
import crypto from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const userId = getCookie('userId', { req, res });

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID found' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        include: {
          webauthnCredentials: true,
          didKeys: true,
        },
      });

      if (!user || user.webauthnCredentials.length === 0) {
        return res.status(404).json({ error: 'User not found or no credentials available' });
      }

      // Generate a new challenge
      const challenge = crypto.randomBytes(32).toString('base64url');
      console.log('Generated Challenge:', challenge);

      // Store the challenge in a cookie
      setCookie('challenge', challenge, { req, res });

      // Prepare the authentication options
      const options = {
        challenge: challenge,
        allowCredentials: user.webauthnCredentials.map(cred => {
          return {
            id: Buffer.from(cred.credentialId, 'base64url'), // Use base64url format for the credential ID
            type: 'public-key',
          };
        }),
      };

      res.status(200).json(options);
    } catch (error) {
      console.error('Error retrieving user:', error);
      res.status(500).json({ error: 'Failed to retrieve user.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
