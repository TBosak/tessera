export type CandidateId = number;
export type Ballot = CandidateId[];

export interface RoundResult {
  tallies: Record<string, number>;
  eliminated?: CandidateId;
}

export interface IRVResult {
  rounds: RoundResult[];
  winner: CandidateId | null;
}

export interface STVResult {
  rounds: RoundResult[];
  winners: CandidateId[];
}

export { irv } from './irv.js';
export { stv } from './stv.js';
export { seededOrder } from './utils.js';