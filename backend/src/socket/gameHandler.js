import { Session } from '../game/Session.js';

/** @type {Map<string, Session>} */
const sessions = new Map();

/** @type {import('socket.io').Server | null} */
let io = null;

export function getIo() {
  return io;
}

export function broadcastSessionState(session) {
  if (!io) return;
  io.to(session.id).emit('session:state', session.toJSON());
}

export function createSession(playerCount) {
  const session = new Session(playerCount);
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
