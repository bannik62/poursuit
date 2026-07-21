import { randomBytes } from 'crypto';
import { pickRollValue } from './dice.js';
import { pickQuestionForPlayer, questionForClient, themeInfo } from './questions.js';
import {
  buildPlayerPath,
  getSpaceInfo,
  hasAllWedges,
  homeTheme,
  startingPosition,
  CENTER_INDEX,
} from '../../shared/game/index.js';

const MIN_PLAYERS = Number(process.env.MIN_PLAYERS) || 2;
const MAX_PLAYERS = Number(process.env.MAX_PLAYERS) || 6;
const MAX_BONUS_ROLLS = 2;

function landingCue(result) {
  if (!result) return 'none';
  if (result.finished) return 'finish';
  if (result.challenge) return 'challenge';
  if (result.question) return 'question';
  if (result.rejouez) return 'rejouez';
  if (result.bonusRolls) return 'bonus';
  if (result.blocked) return 'exact';
  if (result.pass) return 'pass';
  // Fin de tour normale → pas de popup « Passe ton tour »
  return 'none';
}

export class Session {
  constructor(playerCount) {
    if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
      throw new Error(`Nombre de joueurs invalide (${MIN_PLAYERS}-${MAX_PLAYERS})`);
    }

    this.id = randomBytes(4).toString('hex');
    this.playerCount = playerCount;
    this.status = 'lobby';
    this.winner = null;
    /** @type {number[]} slots dans l’ordre d’arrivée au centre */
    this.podium = [];
    this.players = Array.from({ length: playerCount }, (_, index) => ({
      slot: index,
      name: null,
      color: null,
      connected: false,
      token: randomBytes(8).toString('hex'),
      position: 0,
      wedges: [false, false, false, false],
      askedQuestionIds: [],
      finished: false,
      finishRank: null,
    }));
    this.currentPlayer = 0;
    this.phase = 'roll';
    this.lastRoll = null;
    this.currentQuestion = null;
    this.lastAnswer = null;
    this.extraRolls = 0;
    this.showQuestionOnPlateau = false;
    this.requireExactCenterRoll = true;
    this.fastGame = false;
    /** Défi en cours : qui a lancé le défi */
    this._challengeFrom = null;
    this.createdAt = Date.now();
  }

  startGame() {
    this.status = 'playing';
    this.winner = null;
    this.podium = [];
    this.phase = 'roll';
    this.currentPlayer = this.players.find((p) => p.connected)?.slot ?? 0;
    this.lastRoll = null;
    this.currentQuestion = null;
    this.lastAnswer = null;
    this.extraRolls = 0;
    this._challengeFrom = null;
    for (const player of this.players) {
      player.position = startingPosition(player.slot);
      player.askedQuestionIds = [];
      player.finished = false;
      player.finishRank = null;
    }
  }

  /** Joueurs encore en course (connectés, pas arrivés) */
  activeRacers() {
    return this.players.filter((p) => p.connected && !p.finished);
  }

  nextTurn() {
    const n = this.playerCount;
    let next = (this.currentPlayer + 1) % n;
    for (let i = 0; i < n; i++) {
      const p = this.players[next];
      if (p.connected && !p.finished) {
        this.currentPlayer = next;
        return;
      }
      next = (next + 1) % n;
    }
  }

  clearQuestionState() {
    this.currentQuestion = null;
    this._pendingAnswer = null;
    this._questionTheme = null;
    this._isVictoryQuestion = false;
    this._isChallenge = false;
  }

  endTurn() {
    this.extraRolls = 0;
    this.clearQuestionState();
    this._challengeFrom = null;
    this.nextTurn();
    this.phase = 'roll';
  }

  setShowQuestionOnPlateau(enabled) {
    this.showQuestionOnPlateau = Boolean(enabled);
  }

  setRequireExactCenterRoll(enabled) {
    this.requireExactCenterRoll = Boolean(enabled);
  }

  setFastGame(enabled) {
    this.fastGame = Boolean(enabled);
  }

  /**
   * Marque l’arrivée au centre + vérifie fin de partie.
   * @returns {{ finished: true, gameOver?: boolean }}
   */
  markFinished(slot) {
    const player = this.players[slot];
    if (!player.finished) {
      player.finished = true;
      player.position = CENTER_INDEX;
      player.finishRank = this.podium.length + 1;
      this.podium.push(slot);
    }

    const racers = this.activeRacers();
    // Plus qu’un (ou zéro) joueur sur le plateau → fin ; le 1er au centre gagne
    if (racers.length <= 1 && this.podium.length >= 1) {
      this.status = 'finished';
      this.winner = this.podium[0];
      this.phase = 'roll';
      return { finished: true, gameOver: true };
    }

    this.endTurn();
    return { finished: true, gameOver: false };
  }

  startQuestion(slot, theme, { victory = false, challenge = false } = {}) {
    const player = this.players[slot];
    const q = pickQuestionForPlayer(theme, player.askedQuestionIds);

    if (!q || q.series !== theme) {
      this.endTurn();
      return false;
    }

    player.askedQuestionIds.push(q.id);
    this._questionTheme = theme;
    this._pendingAnswer = q;
    this._isVictoryQuestion = victory;
    this._isChallenge = challenge;
    this.currentQuestion = {
      ...questionForClient(q, theme),
      isVictory: victory,
      isChallenge: challenge,
      challengeFrom: this._challengeFrom,
    };
    this.phase = 'question';
    this.currentPlayer = slot; // celui qui répond
    this.lastAnswer = null;
    return true;
  }

  resolveLanding(slot) {
    const player = this.players[slot];
    const space = getSpaceInfo(player.position);

    if (space.type === 'center') {
      return this.markFinished(slot);
    }

    if (space.type === 'challenge') {
      const opponents = this.players.filter(
        (p) => p.connected && !p.finished && p.slot !== slot,
      );
      if (opponents.length === 0) {
        this.endTurn();
        return { ended: true };
      }
      this.phase = 'challenge_select';
      this._challengeFrom = slot;
      this.currentPlayer = slot;
      return { ended: false, challenge: true };
    }

    if (space.type === 'pass') {
      this.endTurn();
      return { ended: true, pass: true };
    }

    if (space.type === 'rejouez') {
      this.phase = 'roll';
      return { ended: false, rejouez: true };
    }

    if (space.type === 'hq' || space.type === 'color') {
      const theme = space.theme;

      // QG maison avec tous les camemberts : on reste (prochain jet → rayon), pas de question victoire
      if (
        space.type === 'hq' &&
        hasAllWedges(player) &&
        theme === homeTheme(slot)
      ) {
        this.endTurn();
        return { ended: true, enterSpokeNext: true };
      }

      if (player.wedges[theme]) {
        if (this.fastGame) {
          this.endTurn();
          return { ended: true };
        }
        this.extraRolls = MAX_BONUS_ROLLS;
        this.phase = 'roll';
        return { ended: false, bonusRolls: MAX_BONUS_ROLLS };
      }

      if (!this.startQuestion(slot, theme)) {
        return { ended: true, noQuestion: true };
      }
      return { ended: false, question: true };
    }

    this.endTurn();
    return { ended: true };
  }

  rollDice(slot) {
    if (this.status !== 'playing') return { error: 'La partie n’est pas en cours' };
    if (this.phase !== 'roll') return { error: 'Action impossible pour le moment' };
    if (slot !== this.currentPlayer) return { error: 'Ce n’est pas votre tour' };

    const player = this.players[slot];
    if (!player?.connected) return { error: 'Joueur déconnecté' };
    if (player.finished) return { error: 'Vous êtes déjà au centre' };

    const hadBonus = this.extraRolls > 0;
    if (hadBonus) this.extraRolls -= 1;

    const from = player.position;
    const value = pickRollValue(player, from, {
      fastGame: this.fastGame,
      requireExactCenter: this.requireExactCenterRoll,
    });
    const path = buildPlayerPath(player, from, value, {
      requireExactCenter: this.requireExactCenterRoll,
    });
    const to = path.length ? path[path.length - 1] : from;

    player.position = to;
    this.lastRoll = {
      slot,
      value,
      from,
      to,
      path,
      at: Date.now(),
      cue: null,
      blocked: path.length === 0 && value > 0,
    };
    this.lastAnswer = null;

    // Jet trop grand vers le centre → pas de déplacement, joueur suivant
    if (path.length === 0) {
      this.endTurn();
      this.lastRoll.cue = 'exact';
      return { ok: true, roll: this.lastRoll, landing: { ended: true, blocked: true } };
    }

    const result = this.resolveLanding(slot);

    if (
      hadBonus &&
      !result.ended &&
      !result.question &&
      !result.challenge &&
      !result.finished &&
      this.phase === 'roll' &&
      this.extraRolls === 0
    ) {
      this.endTurn();
      result.ended = true;
    }

    this.lastRoll.cue = landingCue(result);
    return { ok: true, roll: this.lastRoll, landing: result };
  }

  /**
   * Après case défi : choisir thème + adversaire.
   */
  selectChallenge(slot, { theme, targetSlot }) {
    if (this.status !== 'playing') return { error: 'La partie n’est pas en cours' };
    if (this.phase !== 'challenge_select') return { error: 'Pas de défi en cours' };
    if (slot !== this.currentPlayer) return { error: 'Ce n’est pas votre tour' };
    if (this._challengeFrom !== slot) return { error: 'Défi invalide' };

    const t = Number(theme);
    if (!Number.isInteger(t) || t < 0 || t > 3) {
      return { error: 'Thème invalide' };
    }

    const target = Number(targetSlot);
    const targetPlayer = this.players[target];
    if (
      !Number.isInteger(target) ||
      !targetPlayer ||
      target === slot ||
      !targetPlayer.connected ||
      targetPlayer.finished
    ) {
      return { error: 'Joueur cible invalide' };
    }

    this._challengeFrom = slot;
    if (!this.startQuestion(target, t, { challenge: true })) {
      return { error: 'Aucune question disponible' };
    }

    return { ok: true, question: this.currentQuestion };
  }

  submitAnswer(slot, choiceIndex) {
    if (this.status !== 'playing') return { error: 'La partie n’est pas en cours' };
    if (this.phase !== 'question') return { error: 'Aucune question en cours' };
    if (slot !== this.currentPlayer) return { error: 'Ce n’est pas votre tour' };

    const q = this._pendingAnswer;
    const theme = this._questionTheme;
    const isVictory = this._isVictoryQuestion;
    const isChallenge = this._isChallenge;
    const challengeFrom = this._challengeFrom;
    if (!q || theme == null) return { error: 'Question introuvable' };
    if (q.series !== theme) return { error: 'Question invalide' };

    const choice = Number(choiceIndex);
    if (!Number.isInteger(choice) || choice < 0 || choice > 3) {
      return { error: 'Réponse invalide' };
    }

    const player = this.players[slot];
    const correct = choice === q.answer;

    // Camembert uniquement pour ses propres questions (pas les défis)
    if (correct && !isVictory && !isChallenge && !player.wedges[theme]) {
      player.wedges[theme] = true;
    }

    const info = themeInfo(theme);
    this.lastAnswer = {
      slot,
      series: theme,
      themeName: info?.name ?? 'Thème',
      themeColor: info?.color ?? '#888',
      correct,
      isVictory,
      isChallenge,
      challengeFrom,
      chosenIndex: choice,
      chosenAnswer: q.choices[choice],
      answerIndex: q.answer,
      correctAnswer: q.choices[q.answer],
      explanation: q.explanation,
    };

    this.clearQuestionState();
    this.extraRolls = 0;

    // Défi : si l’adversaire se trompe → le challenger rejoue ; sinon tour suivant
    if (isChallenge) {
      if (!correct && challengeFrom != null) {
        this.currentPlayer = challengeFrom;
        this._challengeFrom = null;
        this.phase = 'roll';
        return { ok: true, answer: this.lastAnswer };
      }
      this._challengeFrom = null;
      // Remettre le tour sur le challenger puis endTurn → joueur suivant
      if (challengeFrom != null) this.currentPlayer = challengeFrom;
      this.endTurn();
      return { ok: true, answer: this.lastAnswer };
    }

    this._challengeFrom = null;
    this.endTurn();
    return { ok: true, answer: this.lastAnswer };
  }

  handleDisconnect(slot) {
    const player = this.players[slot];
    if (!player || !player.connected) return { changed: false };

    player.connected = false;

    if (
      this.status === 'playing' &&
      this.currentPlayer === slot &&
      (this.phase === 'question' || this.phase === 'challenge_select')
    ) {
      this.endTurn();
    }

    // Recalcul fin si plus assez de coureurs
    if (this.status === 'playing' && this.podium.length >= 1) {
      const racers = this.activeRacers();
      if (racers.length <= 1) {
        this.status = 'finished';
        this.winner = this.podium[0];
        return { changed: true, gameOver: true };
      }
    }

    return { changed: true };
  }

  handleReconnect(slot) {
    const player = this.players[slot];
    if (!player) return { changed: false };
    if (player.connected) return { changed: false };
    player.connected = true;
    return { changed: true };
  }

  get connectedCount() {
    return this.players.filter((p) => p.connected).length;
  }

  get allConnected() {
    return this.connectedCount === this.playerCount;
  }

  takenColors(exceptSlot = null) {
    return this.players
      .filter((p) => p.connected && p.color != null && p.slot !== exceptSlot)
      .map((p) => p.color);
  }

  joinPlayer(token, name, color) {
    const player = this.players.find((p) => p.token === token);
    if (!player) return { error: 'Token invalide' };

    const trimmed = String(name ?? '').trim();
    if (!trimmed) return { error: 'Prénom requis' };

    if (player.name && player.name !== trimmed) {
      return { error: 'Token déjà utilisé' };
    }

    const reconnected = Boolean(player.name);
    const colorId = Number(color);

    if (!reconnected) {
      if (!Number.isInteger(colorId) || colorId < 0 || colorId > 5) {
        return { error: 'Choisissez une couleur' };
      }
      if (this.takenColors(player.slot).includes(colorId)) {
        return { error: 'Cette couleur est déjà prise' };
      }
      player.color = colorId;
    } else if (player.color == null && Number.isInteger(colorId) && colorId >= 0 && colorId <= 5) {
      if (!this.takenColors(player.slot).includes(colorId)) {
        player.color = colorId;
      }
    }

    player.name = trimmed;
    player.connected = true;
    return { player, reconnected };
  }

  toJSON() {
    return {
      id: this.id,
      status: this.status,
      winner: this.winner,
      podium: this.podium,
      playerCount: this.playerCount,
      connectedCount: this.connectedCount,
      allConnected: this.allConnected,
      currentPlayer: this.currentPlayer,
      phase: this.phase,
      lastRoll: this.lastRoll,
      currentQuestion: this.currentQuestion,
      lastAnswer: this.lastAnswer,
      extraRolls: this.extraRolls,
      showQuestionOnPlateau: this.showQuestionOnPlateau,
      requireExactCenterRoll: this.requireExactCenterRoll,
      fastGame: this.fastGame,
      challengeFrom: this._challengeFrom,
      players: this.players.map(({ token, askedQuestionIds, ...rest }) => rest),
    };
  }

  toAdminJSON(publicUrl) {
    const base = (publicUrl || 'http://localhost:8083').replace(/\/$/, '');
    return {
      ...this.toJSON(),
      publicUrl: base,
      playerTokens: this.players.map((p) => ({
        slot: p.slot,
        token: p.token,
        joinUrl: `${base}/joueur/?token=${p.token}`,
      })),
    };
  }
}
