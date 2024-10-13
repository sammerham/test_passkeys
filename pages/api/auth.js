// /pages/api/auth.js

import { PrismaClient } from '@prisma/client';
import { getCookie } from 'cookies-next';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const userId = getCookie('userId', { req, res });

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID found' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) }, // Ensure the ID is an integer
        include: {
          webauthnCredentials: true,
          didKeys: true,
        },
      });

      if (!user || user.webauthnCredentials.length === 0) {
        return res.status(404).json({ error: 'User not found or no credentials available' });
      }

      // Prepare the authentication options
      const options = {
        challenge: 'base64-encoded-challenge', // Replace with your challenge generation logic
        allowCredentials: user.webauthnCredentials.map(cred => ({
          id: Buffer.from(cred.credentialId, 'base64').toString('utf8'), // Convert to Buffer
          type: 'public-key',
        })),
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
