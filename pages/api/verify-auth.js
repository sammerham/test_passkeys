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

  const { challenge } = JSON.parse(authInfo);

  const user = await prisma.user.findFirst({
    where: { passKeys: { some: { credentialID: req.body.id } } },
    include: { passKeys: true },
  });

  if (!user) {
    return res.status(400).json({ error: 'Passkey not found for this user' });
  }

  const passKey = user.passKeys.find((key) => key.credentialID === req.body.id);
  const publicKeyBuffer = Buffer.from(passKey.publicKey, 'base64');

  const verification = await verifyAuthenticationResponse({
    response: req.body,
    expectedChallenge: challenge,
    expectedOrigin: CLIENT_URL,
    expectedRPID: RP_ID,
    authenticator: {
      credentialID: passKey.credentialID,
      credentialPublicKey: publicKeyBuffer,
      counter: passKey.counter,
      transports: passKey.transports,
    }
  });

  if (verification.verified) {
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
