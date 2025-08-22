// API client configuration and utilities

const API_BASE = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for auth
    ...options,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    let error;
    try {
      const errorData = await response.json();
      error = new ApiError(
        response.status,
        errorData.code || 'UNKNOWN_ERROR',
        errorData.message || 'An error occurred',
        errorData.fieldErrors
      );
    } catch {
      error = new ApiError(
        response.status,
        'NETWORK_ERROR',
        `HTTP ${response.status}: ${response.statusText}`
      );
    }
    throw error;
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: { id: number; email: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    request<{ 
      user: { id: number; email: string; email_verified: boolean }; 
      message: string;
      email_sent: boolean;
      needs_verification: boolean;
      verification_email_from?: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  me: () =>
    request<{ user: { id: number; email: string } }>('/api/auth/me'),
};

// Elections API
export const electionsApi = {
  create: (data: {
    title: string;
    description?: string;
    mode?: 'IRV' | 'STV';
    seats?: number;
    max_rank?: number;
  }) =>
    request<any>('/api/elections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: () =>
    request<{ elections: any[] }>('/api/elections'),

  get: (id: number) =>
    request<any>(`/api/elections/${id}`),

  updateStatus: (id: number, status: 'draft' | 'open' | 'closed') =>
    request<{ message: string }>(`/api/elections/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  updateCandidates: (id: number, candidates: Array<{
    name: string;
    info?: string;
    image_url?: string;
    sort_index: number;
  }>) =>
    request<{ candidates: any[] }>(`/api/elections/${id}/candidates`, {
      method: 'POST',
      body: JSON.stringify(candidates),
    }),

  mintTokens: (id: number, count: number, labelPrefix?: string) =>
    request<{ count: number; csv: string; message: string }>(`/api/elections/${id}/tokens/mint`, {
      method: 'POST',
      body: JSON.stringify({ count, labelPrefix }),
    }),

  getTokenStats: (id: number) =>
    request<{ total: number; used: number; unused: number }>(`/api/elections/${id}/tokens/stats`),

  getResults: (id: number) =>
    request<any>(`/api/elections/${id}/results`),

  getAudit: (id: number) =>
    request<any>(`/api/elections/${id}/audit`),

  getAnalytics: (id: number) =>
    request<{
      timeline: Array<{ date: string; hour: string; votes: number }>;
      token_stats: { total_tokens: number; used_tokens: number; unused_tokens: number };
      ballot_stats: { total_ballots: number };
      completion_rate: number;
    }>(`/api/elections/${id}/analytics`),
};

// Voting API
export const voteApi = {
  claimToken: (slug: string, token: string) =>
    request<{
      ballot_session_jwt: string;
      election: {
        id: number;
        slug: string;
        title: string;
        description?: string;
        max_rank?: number;
      };
    }>('/api/vote/claim', {
      method: 'POST',
      body: JSON.stringify({ slug, token }),
    }),

  submitBallot: (ballot_session_jwt: string, rankings: number[]) =>
    request<{
      receipt_hash: string;
      message: string;
      election: { slug: string; title: string };
    }>('/api/vote/submit', {
      method: 'POST',
      body: JSON.stringify({ ballot_session_jwt, rankings }),
    }),
};

// Public API
export const publicApi = {
  getElection: (slug: string) =>
    request<{
      election: {
        slug: string;
        title: string;
        description?: string;
        mode: string;
        seats: number;
        status: string;
        max_rank?: number;
      };
      candidates: Array<{
        id: number;
        name: string;
        info?: string;
        image_url?: string;
      }>;
    }>(`/api/public/${slug}`),

  getResults: (slug: string) =>
    request<any>(`/api/public/${slug}/results`),

  getReceipts: (slug: string) =>
    request<{
      election: { slug: string; title: string };
      receipts: string[];
      metadata: { total_receipts: number; generated_at: string };
    }>(`/api/public/${slug}/receipts`),

  getBallots: (slug: string) =>
    request<number[][]>(`/api/public/${slug}/ballots.json`),
};