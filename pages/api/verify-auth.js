import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';
import { getCookie, deleteCookie } from 'cookies-next';

const prisma = new PrismaClient();
const RP_ID = 'localhost';
const CLIENT_URL = 'http://localhost:3000';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authInfo = getCookie('authInfo', { req, res });
  if (!authInfo) {
    return res.status(400).json({ error: 'No authentication information found' });
  }

  const { challenge, userId } = JSON.parse(authInfo);
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { passKeys: true } });

  const passKey = user.passKeys.find((key) => key.credentialID === req.body.id);

  if (!passKey) {
    return res.status(400).json({ error: 'Passkey not found for this user' });
  }

  // Convert the public key back from Base64 to a Buffer
  const publicKeyBuffer = Buffer.from(passKey.publicKey, 'base64');

  const verification = await verifyAuthenticationResponse({
    response: req.body,
    expectedChallenge: challenge,
    expectedOrigin: CLIENT_URL,
    expectedRPID: RP_ID,
    authenticator: {
      credentialID: passKey.credentialID,
      credentialPublicKey: publicKeyBuffer, // Use the decoded buffer here
      counter: passKey.counter,
      transports: passKey.transports,
    }
  });

  if (verification.verified) {
    // Update the user's credential counter
    await prisma.passKey.update({
      where: { id: passKey.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    deleteCookie('authInfo', { req, res });
    return res.status(200).json({ verified: true });
  } else {
    return res.status(400).json({ verified: false, error: 'Verification failed' });
  }
}
