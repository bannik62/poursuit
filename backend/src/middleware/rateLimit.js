import rateLimit from 'express-rate-limit';

/**
 * Configure and install route-scoped rate limiters.
 * Behind Apache + nginx, rely on Express trust proxy for correct req.ip.
 */
export function installRateLimiters(app) {
  const loginWindowMs =
    Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 10 * 60 * 1000; // 10 min
  const loginMax = Number(process.env.RATE_LIMIT_LOGIN_MAX) || 10; // 10 essais/10min

  const playerWindowMs =
    Number(process.env.RATE_LIMIT_PLAYER_WINDOW_MS) || 5 * 60 * 1000; // 5 min
  const playerMax = Number(process.env.RATE_LIMIT_PLAYER_MAX) || 60; // 60 req/5min

  const commonOptions = {
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    handler: (req, res /*, next*/) => {
      res.status(429).json({ error: 'Trop de requêtes. Réessayez plus tard.' });
    },
  };

  const loginLimiter = rateLimit({
    ...commonOptions,
    windowMs: loginWindowMs,
    max: loginMax,
  });

  const playerLimiter = rateLimit({
    ...commonOptions,
    windowMs: playerWindowMs,
    max: playerMax,
  });

  // Appliquer uniquement aux routes ciblées
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/player/join', playerLimiter);
  app.use('/api/player/lobby', playerLimiter);
}

