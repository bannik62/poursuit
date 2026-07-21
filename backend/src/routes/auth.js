import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'change-me';
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ error: 'JWT_SECRET non configuré' });
  }

  if (username !== adminUsername) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  const passwordOk =
    adminPassword.startsWith('$2')
      ? await bcrypt.compare(password, adminPassword)
      : password === adminPassword;

  if (!passwordOk) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  const token = jwt.sign({ role: 'admin', username }, jwtSecret, {
    expiresIn: '8h',
  });

  // Secure seulement si la requête est réellement en HTTPS (ngrok),
  // pas si PUBLIC_URL est https alors qu'on se connecte en localhost http
  const forwardedProto = req.get('x-forwarded-proto');
  const useSecureCookie =
    process.env.NODE_ENV === 'production' ||
    forwardedProto === 'https' ||
    req.secure;

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: useSecureCookie,
    maxAge: 8 * 60 * 60 * 1000,
  });

  res.json({ ok: true });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

export default router;
