/** Animaux disponibles comme pions (max 8, 2–4 joueurs par partie). */
export const PLAYER_ANIMALS = [
  { id: 0, name: 'Renard', accentHex: '#E8754A' },
  { id: 1, name: 'Ours', accentHex: '#8B5E3C' },
  { id: 2, name: 'Raton laveur', accentHex: '#7F8C8D' },
  { id: 3, name: 'Lapin', accentHex: '#95A5A6' },
  { id: 4, name: 'Cerf', accentHex: '#A0714F' },
  { id: 5, name: 'Hibou', accentHex: '#5D6D7E' },
  { id: 6, name: 'Blaireau', accentHex: '#BDC3C7' },
  { id: 7, name: 'Castor', accentHex: '#6E4C2E' },
];

export const MAX_ANIMALS = PLAYER_ANIMALS.length;

export function playerAnimalHex(animalId) {
  const a = PLAYER_ANIMALS.find((x) => x.id === animalId);
  return a?.accentHex ?? PLAYER_ANIMALS[0].accentHex;
}

export function playerAnimalName(animalId) {
  const a = PLAYER_ANIMALS.find((x) => x.id === animalId);
  return a?.name ?? PLAYER_ANIMALS[0].name;
}
