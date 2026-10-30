import jwt from 'jsonwebtoken';
import { getAdminTokenVersion } from '../state/authState.js';

export function authJwt(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload?.tv !== getAdminTokenVersion()) {
      return res.status(401).json({ error: 'Session expirée' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expirée' });
  }
}
