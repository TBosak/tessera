import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { publicApi } from '../lib/api';

export default function PublicElectionPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-election', slug],
    queryFn: () => publicApi.getElection(slug!),
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p>Loading election...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">Election Not Found</h1>
            <p className="text-gray-600">The election you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { election, candidates } = data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="warning">Draft</Badge>;
      case 'open':
        return <Badge variant="success">Open for Voting</Badge>;
      case 'closed':
        return <Badge variant="info">Voting Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="app-container py-8">
        {/* Header */}
        <div className="col-span-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">{election.title}</h1>
            {getStatusBadge(election.status)}
            {election.description && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {election.description}
              </p>
            )}
          </div>
        </div>

        {/* Voting CTA */}
        {election.status === 'open' && (
          <div className="col-span-12 text-center mt-8">
            <Card>
              <CardContent className="py-8">
                <h2 className="text-2xl font-bold mb-4">Ready to Vote?</h2>
                <p className="text-gray-600 mb-6">
                  Use your voting token to cast your ranked choice ballot.
                </p>
                <Button size="lg" asChild>
                  <Link to={`/e/${slug}/vote`}>Cast Your Vote</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Link */}
        {election.status === 'closed' && (
          <div className="col-span-12 text-center mt-8">
            <Card>
              <CardContent className="py-8">
                <h2 className="text-2xl font-bold mb-4">Voting Complete</h2>
                <p className="text-gray-600 mb-6">
                  This election has concluded. View the results and audit data.
                </p>
                <div className="flex justify-center gap-4">
                  <Button asChild>
                    <Link to={`/e/${slug}/results`}>View Results</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to={`/e/${slug}/receipts`}>View Receipts</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Candidates */}
        <div className="col-span-12 mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Candidates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate: any) => (
              <Card key={candidate.id} hover>
                <CardHeader>
                  <CardTitle>{candidate.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {candidate.info && (
                    <p className="text-gray-600">{candidate.info}</p>
                  )}
                  {candidate.image_url && (
                    <img 
                      src={candidate.image_url} 
                      alt={candidate.name}
                      className="w-full h-32 object-cover rounded-brutal mt-3"
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Election Info */}
        <div className="col-span-12 mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Election Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Voting Method:</span>
                  <p>{election.mode === 'IRV' ? 'Instant Runoff Voting' : 'Single Transferable Vote'}</p>
                </div>
                <div>
                  <span className="font-semibold">Seats:</span>
                  <p>{election.seats}</p>
                </div>
                {election.max_rank && (
                  <div>
                    <span className="font-semibold">Max Rankings:</span>
                    <p>{election.max_rank}</p>
                  </div>
                )}
                <div>
                  <span className="font-semibold">Status:</span>
                  <p>{election.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}