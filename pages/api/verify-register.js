import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';
import { getCookie, deleteCookie } from 'cookies-next';

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
    const publicKeyBase64 = Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64');

    await prisma.user.create({
      data: {
        publicKey: publicKeyBase64,
        passKeys: {
          create: {
            credentialID: verification.registrationInfo.credentialID,
            publicKey: publicKeyBase64,
            counter: verification.registrationInfo.counter,
            deviceType: verification.registrationInfo.credentialDeviceType,
            backedUp: verification.registrationInfo.credentialBackedUp,
            transport: req.body.transports,
          }
        }
      }
    });

    deleteCookie('regInfo', { req, res });
    return res.status(200).json({ verified: true });
  } else {
    return res.status(400).json({ verified: false, error: 'Verification failed' });
  }
}
