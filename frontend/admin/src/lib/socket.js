import { io } from 'socket.io-client';

const SOCKET_OPTS = {
  path: '/socket.io',
  transports: ['polling', 'websocket'],
  reconnection: true,
};

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_OPTS);
  }
  return socket;
}

export function subscribeSession(sessionId, handlers) {
  const s = getSocket();

  const onState = (state) => handlers.onState?.(state);
  const onJoined = (state) => handlers.onJoined?.(state);
  const onStart = (state) => handlers.onStart?.(state);
  const onReset = () => handlers.onReset?.();
  const onGameOver = (payload) => handlers.onGameOver?.(payload);
  const onError = (payload) => handlers.onError?.(payload?.error ?? 'Erreur socket');

  const subscribe = () => s.emit('session:subscribe', { sessionId });

  s.on('session:state', onState);
  s.on('player:joined', onJoined);
  s.on('game:start', onStart);
  s.on('session:reset', onReset);
  s.on('game:over', onGameOver);
  s.on('session:error', onError);
  s.on('connect', subscribe);
  if (s.connected) subscribe();

  return () => {
    s.off('connect', subscribe);
    s.off('session:state', onState);
    s.off('player:joined', onJoined);
    s.off('game:start', onStart);
    s.off('session:reset', onReset);
    s.off('game:over', onGameOver);
    s.off('session:error', onError);
  };
}
