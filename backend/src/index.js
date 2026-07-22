import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/session.js';
import playerRoutes from './routes/player.js';
import configRoutes from './routes/config.js';
import { authJwt } from './middleware/authJwt.js';
import { registerGameHandler } from './socket/gameHandler.js';

const app = express();
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
const httpServer = createServer(app);

function normalizeOrigin(value) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return `${url.protocol}//${url.host}`;
  } catch {
    return value.trim().replace(/\/$/, '');
  }
}

const allowedOrigins = [
  ...(process.env.FRONTEND_URL || 'http://localhost:8083').split(','),
  process.env.PUBLIC_URL,
]
  .map(normalizeOrigin)
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(normalizeOrigin(origin))) return true;
  if (process.env.NODE_ENV === 'development') {
    try {
      const url = new URL(origin);
      const host = url.hostname;
      // Local admin (PC) même si FRONTEND_URL pointe vers ngrok
      if (host === 'localhost' || host === '127.0.0.1') return true;
      if (
        host.endsWith('.ngrok-free.app') ||
        host.endsWith('.ngrok-free.dev') ||
        host.endsWith('.ngrok.app')
      ) {
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

function corsOrigin(origin, callback) {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
  } else {
    callback(new Error('CORS non autorisé'));
  }
}

const io = new Server(httpServer, {
  cors: {
    origin: (origin, cb) => corsOrigin(origin, cb),
    credentials: true,
  },
});

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'trivial-asso-backend' });
});

app.use('/api/auth', authRoutes);

app.get('/api/admin/me', authJwt, (req, res) => {
  res.json({ ok: true, admin: req.admin });
});

app.use('/api/admin/session', authJwt, sessionRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/config', configRoutes);

registerGameHandler(io);

const port = Number(process.env.PORT) || 3000;
httpServer.listen(port, () => {
  console.log(`Backend listening on :${port}`);
});
