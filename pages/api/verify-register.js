// /pages/api/verify-register.js

import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';
import { getCookie, deleteCookie, setCookie } from 'cookies-next';
import crypto from 'crypto';

const prisma = new PrismaClient();
const RP_ID = 'localhost';
const CLIENT_URL = 'http://localhost:3000';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const regInfo = getCookie('regInfo', { req, res });
  if (!regInfo) {
    return res.status(400).json({ error: 'No registration information found' });
  }

  const { challenge } = JSON.parse(regInfo);

  const verification = await verifyRegistrationResponse({
    response: req.body,
    expectedChallenge: challenge,
    expectedOrigin: CLIENT_URL,
    expectedRPID: RP_ID,
  });

  if (verification.verified) {
    const user = await prisma.user.create({
      data: {
        webauthnCredentials: {
          create: {
            credentialId: verification.registrationInfo.credentialID,
            publicKey: Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64'),
            counter: verification.registrationInfo.counter, // Store counter here
            deviceType: verification.registrationInfo.credentialDeviceType,
            backedUp: verification.registrationInfo.credentialBackedUp,
          },
        },
      },
    });

    // Generate a new DID for the user after successful registration
    const didKey = `did:key:${crypto.randomBytes(32).toString('hex')}`; // Generate your DID

    // Store the DID key associated with the user
    await prisma.didKey.create({
      data: {
        userId: user.id,
        didKey: didKey,
        credentialId: verification.registrationInfo.credentialID, // Associate DID with the credential
      },
    });

    // Set the user ID in a cookie after successful registration
    setCookie('userId', user.id.toString(), { req, res });

    deleteCookie('regInfo', { req, res });

    // Return the credentialId and DID in the response
    return res.status(200).json({
      verified: true,
      credentialId: verification.registrationInfo.credentialID,
      did: didKey, // Include the DID in the response
    });
  } else {
    return res.status(400).json({ verified: false, error: 'Verification failed' });
  }
}
