import { startingPosition, DEFAULT_EVENT_TITLE } from '@trivial-asso/game';

/** Session fictive pour prévisualiser le plateau sans backend ni joueurs. */
export function createPreviewSession() {
  const playerCount = 4;
  const players = [
    { slot: 0, name: 'Alice', color: 0, animal: 0, connected: true, position: 5, wedges: [true, false, false, false], finished: false, finishRank: null },
    { slot: 1, name: 'Bob', color: 1, animal: 1, connected: true, position: 32, wedges: [true, true, false, false], finished: false, finishRank: null },
    { slot: 2, name: 'Claire', color: 2, animal: 2, connected: true, position: startingPosition(2), wedges: [false, true, true, false], finished: false, finishRank: null },
    { slot: 3, name: 'Dan', color: 3, animal: 3, connected: true, position: 46, wedges: [true, true, true, false], finished: false, finishRank: null },
  ];

  return {
    id: 'preview',
    status: 'playing',
    winner: null,
    podium: [],
    playerCount,
    connectedCount: playerCount,
    allConnected: true,
    currentPlayer: 0,
    phase: 'roll',
    lastRoll: null,
    currentQuestion: null,
    lastAnswer: null,
    extraRolls: 0,
    showQuestionOnPlateau: false,
    requireExactCenterRoll: true,
    fastGame: false,
    eventTitle: DEFAULT_EVENT_TITLE,
    players,
  };
}
