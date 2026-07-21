import {
  SERIES,
  NUM_SERIES,
  SPACES_PER_SEGMENT,
  RING_SIZE,
  segmentInfo,
  ringSpaceColor,
  BOARD_SPACES,
  PLAYER_COLORS,
  playerColorHex,
} from '@trivial-asso/game';

export {
  SERIES,
  NUM_SERIES,
  SPACES_PER_SEGMENT,
  RING_SIZE,
  BOARD_SPACES,
  segmentInfo,
  ringSpaceColor,
  PLAYER_COLORS,
  playerColorHex,
};

/** @deprecated préférer PLAYER_COLORS / playerColorHex */
export const PAWN_COLORS = PLAYER_COLORS.map((c) => c.hex);

export const SPOKE_SPACES = 5;
export const SPOKE_COLORED = 4;
export const TOTAL_SPACES = RING_SIZE + NUM_SERIES * SPOKE_SPACES + 1;
export const BOARD_SIZE = RING_SIZE;
export const CENTER_PASS_INDEX = TOTAL_SPACES - 1;

export const CX = 500;
export const CY = 500;
export const CENTER_PASS_R = 36;
export const HUB_R = 68;
export const RING_BAND_INNER = 282;
export const RING_BAND_OUTER = 442;
export const RING_INNER_R = 258;
export const BOARD_R = 448;

const TAU = Math.PI * 2;
const SEGMENT_ARC = TAU / NUM_SERIES;
const RING_ARC = TAU / RING_SIZE;
const SPOKE_HALF = SEGMENT_ARC * 0.132;
const HQ_HALF = SPOKE_HALF;
const SMALL_ARC = (SEGMENT_ARC - 2 * HQ_HALF) / 6;
const SPOKE_INNER = HUB_R + 2;
const SPOKE_TILE_DEPTH = (RING_BAND_INNER - SPOKE_INNER) / SPOKE_SPACES;

export function isHQ(index) {
  return index < RING_SIZE && segmentInfo(index).isHQ;
}

export function isRejouez(index) {
  return index < RING_SIZE && segmentInfo(index).isRejouez;
}

export function isPassTurn(index) {
  return index < RING_SIZE && segmentInfo(index).isPassTurn;
}

export function isSpokeBonus(step) {
  return step === SPOKE_COLORED;
}

export function spokeAngle(seriesId) {
  return seriesId * SEGMENT_ARC - Math.PI / 2;
}

/** Angles de case : HQ large centrée sur le rayon, 6 petites cases entre les HQ */
export function ringTileAngles(index) {
  const { segment, pos, isHQ: hq } = segmentInfo(index);
  const spokeMid = spokeAngle(segment);

  if (hq) {
    return { a0: spokeMid - HQ_HALF, a1: spokeMid + HQ_HALF, mid: spokeMid };
  }

  const segStart = spokeMid + HQ_HALF;
  const a0 = segStart + (pos - 1) * SMALL_ARC;
  const a1 = segStart + pos * SMALL_ARC;
  return { a0, a1, mid: (a0 + a1) / 2 };
}

function ringRadii(hq) {
  return {
    rIn: hq ? RING_BAND_INNER - 8 : RING_BAND_INNER,
    rOut: hq ? RING_BAND_OUTER + 12 : RING_BAND_OUTER,
  };
}

export function ringTilePath(index) {
  const { a0, a1 } = ringTileAngles(index);
  const { rIn, rOut } = ringRadii(isHQ(index));

  const pt = (r, a) => ({ x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) });
  const i0 = pt(rIn, a0);
  const i1 = pt(rIn, a1);
  const o0 = pt(rOut, a0);
  const o1 = pt(rOut, a1);

  return `M ${i0.x} ${i0.y} L ${o0.x} ${o0.y} A ${rOut} ${rOut} 0 0 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${rIn} ${rIn} 0 0 0 ${i0.x} ${i0.y} Z`;
}

export function ringTileCenter(index) {
  const { mid } = ringTileAngles(index);
  const { rIn, rOut } = ringRadii(isHQ(index));
  const r = (rIn + rOut) / 2;
  return { x: CX + r * Math.cos(mid), y: CY + r * Math.sin(mid), angle: mid };
}

export function spaceXY(index) {
  if (index >= RING_SIZE) {
    if (index === CENTER_PASS_INDEX) return { x: CX, y: CY, angle: 0 };
    const spokeIdx = index - RING_SIZE;
    const seriesId = Math.floor(spokeIdx / SPOKE_SPACES);
    const step = spokeIdx % SPOKE_SPACES;
    return spokeTileCenter(seriesId, step);
  }
  return ringTileCenter(index);
}

/** Fond des cases rayon : les 3 autres couleurs (pas celle du HQ visé) */
export function spokeSpaceColor(seriesId, step) {
  if (isSpokeBonus(step)) return -2;
  const order = [
    (seriesId + 2) % NUM_SERIES,
    (seriesId + 3) % NUM_SERIES,
    (seriesId + 1) % NUM_SERIES,
  ];
  return order[step % order.length];
}

