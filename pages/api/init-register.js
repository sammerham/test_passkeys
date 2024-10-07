import { generateRegistrationOptions } from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';  // Use Prisma for the database
import { setCookie } from 'cookies-next';

const prisma = new PrismaClient();
const RP_ID = 'localhost';  

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Check if the user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

// Generate WebAuthn registration options
const options = await generateRegistrationOptions({
  rpID: RP_ID,
  rpName: "Web Dev Simplified",
  userName: email,
})


// Set a cookie with the registration challenge info
setCookie('regInfo', JSON.stringify({
  userId: options.user.id,
  email,
  challenge: options.challenge,
}), { 
  req, 
  res, 
  httpOnly: true, 
  maxAge: 60 * 1000 // Set maxAge for 1 minute (in milliseconds)
});



  
  res.status(200).json(options);
}
