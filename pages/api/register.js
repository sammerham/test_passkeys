// /pages/api/register.js

import { generateRegistrationOptions } from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';
import { setCookie } from 'cookies-next';
import crypto from 'crypto';

const prisma = new PrismaClient();
const RP_ID = 'localhost';  // Replace with your actual RP ID

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const options = await generateRegistrationOptions({
    rpID: RP_ID,
    rpName: 'Iden2_passKey',
    userName: 'AnonymousUser',  // Placeholder name since no email is used
  });

  setCookie('regInfo', JSON.stringify({
    challenge: options.challenge,
  }), { req, res, httpOnly: true });

  res.status(200).json(options);
}
