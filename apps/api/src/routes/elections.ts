import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { 
  CreateElectionSchema, 
  UpdateElectionStatusSchema,
  CandidatesArraySchema,
  MintTokensSchema 
} from '../lib/validation.js';
import { generateUniqueSlug } from '../lib/slugify.js';
import { generateTieBreakSeed, generateToken, hashToken } from '../lib/crypto.js';
import { queries, db } from '../db/database.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { moderateRateLimit } from '../middleware/rateLimit.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../lib/errors.js';
import { irv, seededOrder } from '../lib/counting.js';

const elections = new Hono();

// Apply auth to all election routes
elections.use('*', requireAuth);
elections.use('*', moderateRateLimit);

// Create election (requires email verification)
elections.post('/', requireVerifiedEmail, zValidator('json', CreateElectionSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');
  
  const slug = generateUniqueSlug(data.title);
  const tieBreakSeed = generateTieBreakSeed();
  
  const election = queries.createElection.get(
    user.userId,
    slug,
    data.title,
    data.description || null,
    data.mode,
    data.seats,
    tieBreakSeed,
    data.max_rank || null
  );
  
  return c.json(election, 201);
});

// Get user's elections
elections.get('/', async (c) => {
  const user = c.get('user');
  
  const userElections = db.query(`
    SELECT * FROM elections 
    WHERE owner_user_id = ? 
    ORDER BY created_at DESC
  `).all(user.userId);
  
  return c.json({ elections: userElections });
});

// Get election by ID
elections.get('/:id', async (c) => {
  const user = c.get('user');
  const electionId = parseInt(c.req.param('id'));
  
  const election = queries.getElectionById.get(electionId);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  if (election.owner_user_id !== user.userId) {
    throw new ForbiddenError('Access denied');
  }
  
  // Get candidates
  const candidates = queries.getCandidatesByElection.all(electionId);
  
  return c.json({ ...election, candidates });
});

// Update election status
elections.put('/:id/status', zValidator('json', UpdateElectionStatusSchema), async (c) => {
  const user = c.get('user');
  const electionId = parseInt(c.req.param('id'));
  const { status } = c.req.valid('json');
  
  const election = queries.getElectionById.get(electionId);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  if (election.owner_user_id !== user.userId) {
    throw new ForbiddenError('Access denied');
  }
  
  // Validate status transitions
  if (election.status === 'closed') {
    throw new ValidationError('Cannot change status of closed election');
  }
  
  if (status === 'open') {
    // Validate election has candidates before opening
    const candidates = queries.getCandidatesByElection.all(electionId);
    if (candidates.length < 2) {
      throw new ValidationError('Election must have at least 2 candidates to open');
    }
  }
  
  queries.updateElectionStatus.run(status, electionId);
  
  return c.json({ message: 'Status updated successfully' });
});

