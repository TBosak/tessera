import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Input } from '../components/Input';
import { RankingInterface } from '../components/RankingInterface';
import { voteApi, publicApi } from '../lib/api';
import { useToast } from '../components/Toaster';

export default function VotePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [step, setStep] = useState<'token' | 'ballot' | 'receipt'>('token');
  const [token, setToken] = useState('');
  const [ballotSession, setBallotSession] = useState<string>('');
  const [electionData, setElectionData] = useState<any>(null);
  const [rankings, setRankings] = useState<number[]>([]);
  const [receipt, setReceipt] = useState<string>('');

  // Get public election data for candidates
  const { data: publicElectionData } = useQuery({
    queryKey: ['public-election', slug],
    queryFn: () => publicApi.getElection(slug!),
    enabled: !!slug
  });

  const claimMutation = useMutation({
    mutationFn: (data: { slug: string; token: string }) => 
      voteApi.claimToken(data.slug, data.token),
    onSuccess: (data) => {
      setBallotSession(data.ballot_session_jwt);
      setElectionData(data.election);
      setStep('ballot');
      addToast({
        variant: 'success',
        message: 'Token verified! You can now cast your vote.'
      });
    },
    onError: (error: any) => {
      addToast({
        variant: 'error',
        message: error.message || 'Invalid token'
      });
    }
  });

  const submitMutation = useMutation({
    mutationFn: (data: { ballot_session_jwt: string; rankings: number[] }) =>
      voteApi.submitBallot(data.ballot_session_jwt, data.rankings),
    onSuccess: (data) => {
      setReceipt(data.receipt_hash);
      setStep('receipt');
      addToast({
        variant: 'success',
        message: 'Your vote has been cast successfully!'
      });
    },
    onError: (error: any) => {
      addToast({
        variant: 'error',
        message: error.message || 'Failed to submit vote'
      });
    }
  });

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || !slug) return;
    
    claimMutation.mutate({ slug, token: token.trim() });
  };

  const handleBallotSubmit = () => {
    if (rankings.length === 0) {
      addToast({
        variant: 'error',
        message: 'Please rank at least one candidate'
      });
      return;
    }

    submitMutation.mutate({
      ballot_session_jwt: ballotSession,
      rankings
    });
  };

  const copyReceipt = () => {
    navigator.clipboard.writeText(receipt);
    addToast({
      variant: 'success',
      message: 'Receipt copied to clipboard!'
    });
  };

  if (!publicElectionData) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p>Loading election...</p>
      </div>
    );
  }

  const { election, candidates } = publicElectionData;

  if (election.status !== 'open') {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">Voting Not Available</h1>
            <p className="text-gray-600">
              This election is currently {election.status} and not accepting votes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="app-container py-8">
        {/* Header */}
        <div className="col-span-12 text-center mb-8">
          <h1 className="text-3xl font-bold">{election.title}</h1>
          <p className="text-gray-600 mt-2">Cast Your Ranked Choice Vote</p>
        </div>

        {/* Token Entry Step */}
        {step === 'token' && (
          <div className="col-span-12 max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Enter Voting Token</CardTitle>
                <p className="text-gray-600 mt-2">
                  Enter the voting token you received to proceed.
                </p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleTokenSubmit} className="space-y-4">
                  <Input
                    label="Voting Token"
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter your voting token"
                    required
                  />
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!token.trim() || claimMutation.isPending}
                  >
                    {claimMutation.isPending ? 'Verifying...' : 'Continue to Ballot'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ballot Step */}
        {step === 'ballot' && (
          <div className="col-span-12">
            <Card>
              <CardHeader>
                <CardTitle>Rank the Candidates</CardTitle>
                <p className="text-gray-600 mt-2">
                  Drag candidates to reorder them, or use the buttons to build your ranking. 
                  Your first choice should be at the top.
                  {election.max_rank && ` You may rank up to ${election.max_rank} candidates.`}
                </p>
              </CardHeader>
              
              <CardContent>
                <RankingInterface
                  candidates={candidates}
                  rankings={rankings}
                  onChange={setRankings}
                  maxRank={election.max_rank}
                />
                
                <div className="flex justify-between items-center mt-8 pt-6 border-t-3 border-ink">
                  <div className="text-sm text-gray-600">
                    {rankings.length === 0 
                      ? 'No candidates ranked yet'
                      : `${rankings.length} candidate${rankings.length === 1 ? '' : 's'} ranked`
                    }
                  </div>
                  
                  <Button
                    onClick={handleBallotSubmit}
                    disabled={rankings.length === 0 || submitMutation.isPending}
                    size="lg"
                  >
                    {submitMutation.isPending ? 'Submitting...' : 'Cast Vote'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Receipt Step */}
        {step === 'receipt' && (
          <div className="col-span-12 max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Vote Submitted Successfully!</CardTitle>
                <p className="text-gray-600 mt-2">
                  Your vote has been recorded. Save your receipt hash for verification.
                </p>
              </CardHeader>
              
              <CardContent className="text-center space-y-6">
                <div className="bg-gray-100 border-3 border-ink rounded-brutal p-4">
                  <h4 className="font-semibold mb-2">Your Receipt Hash:</h4>
                  <code className="text-sm font-mono break-all bg-white px-3 py-2 rounded border">
                    {receipt}
                  </code>
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button onClick={copyReceipt}>
                    Copy Receipt
                  </Button>
                  
                  <Button variant="outline" onClick={() => navigate(`/e/${slug}`)}>
                    Back to Election
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>What is this receipt?</strong>
                  </p>
                  <p>
                    This unique hash proves your vote was included in the final tally. 
                    When results are published, you can verify your receipt appears in the list 
                    of all submitted votes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}