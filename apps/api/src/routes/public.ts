import { Hono } from 'hono';
import { queries } from '../db/database.js';
import { lenientRateLimit } from '../middleware/rateLimit.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';
import { irv, seededOrder } from '../lib/counting.js';

const publicRoutes = new Hono();

// Apply lenient rate limiting to public routes
publicRoutes.use('*', lenientRateLimit);

// Get public election info
publicRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  
  const election = queries.getElectionBySlug.get(slug);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  // Get candidates
  const candidates = queries.getCandidatesByElection.all(election.id);
  
  // Public info only
  return c.json({
    election: {
      slug: election.slug,
      title: election.title,
      description: election.description,
      mode: election.mode,
      seats: election.seats,
      status: election.status,
      max_rank: election.max_rank
    },
    candidates: candidates.map(c => ({
      id: c.id,
      name: c.name,
      info: c.info,
      image_url: c.image_url
    }))
  });
});

// Get election results (if closed or live results enabled)
publicRoutes.get('/:slug/results', async (c) => {
  const slug = c.req.param('slug');
  
  const election = queries.getElectionBySlug.get(slug);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  if (election.status !== 'closed') {
    throw new ValidationError('Results not yet available');
  }
  
  // Get ballots and candidates
  const ballots = queries.getBallotsByElection.all(election.id)
    .map(row => JSON.parse(row.rankings_json));
  const candidates = queries.getCandidatesByElection.all(election.id);
  const candidateIds = candidates.map(c => c.id);
  
  // Calculate results using IRV
  const tieBreakOrder = seededOrder(candidateIds, election.tie_break_seed);
  const results = irv(ballots, candidateIds, tieBreakOrder);
  
  return c.json({
    election: {
      slug: election.slug,
      title: election.title,
      description: election.description,
      mode: election.mode,
      seats: election.seats,
      status: election.status
    },
    candidates: candidates.map(c => ({ 
      id: c.id, 
      name: c.name,
      info: c.info
    })),
    results,
    metadata: {
      total_ballots: ballots.length,
      calculated_at: new Date().toISOString()
    }
  });
});

// Get election receipts (if closed)
publicRoutes.get('/:slug/receipts', async (c) => {
  const slug = c.req.param('slug');
  
  const election = queries.getElectionBySlug.get(slug);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  if (election.status !== 'closed') {
    throw new ValidationError('Receipts not yet available');
  }
  
  const receipts = queries.getReceiptsByElection.all(election.id)
    .map(row => row.receipt_hash);
  
  return c.json({
    election: {
      slug: election.slug,
      title: election.title
    },
    receipts,
    metadata: {
      total_receipts: receipts.length,
      generated_at: new Date().toISOString()
    }
  });
});

// Get normalized ballots JSON (if closed and published)
publicRoutes.get('/:slug/ballots.json', async (c) => {
  const slug = c.req.param('slug');
  
  const election = queries.getElectionBySlug.get(slug);
  if (!election) {
    throw new NotFoundError('Election not found');
  }
  
  if (election.status !== 'closed') {
    throw new ValidationError('Ballots not yet available');
  }
  
  const ballots = queries.getBallotsByElection.all(election.id)
    .map(row => JSON.parse(row.rankings_json));
  
  // Return raw JSON array for easy consumption by replay tools
  c.header('Content-Type', 'application/json');
  return c.json(ballots);
});

export default publicRoutes;