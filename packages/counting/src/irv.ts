import type { CandidateId, Ballot, IRVResult, RoundResult } from './index.js';

/**
 * Instant Runoff Voting (IRV) implementation
 * Single-winner ranked choice voting with deterministic tie-breaking
 */
export function irv(
  ballots: Ballot[], 
  candidateIds: CandidateId[], 
  seededOrder: CandidateId[]
): IRVResult {
  let remaining = [...candidateIds];
  const rounds: RoundResult[] = [];

  while (true) {
    // Tally first preferences among remaining candidates
    const tallies: Record<string, number> = Object.fromEntries(
      remaining.map(c => [c.toString(), 0])
    );

    for (const ballot of ballots) {
      // Find the highest-ranked candidate still in the race
      const topChoice = ballot.find(c => remaining.includes(c));
      if (topChoice !== undefined) {
        tallies[topChoice.toString()] += 1;
      }
    }

    rounds.push({ tallies });

    // Calculate total valid votes
    const totalVotes = Object.values(tallies).reduce((a, b) => a + b, 0);
    const majority = totalVotes / 2;

    // Check for majority winner
    for (const candidate of remaining) {
      if (tallies[candidate.toString()] > majority) {
        return { 
          rounds, 
          winner: candidate 
        };
      }
    }

    // If only one candidate remains, they win
    if (remaining.length === 1) {
      return { 
        rounds, 
        winner: remaining[0] 
      };
    }

    // Find candidates with minimum votes
    const minVotes = Math.min(...Object.values(tallies));
    const lowestCandidates = remaining.filter(
      c => tallies[c.toString()] === minVotes
    );

    // Use seeded order for deterministic tie-breaking
    lowestCandidates.sort((a, b) => 
      seededOrder.indexOf(a) - seededOrder.indexOf(b)
    );
    
    const eliminated = lowestCandidates[0];
    
    // Update the last round with elimination info
    rounds[rounds.length - 1].eliminated = eliminated;
    
    // Remove eliminated candidate
    remaining = remaining.filter(c => c !== eliminated);
  }
}