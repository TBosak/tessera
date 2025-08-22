import seedrandom from 'seedrandom';

/**
 * Generate a seeded order for candidates using deterministic PRNG
 * Used for consistent tie-breaking across counting runs
 */
export function seededOrder(candidateIds: number[], seed: string): number[] {
  const rng = seedrandom(seed);
  const arr = [...candidateIds];
  
  // Fisher-Yates shuffle with seeded random
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  return arr;
}