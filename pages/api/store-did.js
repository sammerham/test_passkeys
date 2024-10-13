// /pages/api/store-did.js

import { PrismaClient } from '@prisma/client';
import { getCookie } from 'cookies-next';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { did, credentialId } = req.body; // Ensure you're getting credentialId from the request body

    // Log the incoming request body for debugging
    console.log('Request Body:', req.body); // Debugging line

    // Retrieve user ID from cookies
    const userId = getCookie('userId', { req, res });

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID found' });
    }

    try {
      const didKey = await prisma.didKey.create({
        data: {
          userId: parseInt(userId), // Ensure the ID is an integer
          didKey: did, // Store the public DID
          credentialId: credentialId, // Make sure to include credentialId here
        },
      });

      res.status(200).json(didKey);
    } catch (error) {
      console.error('Error storing DID:', error);
      res.status(500).json({ error: 'Failed to store DID.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
