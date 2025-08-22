import { z } from 'zod';

// Election schemas
export const CreateElectionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  mode: z.enum(['IRV', 'STV']).default('IRV'),
  seats: z.number().int().min(1).default(1),
  max_rank: z.number().int().min(1).optional()
});

export const UpdateElectionStatusSchema = z.object({
  status: z.enum(['draft', 'open', 'closed'])
});

// Candidate schemas
export const CandidateSchema = z.object({
  name: z.string().min(1).max(100),
  info: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  sort_index: z.number().int().min(0).default(0)
});

export const CandidatesArraySchema = z.array(CandidateSchema);

// Token schemas
export const MintTokensSchema = z.object({
  count: z.number().int().min(1).max(10000),
  labelPrefix: z.string().optional()
});

// Voting schemas
export const ClaimTokenSchema = z.object({
  slug: z.string().min(1),
  token: z.string().min(1)
});

export const SubmitBallotSchema = z.object({
  ballot_session_jwt: z.string(),
  rankings: z.array(z.number().int().positive())
});

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// Email voting schemas
export const RequestMagicLinkSchema = z.object({
  slug: z.string().min(1),
  email: z.string().email()
});

export const MagicLinkCallbackSchema = z.object({
  slug: z.string().min(1),
  token: z.string().min(1)
});

export type CreateElection = z.infer<typeof CreateElectionSchema>;
export type UpdateElectionStatus = z.infer<typeof UpdateElectionStatusSchema>;
export type Candidate = z.infer<typeof CandidateSchema>;
export type CandidatesArray = z.infer<typeof CandidatesArraySchema>;
export type MintTokens = z.infer<typeof MintTokensSchema>;
export type ClaimToken = z.infer<typeof ClaimTokenSchema>;
export type SubmitBallot = z.infer<typeof SubmitBallotSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type Register = z.infer<typeof RegisterSchema>;
export type RequestMagicLink = z.infer<typeof RequestMagicLinkSchema>;
export type MagicLinkCallback = z.infer<typeof MagicLinkCallbackSchema>;