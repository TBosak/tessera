import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ClaimTokenSchema, SubmitBallotSchema } from '../lib/validation.js';
import { hashToken, signJWT, verifyJWT, generateSalt, receiptFor } from '../lib/crypto.js';
import { queries, db } from '../db/database.js';
import { strictRateLimit } from '../middleware/rateLimit.js';
import { NotFoundError, ValidationError, ConflictError, UnauthorizedError } from '../lib/errors.js';

const vote = new Hono();

// Apply rate limiting to voting routes
vote.use('*', strictRateLimit);

// Claim token and get ballot session
vote.post('/claim', zValidator('json', ClaimTokenSchema), async (c) => {
  const { slug, token } = c.req.valid('json');
  
  // Get election by slug
  const election = queries.getElectionBySlug.get(slug);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  if (election.status !== 'open') {
    throw new ValidationError('Election is not open for voting');
  }
  
  // Check token
  const tokenHash = hashToken(token);
  const voterToken = queries.getVoterToken.get(tokenHash);
  
  if (!voterToken) {
    throw new UnauthorizedError('Invalid or already used token');
  }
  
  if (voterToken.election_id !== election.id) {
    throw new UnauthorizedError('Token not valid for this election');
  }
  
  // Create ballot session JWT (short-lived)
  const sessionPayload = {
    kind: 'token',
    electionId: election.id,
    tokenId: voterToken.id
  };
  
  const ballotSessionJwt = signJWT(sessionPayload, '15m');
  
  return c.json({ 
    ballot_session_jwt: ballotSessionJwt,
    election: {
      id: election.id,
      slug: election.slug,
      title: election.title,
      description: election.description,
      max_rank: election.max_rank
    }
  });
});

// Submit ballot
vote.post('/submit', zValidator('json', SubmitBallotSchema), async (c) => {
  const { ballot_session_jwt, rankings } = c.req.valid('json');
  
  // Verify ballot session
  let session;
  try {
    session = verifyJWT(ballot_session_jwt);
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired ballot session');
  }
  
  // Get election and validate it's still open
  const election = queries.getElectionById.get(session.electionId);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  if (election.status !== 'open') {
    throw new ValidationError('Election is no longer open for voting');
  }
  
  // Get candidates to validate rankings
  const candidates = queries.getCandidatesByElection.all(election.id);
  const validCandidateIds = new Set(candidates.map(c => c.id));
  
  // Validate and canonicalize rankings
  const canonicalRankings = canonicalizeRankings(rankings, validCandidateIds, election.max_rank);
  
  if (canonicalRankings.length === 0) {
    throw new ValidationError('Ballot must contain at least one valid candidate ranking');
  }
  
  // Generate salt and receipt
  const salt = generateSalt();
  const saltBase64 = Buffer.from(salt).toString('base64');
  const receiptHash = receiptFor(canonicalRankings, salt);
  
  // Submit ballot in transaction
  db.exec('BEGIN IMMEDIATE');
  try {
    // Insert ballot
    const ballot = queries.insertBallot.get(
      election.id,
      JSON.stringify(canonicalRankings),
      saltBase64,
      receiptHash
    );
    
    if (session.kind === 'token') {
      // Mark token as used and create usage record
      const updateResult = queries.markTokenUsed.run(session.tokenId);
      
      if (updateResult.changes === 0) {
        throw new ConflictError('Token has already been used');
      }
      
      queries.insertTokenUsage.run(session.tokenId, receiptHash);
    } else if (session.kind === 'email') {
      // Mark email voter as voted
      const updateResult = db.query(`
        UPDATE email_voters 
        SET voted_at = datetime('now') 
        WHERE id = ? AND voted_at IS NULL
      `).run(session.emailVoterId);
      
      if (updateResult.changes === 0) {
        throw new ConflictError('Email has already been used to vote');
      }
    }
    
    db.exec('COMMIT');
    
    return c.json({ 
      receipt_hash: receiptHash,
      message: 'Ballot submitted successfully',
      election: {
        slug: election.slug,
        title: election.title
      }
    });
    
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
});

// Helper function to canonicalize rankings
function canonicalizeRankings(
  rankings: number[], 
  validCandidateIds: Set<number>, 
  maxRank?: number | null
): number[] {
  const seen = new Set<number>();
  const canonical: number[] = [];
  
  for (const candidateId of rankings) {
    // Skip if already seen (dedupe)
    if (seen.has(candidateId)) continue;
    
    // Skip if not a valid candidate
    if (!validCandidateIds.has(candidateId)) continue;
    
    // Stop if we've reached max rank limit
    if (maxRank && canonical.length >= maxRank) break;
    
    canonical.push(candidateId);
    seen.add(candidateId);
  }
  
  return canonical;
}

export default vote;