import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';
import { setCookie } from 'cookies-next';

const prisma = new PrismaClient();
const RP_ID = 'localhost'; // Replace with your actual RP ID

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Fetch all users and passkeys (you can optimize this by implementing other criteria)
  const users = await prisma.user.findMany({ include: { passKeys: true } });

  if (!users || users.length === 0) {
    return res.status(400).json({ error: 'No users found' });
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: users.flatMap(user => 
      user.passKeys.map((key) => ({
        id: key.credentialID,
        type: 'public-key',
        transports: key.transports,
      }))
    ),
  });

  // Set a cookie with the authentication challenge
  setCookie('authInfo', JSON.stringify({
    challenge: options.challenge,
  }), { req, res, httpOnly: true });

  res.status(200).json(options);
}
