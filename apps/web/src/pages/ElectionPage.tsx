import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Vote, CheckCircle, Trophy } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input, Textarea } from '../components/Input';
import { electionsApi } from '../lib/api';
import { useToast } from '../components/Toaster';
import { downloadCSV } from '../lib/utils';

export default function ElectionPage() {
  const { id } = useParams<{ id: string }>();
  const electionId = parseInt(id!);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'tokens' | 'results'>('overview');

  // Fetch election data
  const { data: election, isLoading, error } = useQuery({
    queryKey: ['election', electionId],
    queryFn: () => electionsApi.get(electionId),
    enabled: !!electionId
  });

  // Fetch token stats
  const { data: tokenStats } = useQuery({
    queryKey: ['election-tokens', electionId],
    queryFn: () => electionsApi.getTokenStats(electionId),
    enabled: !!electionId && election?.status !== 'draft'
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p>Loading election...</p>
      </div>
    );
  }

  if (error || !election) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">Election Not Found</h1>
            <p className="text-gray-600">The election you're looking for doesn't exist or you don't have access to it.</p>
            <Button className="mt-4" asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="warning">Draft</Badge>;
      case 'open':
        return <Badge variant="success">Open</Badge>;
      case 'closed':
        return <Badge variant="info">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="app-container py-8">
        {/* Header */}
        <div className="col-span-12 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{election.title}</h1>
                {getStatusBadge(election.status)}
              </div>
              <p className="text-gray-600">{election.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>Mode: {election.mode}</span>
                <span>•</span>
                <span>Seats: {election.seats}</span>
                {election.max_rank && (
                  <>
                    <span>•</span>
                    <span>Max Rankings: {election.max_rank}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/dashboard">← Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/e/${election.slug}`} target="_blank">
                  View Public Page →
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="col-span-12 mb-8">
          <div className="flex gap-2 border-b-3 border-ink">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'candidates', label: 'Candidates' },
              { key: 'tokens', label: 'Voting Tokens' },
              { key: 'results', label: 'Results' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-4 py-2 font-semibold border-b-3 -mb-[3px] ${
                  activeTab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="col-span-12">
          {activeTab === 'overview' && (
            <OverviewTab election={election} tokenStats={tokenStats} />
          )}
          {activeTab === 'candidates' && (
            <CandidatesTab election={election} />
          )}
          {activeTab === 'tokens' && (
            <TokensTab election={election} tokenStats={tokenStats} />
          )}
          {activeTab === 'results' && (
            <ResultsTab election={election} />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ election, tokenStats }: { election: any; tokenStats?: any }) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (status: 'draft' | 'open' | 'closed') => 
      electionsApi.updateStatus(election.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['election', election.id] });
      addToast({
        variant: 'success',
        message: 'Election status updated successfully!'
      });
    },
    onError: (error: any) => {
      addToast({
        variant: 'error',
        message: error.message || 'Failed to update status'
      });
    }
  });

  const handleStatusChange = (newStatus: 'draft' | 'open' | 'closed') => {
    const confirmMessage = 
      newStatus === 'open' ? 'Open this election for voting?' :
      newStatus === 'closed' ? 'Close this election? This cannot be undone.' :
      'Return this election to draft status?';

    if (confirm(confirmMessage)) {
      statusMutation.mutate(newStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Election Status */}
      <Card>
        <CardHeader>
          <CardTitle>Election Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="flex justify-center mb-2">
              {election.status === 'draft' ? <FileText className="w-12 h-12 text-gray-500" /> : 
               election.status === 'open' ? <Vote className="w-12 h-12 text-primary" /> : <CheckCircle className="w-12 h-12 text-accent" />}
            </div>
            <h3 className="text-xl font-semibold capitalize">{election.status}</h3>
          </div>

          <div className="space-y-2">
            {election.status === 'draft' && (
              <Button
                onClick={() => handleStatusChange('open')}
                disabled={!election.candidates || election.candidates.length < 2 || statusMutation.isPending}
                className="w-full"
              >
                {statusMutation.isPending ? 'Opening...' : 'Open for Voting'}
              </Button>
            )}

            {election.status === 'open' && (
              <Button
                variant="secondary"
                onClick={() => handleStatusChange('closed')}
                disabled={statusMutation.isPending}
                className="w-full"
              >
                {statusMutation.isPending ? 'Closing...' : 'Close Election'}
              </Button>
            )}

            {election.status === 'closed' && (
              <div className="text-center text-gray-600">
                <p>This election has been closed.</p>
                <p className="text-sm mt-1">Results and audit data are available.</p>
              </div>
            )}
          </div>

          {election.status === 'draft' && (!election.candidates || election.candidates.length < 2) && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-brutal p-3 text-sm">
              <p className="font-semibold text-yellow-800">Ready to open?</p>
              <p className="text-yellow-700">Add at least 2 candidates and generate voting tokens first.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-brutal">
              <div className="text-2xl font-bold text-primary">
                {election.candidates?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Candidates</div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-brutal">
              <div className="text-2xl font-bold text-accent">
                {tokenStats?.total || 0}
              </div>
              <div className="text-sm text-gray-600">Voting Tokens</div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-brutal">
              <div className="text-2xl font-bold text-secondary">
                {tokenStats?.used || 0}
              </div>
              <div className="text-sm text-gray-600">Votes Cast</div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-brutal">
              <div className="text-2xl font-bold text-gray-600">
                {tokenStats?.unused || 0}
              </div>
              <div className="text-sm text-gray-600">Tokens Left</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" asChild>
                <Link to={`/e/${election.slug}`} target="_blank">
                  View Public Page
                </Link>
              </Button>

              {election.status === 'open' && (
                <Button variant="outline" asChild>
                  <Link to={`/e/${election.slug}/vote`} target="_blank">
                    Test Voting
                  </Link>
                </Button>
              )}

              {(election.status === 'closed') && (
                <>
                  <Button variant="outline" asChild>
                    <Link to={`/e/${election.slug}/results`} target="_blank">
                      View Results
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to={`/e/${election.slug}/receipts`} target="_blank">
                      View Receipts
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CandidatesTab({ election }: { election: any }) {
  const [candidates, setCandidates] = useState(election.candidates || []);
  const [isEditing, setIsEditing] = useState(false);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const candidatesMutation = useMutation({
    mutationFn: (candidatesData: any[]) => 
      electionsApi.updateCandidates(election.id, candidatesData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['election', election.id] });
      setIsEditing(false);
      addToast({
        variant: 'success',
        message: 'Candidates updated successfully!'
      });
    },
    onError: (error: any) => {
      addToast({
        variant: 'error',
        message: error.message || 'Failed to update candidates'
      });
    }
  });

  const addCandidate = () => {
    setCandidates([...candidates, {
      name: '',
      info: '',
      image_url: '',
      sort_index: candidates.length
    }]);
    setIsEditing(true);
  };

  const updateCandidate = (index: number, field: string, value: string) => {
    const updated = [...candidates];
    updated[index] = { ...updated[index], [field]: value };
    setCandidates(updated);
  };

  const removeCandidate = (index: number) => {
    const updated = candidates.filter((_: any, i: number) => i !== index);
    // Reindex sort_index
    updated.forEach((candidate: any, i: number) => {
      candidate.sort_index = i;
    });
    setCandidates(updated);
  };

  const moveCandidate = (fromIndex: number, toIndex: number) => {
    const updated = [...candidates];
    const [movedCandidate] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedCandidate);
    
    // Reindex sort_index
    updated.forEach((candidate: any, i: number) => {
      candidate.sort_index = i;
    });
    setCandidates(updated);
  };

  const handleSave = () => {
    // Validate and clean candidates
    const validCandidates = candidates
      .filter((c: any) => c.name.trim())
      .map((c: any) => ({
        name: c.name.trim(),
        info: c.info?.trim() || undefined,
        image_url: c.image_url?.trim() || undefined,
        sort_index: c.sort_index
      }));
    
    if (validCandidates.length < 2) {
      addToast({
        variant: 'error',
        message: 'At least 2 candidates are required'
      });
      return;
    }

    candidatesMutation.mutate(validCandidates);
  };

  const handleCancel = () => {
    setCandidates(election.candidates || []);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Manage Candidates</CardTitle>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={candidatesMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={candidatesMutation.isPending}
                >
                  {candidatesMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setIsEditing(true)}
                disabled={election.status !== 'draft'}
              >
                Edit Candidates
              </Button>
            )}
          </div>
        </div>
        {election.status !== 'draft' && (
          <p className="text-sm text-gray-600">
            Candidates can only be modified when the election is in draft status.
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {candidates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No candidates added yet.</p>
            <Button onClick={addCandidate} disabled={election.status !== 'draft'}>
              Add First Candidate
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate: any, index: number) => (
              <div key={index} className="border-2 border-gray-200 rounded-brutal p-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Candidate {index + 1}</span>
                      <div className="flex gap-2">
                        {index > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => moveCandidate(index, index - 1)}
                          >
                            ↑
                          </Button>
                        )}
                        {index < candidates.length - 1 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => moveCandidate(index, index + 1)}
                          >
                            ↓
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => removeCandidate(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    
                    <Input
                      label="Candidate Name"
                      value={candidate.name}
                      onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                      placeholder="Enter candidate name"
                      required
                    />
                    
                    <Textarea
                      label="Bio/Description (Optional)"
                      value={candidate.info || ''}
                      onChange={(e) => updateCandidate(index, 'info', e.target.value)}
                      placeholder="Brief description or biography"
                    />
                    
                    <Input
                      label="Photo URL (Optional)"
                      value={candidate.image_url || ''}
                      onChange={(e) => updateCandidate(index, 'image_url', e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-paper rounded-brutal flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{candidate.name}</h4>
                      {candidate.info && (
                        <p className="text-gray-600 mt-1">{candidate.info}</p>
                      )}
                    </div>
                    
                    {candidate.image_url && (
                      <img 
                        src={candidate.image_url} 
                        alt={candidate.name}
                        className="w-16 h-16 object-cover rounded-brutal"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}

            {isEditing && (
              <Button 
                variant="outline" 
                onClick={addCandidate}
                className="w-full"
              >
                + Add Another Candidate
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TokensTab({ election, tokenStats }: { election: any; tokenStats?: any }) {
  const [tokenCount, setTokenCount] = useState(10);
  const [labelPrefix, setLabelPrefix] = useState('');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const mintMutation = useMutation({
    mutationFn: ({ count, prefix }: { count: number; prefix?: string }) => 
      electionsApi.mintTokens(election.id, count, prefix),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['election-tokens', election.id] });
      
      // Download CSV
      const filename = `${election.slug}-voting-tokens-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(data.csv, filename);
      
      addToast({
        variant: 'success',
        message: `${data.count} voting tokens generated and downloaded!`
      });
    },
    onError: (error: any) => {
      addToast({
        variant: 'error',
        message: error.message || 'Failed to generate tokens'
      });
    }
  });

  const handleMintTokens = () => {
    if (tokenCount < 1 || tokenCount > 10000) {
      addToast({
        variant: 'error',
        message: 'Token count must be between 1 and 10,000'
      });
      return;
    }

    mintMutation.mutate({
      count: tokenCount,
      prefix: labelPrefix || undefined
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Token Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Token Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {tokenStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{tokenStats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{tokenStats.used}</div>
                  <div className="text-sm text-gray-600">Used</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">{tokenStats.unused}</div>
                  <div className="text-sm text-gray-600">Unused</div>
                </div>
              </div>

              {tokenStats.total > 0 && (
                <div className="bg-gray-50 rounded-brutal p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Voting Progress</span>
                    <span>{Math.round((tokenStats.used / tokenStats.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-brutal h-2">
                    <div 
                      className="bg-primary h-2 rounded-brutal transition-all duration-300"
                      style={{ width: `${(tokenStats.used / tokenStats.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No tokens generated yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Generate Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Voting Tokens</CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            Create secure one-time voting tokens for your election.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Number of Tokens"
            type="number"
            min="1"
            max="10000"
            value={tokenCount}
            onChange={(e) => setTokenCount(parseInt(e.target.value) || 1)}
            helper="Between 1 and 10,000 tokens"
          />

          <Input
            label="Label Prefix (Optional)"
            value={labelPrefix}
            onChange={(e) => setLabelPrefix(e.target.value)}
            placeholder="e.g., 'voter', 'member'"
            helper="Tokens will be labeled: prefix-1, prefix-2, etc."
          />

          <Button
            onClick={handleMintTokens}
            disabled={mintMutation.isPending || election.status === 'closed'}
            className="w-full"
          >
            {mintMutation.isPending ? 'Generating...' : 'Generate & Download Tokens'}
          </Button>

          {election.status === 'closed' && (
            <p className="text-sm text-gray-500">
              Cannot generate tokens for closed elections.
            </p>
          )}

          <div className="bg-blue-50 border-2 border-blue-200 rounded-brutal p-3 text-sm">
            <p className="font-semibold text-blue-800 mb-1">Important:</p>
            <ul className="text-blue-700 space-y-1">
              <li>• Tokens are shown only once for security</li>
              <li>• Share tokens securely with eligible voters</li>
              <li>• Each token can only be used once</li>
              <li>• Download will start automatically</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultsTab({ election }: { election: any }) {
  const { data: results, isLoading } = useQuery({
    queryKey: ['election-results', election.id],
    queryFn: () => electionsApi.getResults(election.id),
    enabled: election.status === 'closed'
  });

  const { data: audit } = useQuery({
    queryKey: ['election-audit', election.id],
    queryFn: () => electionsApi.getAudit(election.id),
    enabled: election.status === 'closed'
  });

  if (election.status !== 'closed') {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <h3 className="text-xl font-semibold mb-2">Results Not Available</h3>
          <p className="text-gray-600 mb-4">
            Results will be available once the election is closed.
          </p>
          <p className="text-sm text-gray-500">
            Current status: <span className="font-semibold capitalize">{election.status}</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p>Loading results...</p>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-600">No results available.</p>
        </CardContent>
      </Card>
    );
  }

  const candidateMap = new Map(results.candidates.map((c: any) => [c.id, c]));
  const winner = results.results.winner ? candidateMap.get(results.results.winner) : null;

  const downloadAuditData = () => {
    if (audit) {
      const auditJson = JSON.stringify(audit, null, 2);
      const blob = new Blob([auditJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${election.slug}-audit-data.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Winner */}
      {winner && (
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Winner</h2>
            <h3 className="text-xl text-primary font-semibold">{winner.name}</h3>
            <p className="text-gray-600 mt-2">{results.metadata.total_ballots} total votes cast</p>
          </CardContent>
        </Card>
      )}

      {/* Rounds */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Round-by-Round Results</CardTitle>
            {audit && (
              <Button variant="outline" onClick={downloadAuditData}>
                Download Audit Data
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {results.results.rounds.map((round: any, index: number) => (
              <div key={index} className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold mb-3">
                  Round {index + 1}
                  {round.eliminated && (
                    <span className="text-sm text-gray-600 ml-2">
                      (Eliminated: {candidateMap.get(round.eliminated)?.name})
                    </span>
                  )}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(round.tallies)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .map(([candidateId, votes]) => {
                      const candidate = candidateMap.get(parseInt(candidateId));
                      const isEliminated = round.eliminated === parseInt(candidateId);
                      
                      return (
                        <div 
                          key={candidateId}
                          className={`p-3 rounded-brutal border-2 ${
                            isEliminated ? 'border-secondary bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{candidate?.name}</span>
                            <span className={`font-bold ${isEliminated ? 'text-secondary' : ''}`}>
                              {votes}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Public Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" asChild>
              <Link to={`/e/${election.slug}/results`} target="_blank">
                View Public Results →
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/e/${election.slug}/receipts`} target="_blank">
                View Receipts →
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/e/${election.slug}/ballots.json`} target="_blank">
                Download Ballots JSON →
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}