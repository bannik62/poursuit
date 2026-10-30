import { Session } from '../game/Session.js';

/** @type {Map<string, Session>} */
const sessions = new Map();

const MAX_SESSIONS =
  Number(process.env.SESSIONS_MAX || process.env.MAX_SESSIONS) || 20;
const SESSION_TTL_MINUTES = Number(process.env.SESSIONS_TTL_MINUTES) || 120;
const FINISHED_SESSION_TTL_MINUTES =
  Number(process.env.FINISHED_SESSIONS_TTL_MINUTES) || 60;
const SWEEP_INTERVAL_MS =
  Number(process.env.SESSIONS_SWEEP_INTERVAL_MS) || 60 * 1000;

/** @type {import('socket.io').Server | null} */
let io = null;

export function getIo() {
  return io;
}

export function broadcastSessionState(session) {
  if (!io) return;
  io.to(session.id).emit('session:state', session.toJSON());
}

export function createSession(playerCount, eventTitle) {
  if (sessions.size >= MAX_SESSIONS) {
    throw new Error('Trop de sessions actives, réessayez plus tard');
  }
  const session = new Session(playerCount);
  if (eventTitle != null) session.setEventTitle(eventTitle);
  sessions.set(session.id, session);
  return session;
}

export function getSession(sessionId) {
  return sessions.get(sessionId) ?? null;
}

export function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

export function findSessionByPlayerToken(token) {
  for (const session of sessions.values()) {
    const player = session.players.find((p) => p.token === token);
    if (player) return { session, player };
  }
  return null;
}

export function startSessionJanitor() {
  const ttlMs = SESSION_TTL_MINUTES * 60 * 1000;
  const finishedTtlMs = FINISHED_SESSION_TTL_MINUTES * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const [id, s] of [...sessions.entries()]) {
      // Nettoyer les parties finies après un délai
      if (s.status === 'finished' && s.finishedAt && now - s.finishedAt > finishedTtlMs) {
        sessions.delete(id);
        continue;
      }
      // Abandonnées: personne connecté depuis longtemps
      if (s.connectedCount === 0 && now - s.createdAt > ttlMs) {
        sessions.delete(id);
        continue;
      }
    }
  }, SWEEP_INTERVAL_MS).unref?.();
}

export function registerGameHandler(socketIo) {
  io = socketIo;

  io.on('connection', (socket) => {
    socket.on('session:subscribe', ({ sessionId }) => {
      const session = getSession(sessionId);
      if (!session) {
        socket.emit('session:error', { error: 'Session introuvable' });
        return;
      }

      socket.join(sessionId);
      socket.data.sessionId = sessionId;
      socket.emit('session:state', session.toJSON());
    });

    socket.on('player:subscribe', ({ sessionId, token }) => {
      const found = findSessionByPlayerToken(token);
      if (!found || found.session.id !== sessionId) {
        socket.emit('session:error', { error: 'Joueur introuvable' });
        return;
      }

      const reconnected = found.session.handleReconnect(found.player.slot);
      socket.join(sessionId);
      socket.data.sessionId = sessionId;
      socket.data.playerToken = token;
      socket.emit('session:state', found.session.toJSON());
      if (reconnected.changed) {
        broadcastSessionState(found.session);
      }
    });

    socket.on('game:roll', () => {
      const token = socket.data.playerToken;
      if (!token) {
        socket.emit('game:error', { error: 'Joueur non identifié' });
        return;
      }

      const found = findSessionByPlayerToken(token);
      if (!found) {
        socket.emit('game:error', { error: 'Session introuvable' });
        return;
      }

      const result = found.session.rollDice(found.player.slot);
      if (result.error) {
        socket.emit('game:error', { error: result.error });
        return;
      }

      broadcastSessionState(found.session);
      io.to(found.session.id).emit('game:dice', result.roll);
      if (result.landing?.gameOver || found.session.status === 'finished') {
        io.to(found.session.id).emit('game:over', {
          winner: found.session.winner,
          podium: found.session.podium,
          session: found.session.toJSON(),
        });
      }
    });

    socket.on('game:answer', ({ choiceIndex }) => {
      const token = socket.data.playerToken;
      if (!token) {
        socket.emit('game:error', { error: 'Joueur non identifié' });
        return;
      }

      const found = findSessionByPlayerToken(token);
      if (!found) {
        socket.emit('game:error', { error: 'Session introuvable' });
        return;
      }

      const result = found.session.submitAnswer(found.player.slot, choiceIndex);
      if (result.error) {
        socket.emit('game:error', { error: result.error });
        return;
      }

      broadcastSessionState(found.session);
      io.to(found.session.id).emit('game:answer', result.answer);
      if (result.gameOver || found.session.status === 'finished') {
        io.to(found.session.id).emit('game:over', {
          winner: found.session.winner,
          podium: found.session.podium,
          session: found.session.toJSON(),
        });
      }
    });

    socket.on('game:challenge', ({ theme, targetSlot }) => {
      const token = socket.data.playerToken;
      if (!token) {
        socket.emit('game:error', { error: 'Joueur non identifié' });
        return;
      }

      const found = findSessionByPlayerToken(token);
      if (!found) {
        socket.emit('game:error', { error: 'Session introuvable' });
        return;
      }

      const result = found.session.selectChallenge(found.player.slot, {
        theme,
        targetSlot,
      });
      if (result.error) {
        socket.emit('game:error', { error: result.error });
        return;
      }

      broadcastSessionState(found.session);
    });

    socket.on('disconnect', () => {
      const token = socket.data.playerToken;
      if (!token) return;

      const found = findSessionByPlayerToken(token);
      if (!found) return;

      const result = found.session.handleDisconnect(found.player.slot);
      if (result.changed) {
        broadcastSessionState(found.session);
        if (result.gameOver || found.session.status === 'finished') {
          io.to(found.session.id).emit('game:over', {
            winner: found.session.winner,
            podium: found.session.podium,
            session: found.session.toJSON(),
          });
        }
      }
    });
  });
}
