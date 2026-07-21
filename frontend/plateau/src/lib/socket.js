import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io({ path: '/socket.io' });
  }
  return socket;
}

export function subscribeSession(sessionId, handlers) {
  const s = getSocket();

  const onState = (state) => handlers.onState?.(state);
  const onJoined = (state) => handlers.onJoined?.(state);
  const onStart = (state) => handlers.onStart?.(state);
  const onReset = () => handlers.onReset?.();
  const onDice = (roll) => handlers.onDice?.(roll);
  const onGameOver = (payload) => handlers.onGameOver?.(payload);

  s.emit('session:subscribe', { sessionId });
  s.on('session:state', onState);
  s.on('player:joined', onJoined);
  s.on('game:start', onStart);
  s.on('session:reset', onReset);
  s.on('game:dice', onDice);
  s.on('game:over', onGameOver);

  return () => {
    s.off('session:state', onState);
    s.off('player:joined', onJoined);
    s.off('game:start', onStart);
    s.off('session:reset', onReset);
    s.off('game:dice', onDice);
    s.off('game:over', onGameOver);
  };
}
