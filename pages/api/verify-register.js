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

  const { challenge, email } = JSON.parse(regInfo);

    const verification = await verifyRegistrationResponse({
        response: req.body,
        expectedChallenge: challenge,
        expectedOrigin: CLIENT_URL,
        expectedRPID: RP_ID,
    });

  // Convert Uint8Array to base64 string
  if (verification.verified) {
      // Convert Uint8Array to base64 string
    const publicKeyBase64 = Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64');

    // Save the user's passkey to the database
    await prisma.user.create({
      data: {
        email,
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
      
    // Clear the registration info cookie
    deleteCookie('regInfo', { req, res });

    return res.status(200).json({ verified: true });
  } else {
    return res.status(400).json({ verified: false, error: 'Verification failed' });
  }
}
