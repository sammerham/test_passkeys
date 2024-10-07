import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';
import { setCookie } from 'cookies-next';

const prisma = new PrismaClient();
const RP_ID = 'localhost';  // Your RP ID, can be your domain in production

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;
  const user = await prisma.user.findUnique({ where: { email }, include: { passKeys: true } });

  if (!user) {
    return res.status(400).json({ error: 'No user found' });
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: user.passKeys.map((key) => ({
      id: key.credentialID,
      type: 'public-key',
      transports: key.transports,
    })),
  });
    
  // Set a cookie with the authentication challenge
  setCookie('authInfo', JSON.stringify({
    userId: user.id,
    challenge: options.challenge,
  }), { req, res, httpOnly: true });

  res.status(200).json(options);
}
