import { Router } from 'express';
import {
  broadcastSessionState,
  findSessionByPlayerToken,
  getIo,
} from '../socket/gameHandler.js';

const router = Router();

/** Aperçu lobby (couleurs déjà prises) avant join */
router.get('/lobby', (req, res) => {
  const token = req.query?.token;
  const found = findSessionByPlayerToken(token);
  if (!found) {
    return res.status(404).json({ error: 'Token invalide' });
  }

  res.json({
    sessionId: found.session.id,
    status: found.session.status,
    playerCount: found.session.playerCount,
    takenColors: found.session.takenColors(found.player.slot),
    myColor: found.player.color,
    myName: found.player.name,
  });
});

router.post('/join', (req, res) => {
  const { token, name, color } = req.body ?? {};
  const found = findSessionByPlayerToken(token);

  if (!found) {
    return res.status(404).json({ error: 'Token invalide' });
  }

  const trimmed = String(name ?? '').trim();

  if (found.session.status !== 'lobby') {
    if (!found.player.name) {
      return res.status(400).json({ error: 'La partie a déjà commencé' });
    }
    if (found.player.name !== trimmed) {
      return res.status(400).json({ error: 'Token déjà utilisé' });
    }
  }

  const result = found.session.joinPlayer(token, name, color);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  const state = found.session.toJSON();
  broadcastSessionState(found.session);

  if (!result.reconnected && found.session.status === 'lobby') {
    getIo()?.to(found.session.id).emit('player:joined', state);
  }

  res.json({
    ok: true,
    sessionId: found.session.id,
    player: {
      slot: result.player.slot,
      name: result.player.name,
      color: result.player.color,
    },
    session: state,
    reconnected: result.reconnected,
  });
});

export default router;
