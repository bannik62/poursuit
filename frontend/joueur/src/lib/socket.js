import { io } from 'socket.io-client';

const SOCKET_OPTS = {
  path: '/socket.io',
  transports: ['polling', 'websocket'],
  reconnection: true,
};

export function subscribePlayer(sessionId, token, handlers) {
  const s = io(SOCKET_OPTS);

  const onState = (state) => handlers.onState?.(state);
  const onStart = (state) => handlers.onStart?.(state);
  const onReset = () => handlers.onReset?.();
  const onDice = (roll) => handlers.onDice?.(roll);
  const onAnswer = (answer) => handlers.onAnswer?.(answer);
  const onGameOver = (payload) => handlers.onGameOver?.(payload);
  const onError = (payload) => handlers.onError?.(payload?.error ?? 'Erreur');

  const subscribe = () => s.emit('player:subscribe', { sessionId, token });

  s.on('connect', subscribe);
  if (s.connected) subscribe();

  s.on('session:state', onState);
  s.on('game:start', onStart);
  s.on('session:reset', onReset);
  s.on('game:dice', onDice);
  s.on('game:answer', onAnswer);
  s.on('game:over', onGameOver);
  s.on('game:error', onError);

  return {
    rollDice: () => s.emit('game:roll'),
    submitAnswer: (choiceIndex) => s.emit('game:answer', { choiceIndex }),
    selectChallenge: (theme, targetSlot) =>
      s.emit('game:challenge', { theme, targetSlot }),
    disconnect: () => {
      s.off('session:state', onState);
      s.off('game:start', onStart);
      s.off('session:reset', onReset);
      s.off('game:dice', onDice);
      s.off('game:answer', onAnswer);
      s.off('game:over', onGameOver);
      s.off('game:error', onError);
      s.disconnect();
    },
  };
}

export function disconnectSocket() {
  // conservé pour compat — chaque page a sa propre connexion
}