export function spokeWedgeColor(seriesId) {
  return seriesId;
}

/** Trapèze radial bord à bord, du hub à l'anneau */
export function spokeTilePath(seriesId, step) {
  const a = spokeAngle(seriesId);
  const a0 = a - SPOKE_HALF;
  const a1 = a + SPOKE_HALF;
  const rFar = RING_BAND_INNER - step * SPOKE_TILE_DEPTH;
  const rNear = RING_BAND_INNER - (step + 1) * SPOKE_TILE_DEPTH;

  const p = (r, ang) => ({ x: CX + r * Math.cos(ang), y: CY + r * Math.sin(ang) });
  const n0 = p(rNear, a0);
  const n1 = p(rNear, a1);
  const f1 = p(rFar, a1);
  const f0 = p(rFar, a0);
  return `M ${n0.x} ${n0.y} L ${n1.x} ${n1.y} L ${f1.x} ${f1.y} L ${f0.x} ${f0.y} Z`;
}

export function spokeTileCenter(seriesId, step) {
  const a = spokeAngle(seriesId);
  const r = RING_BAND_INNER - (step + 0.5) * SPOKE_TILE_DEPTH;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a), angle: a };
}

export function wedgeSectorPath(seriesId) {
  const a0 = (seriesId - 0.5) * SEGMENT_ARC - Math.PI / 2;
  const a1 = (seriesId + 0.5) * SEGMENT_ARC - Math.PI / 2;
  const r = RING_INNER_R;
  const x0 = CX + r * Math.cos(a0);
  const y0 = CY + r * Math.sin(a0);
  const x1 = CX + r * Math.cos(a1);
  const y1 = CY + r * Math.sin(a1);
  return `M ${CX} ${CY} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`;
}

export function hqTrianglePoints(index) {
  const { x, y, angle } = ringTileCenter(index);
  const inward = angle + Math.PI;
  const tipX = x + 48 * Math.cos(inward);
  const tipY = y + 48 * Math.sin(inward);
  const perp = angle + Math.PI / 2;
  const bx1 = x + 28 * Math.cos(perp);
  const by1 = y + 28 * Math.sin(perp);
  const bx2 = x - 28 * Math.cos(perp);
  const by2 = y - 28 * Math.sin(perp);
  return `${tipX},${tipY} ${bx1},${by1} ${bx2},${by2}`;
}

export function smallWedgePoints(x, y, angle, size = 6) {
  const inward = angle + Math.PI;
  const tipX = x + size * Math.cos(inward);
  const tipY = y + size * Math.sin(inward);
  const perp = angle + Math.PI / 2;
  const bx1 = x + size * 0.55 * Math.cos(perp);
  const by1 = y + size * 0.55 * Math.sin(perp);
  const bx2 = x - size * 0.55 * Math.cos(perp);
  const by2 = y - size * 0.55 * Math.sin(perp);
  return `${tipX},${tipY} ${bx1},${by1} ${bx2},${by2}`;
}

/** Hub en anneau (4 parts autour du cercle « passe ton tour ») */
export function hubSlicePath(seriesId) {
  const a0 = seriesId * SEGMENT_ARC - Math.PI / 2;
  const a1 = (seriesId + 1) * SEGMENT_ARC - Math.PI / 2;
  const r0 = CENTER_PASS_R + 3;
  const r1 = HUB_R;
  const pt = (r, a) => ({ x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) });
  const i0 = pt(r0, a0);
  const i1 = pt(r0, a1);
  const o0 = pt(r1, a0);
  const o1 = pt(r1, a1);
  return `M ${i0.x} ${i0.y} L ${o0.x} ${o0.y} A ${r1} ${r1} 0 0 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${r0} ${r0} 0 0 0 ${i0.x} ${i0.y} Z`;
}

export function pawnOffset(slot, total = 6) {
  const a = (slot / total) * TAU;
  return { dx: 11 * Math.cos(a), dy: 11 * Math.sin(a) };
}

/** Chemin SVG de la case (anneau ou rayon) pour surbrillance pion */
export function tilePathForPosition(index) {
  if (index >= RING_SIZE) {
    if (index === CENTER_PASS_INDEX) return null;
    const spokeIdx = index - RING_SIZE;
    const seriesId = Math.floor(spokeIdx / SPOKE_SPACES);
    const step = spokeIdx % SPOKE_SPACES;
    return spokeTilePath(seriesId, step);
  }
  return ringTilePath(index);
}

export function isCenterPosition(index) {
  return index === CENTER_PASS_INDEX;
}

export const CORNER_LEGENDS = [
  { x: 52, y: 52, anchor: 'start' },
  { x: 948, y: 52, anchor: 'end' },
  { x: 52, y: 948, anchor: 'start' },
  { x: 948, y: 948, anchor: 'end' },
];
