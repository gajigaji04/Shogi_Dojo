// Standard Elo rating (same formula chess sites use). Pure functions, no DB/Express
// dependency, so they're easy to reason about and test in isolation.

const K_FACTOR = 32;

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

export interface EloUpdate {
  newRatingA: number;
  newRatingB: number;
}

/** scoreA: 1 = A won, 0 = A lost, 0.5 = draw. */
export function calculateElo(
  ratingA: number,
  ratingB: number,
  scoreA: number,
): EloUpdate {
  const expectedA = expectedScore(ratingA, ratingB);
  const scoreB = 1 - scoreA;
  const expectedB = 1 - expectedA;
  return {
    newRatingA: Math.round(ratingA + K_FACTOR * (scoreA - expectedA)),
    newRatingB: Math.round(ratingB + K_FACTOR * (scoreB - expectedB)),
  };
}

const BASE_WINDOW = 100;
const WINDOW_GROWTH_PER_SEC = 15;
const MAX_WINDOW = 600;

/** How large a rating gap a queued player currently accepts, based on how long
 * they've already been waiting — widens over time so a lone player in an empty
 * bracket doesn't wait forever for an exact rating match. */
export function allowedRatingWindow(waitedMs: number): number {
  const waitedSec = Math.floor(waitedMs / 1000);
  return Math.min(MAX_WINDOW, BASE_WINDOW + waitedSec * WINDOW_GROWTH_PER_SEC);
}
