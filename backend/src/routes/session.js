import { Router } from 'express';
import {
  broadcastSessionState,
  createSession,
  deleteSession,
  getIo,
  getSession,
} from '../socket/gameHandler.js';

const router = Router();

router.post('/', (req, res) => {
  const playerCount = Number(req.body?.playerCount);

  try {
    const session = createSession(playerCount);
    const payload = session.toAdminJSON(process.env.PUBLIC_URL);
    res.status(201).json(payload);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session introuvable' });
  }

  res.json(session.toAdminJSON(process.env.PUBLIC_URL));
});

router.post('/:id/start', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session introuvable' });
  }

  if (session.status !== 'lobby') {
    return res.status(400).json({ error: 'La partie est déjà lancée' });
  }

  if (!session.allConnected) {
    return res.status(400).json({
      error: `Pas tous connectés (${session.connectedCount}/${session.playerCount})`,
    });
  }

  session.startGame();
  const state = session.toJSON();

  broadcastSessionState(session);
  getIo()?.to(session.id).emit('game:start', state);

  res.json({ ok: true, session: state });
});

router.patch('/:id/settings', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session introuvable' });
  }

  if (typeof req.body?.showQuestionOnPlateau === 'boolean') {
    session.setShowQuestionOnPlateau(req.body.showQuestionOnPlateau);
  }

  if (typeof req.body?.requireExactCenterRoll === 'boolean') {
    session.setRequireExactCenterRoll(req.body.requireExactCenterRoll);
  }

  if (typeof req.body?.fastGame === 'boolean') {
    session.setFastGame(req.body.fastGame);
  }

  broadcastSessionState(session);
  res.json({ ok: true, session: session.toAdminJSON(process.env.PUBLIC_URL) });
});

router.post('/:id/reset', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session introuvable' });
  }

  const sessionId = session.id;
  deleteSession(sessionId);
  getIo()?.to(sessionId).emit('session:reset', { sessionId });

  res.json({ ok: true });
});

export default router;