// Manage candidates
elections.post('/:id/candidates', zValidator('json', CandidatesArraySchema), async (c) => {
  const user = c.get('user');
  const electionId = parseInt(c.req.param('id'));
  const candidates = c.req.valid('json');
  
  const election = queries.getElectionById.get(electionId);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  if (election.owner_user_id !== user.userId) {
    throw new ForbiddenError('Access denied');
  }
  
  if (election.status !== 'draft') {
    throw new ValidationError('Cannot modify candidates of active election');
  }
  
  // Transaction: delete existing candidates and insert new ones
  db.exec('BEGIN IMMEDIATE');
  try {
    queries.deleteCandidatesByElection.run(electionId);
    
    for (const candidate of candidates) {
      queries.insertCandidate.run(
        electionId,
        candidate.name,
        candidate.info || null,
        candidate.image_url || null,
        candidate.sort_index
      );
    }
    
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  
  // Return updated candidates
  const updatedCandidates = queries.getCandidatesByElection.all(electionId);
  
  return c.json({ candidates: updatedCandidates });
});

// Mint voter tokens
elections.post('/:id/tokens/mint', zValidator('json', MintTokensSchema), async (c) => {
  const user = c.get('user');
  const electionId = parseInt(c.req.param('id'));
  const { count, labelPrefix } = c.req.valid('json');
  
  const election = queries.getElectionById.get(electionId);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  if (election.owner_user_id !== user.userId) {
    throw new ForbiddenError('Access denied');
  }
  
  const tokens: Array<{ token: string; issued_to?: string }> = [];
  
  db.exec('BEGIN IMMEDIATE');
  try {
    for (let i = 0; i < count; i++) {
      const token = generateToken(32);
      const tokenHash = hashToken(token);
      const issuedTo = labelPrefix ? `${labelPrefix}-${i + 1}` : undefined;
      
      queries.insertVoterToken.run(electionId, tokenHash, issuedTo || null);
      tokens.push({ token, issued_to: issuedTo });
    }
    
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  
  // Generate CSV content
  const csvHeader = 'token,issued_to\n';
  const csvRows = tokens.map(t => `"${t.token}","${t.issued_to || ''}"`).join('\n');
  const csvContent = csvHeader + csvRows;
  
  return c.json({ 
    count: tokens.length,
    csv: csvContent,
    message: 'Tokens minted successfully'
  });
});

// Get token stats
elections.get('/:id/tokens/stats', async (c) => {
  const user = c.get('user');
  const electionId = parseInt(c.req.param('id'));
  
  const election = queries.getElectionById.get(electionId);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  if (election.owner_user_id !== user.userId) {
    throw new ForbiddenError('Access denied');
  }
  
  const stats = db.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(used_at) as used,
      COUNT(*) - COUNT(used_at) as unused
    FROM voter_tokens 
    WHERE election_id = ?
  `).get(electionId);
  
  return c.json(stats);
});

// Get election results (if closed)
elections.get('/:id/results', async (c) => {
  const user = c.get('user');
  const electionId = parseInt(c.req.param('id'));
  
  const election = queries.getElectionById.get(electionId);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  if (election.owner_user_id !== user.userId) {
    throw new ForbiddenError('Access denied');
  }
  
  if (election.status !== 'closed') {
    throw new ValidationError('Election must be closed to view results');
  }
  
  // Get ballots and candidates
  const ballots = queries.getBallotsByElection.all(electionId)
    .map(row => JSON.parse(row.rankings_json));
  const candidates = queries.getCandidatesByElection.all(electionId);
  const candidateIds = candidates.map(c => c.id);
  
  // Calculate results using IRV
  const tieBreakOrder = seededOrder(candidateIds, election.tie_break_seed);
  const results = irv(ballots, candidateIds, tieBreakOrder);
  
  return c.json({
    election: {
      id: election.id,
      title: election.title,
      mode: election.mode,
      seats: election.seats
    },
    candidates: candidates.map(c => ({ id: c.id, name: c.name })),
    results,
    metadata: {
      total_ballots: ballots.length,
      tie_break_seed: election.tie_break_seed,
      calculated_at: new Date().toISOString()
    }
  });
});

// Get audit data
elections.get('/:id/audit', async (c) => {
  const user = c.get('user');
  const electionId = parseInt(c.req.param('id'));
  
  const election = queries.getElectionById.get(electionId);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  if (election.owner_user_id !== user.userId) {
    throw new ForbiddenError('Access denied');
  }
  
  if (election.status !== 'closed') {
    throw new ValidationError('Election must be closed to view audit data');
  }
  
  // Get all audit data
  const ballots = queries.getBallotsByElection.all(electionId)
    .map(row => JSON.parse(row.rankings_json));
  const receipts = queries.getReceiptsByElection.all(electionId)
    .map(row => row.receipt_hash);
  const candidates = queries.getCandidatesByElection.all(electionId);
  
  // Calculate results for audit
  const candidateIds = candidates.map(c => c.id);
  const tieBreakOrder = seededOrder(candidateIds, election.tie_break_seed);
  const results = irv(ballots, candidateIds, tieBreakOrder);
  
  return c.json({
    election: {
      id: election.id,
      slug: election.slug,
      title: election.title,
      mode: election.mode,
      seats: election.seats
    },
    candidates: candidates.map(c => ({ id: c.id, name: c.name, sort_index: c.sort_index })),
    ballots,
    receipts,
    results,
    metadata: {
      tie_break_seed: election.tie_break_seed,
      total_ballots: ballots.length,
      total_receipts: receipts.length,
      code_version: '0.1.0', // Would be from git commit in production
      generated_at: new Date().toISOString()
    }
  });
});

// Get voting analytics
elections.get('/:id/analytics', async (c) => {
  const user = c.get('user');
  const electionId = parseInt(c.req.param('id'));
  
  const election = queries.getElectionById.get(electionId);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  if (election.owner_user_id !== user.userId) {
    throw new ForbiddenError('Access denied');
  }
  
  // Get voting timeline data (votes per hour)
  const votingTimeline = db.query(`
    SELECT 
      DATE(created_at) as date,
      STRFTIME('%H', created_at) as hour,
      COUNT(*) as votes
    FROM ballots 
    WHERE election_id = ?
    GROUP BY DATE(created_at), STRFTIME('%H', created_at)
    ORDER BY DATE(created_at), STRFTIME('%H', created_at)
  `).all(electionId);
  
  // Get token usage stats
  const tokenStats = db.query(`
    SELECT 
      COUNT(*) as total_tokens,
      COUNT(used_at) as used_tokens,
      COUNT(*) - COUNT(used_at) as unused_tokens
    FROM voter_tokens 
    WHERE election_id = ?
  `).get(electionId);
  
  // Get ballot submission stats
  const ballotStats = db.query(`
    SELECT COUNT(*) as total_ballots
    FROM ballots
    WHERE election_id = ?
  `).get(electionId);
  
  return c.json({
    timeline: votingTimeline,
    token_stats: tokenStats,
    ballot_stats: ballotStats,
    completion_rate: tokenStats.total_tokens > 0 
      ? Math.round((ballotStats.total_ballots / tokenStats.total_tokens) * 100)
      : 0
  });
});

export default elections;