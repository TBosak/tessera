import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { publicApi } from '../lib/api';

export default function ResultsPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['election-results', slug],
    queryFn: () => publicApi.getResults(slug!),
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p>Loading results...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">Results Not Available</h1>
            <p className="text-gray-600">
              Results are not yet available for this election.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { election, candidates, results, metadata } = data;
  const candidateMap = new Map(candidates.map((c: any) => [c.id, c]));
  const winner = results.winner ? candidateMap.get(results.winner) : null;

  return (
    <div className="min-h-screen bg-paper">
      <div className="app-container py-8">
        {/* Header */}
        <div className="col-span-12 text-center mb-8">
          <h1 className="text-3xl font-bold">{election.title}</h1>
          <Badge variant="info">Final Results</Badge>
        </div>

        {/* Winner */}
        {winner && (
          <div className="col-span-12 mb-8">
            <Card>
              <CardContent className="text-center py-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-8 h-8 text-primary" />
                  <h2 className="text-2xl font-bold">Winner</h2>
                </div>
                <h3 className="text-xl font-semibold text-primary">{winner.name}</h3>
                {winner.info && (
                  <p className="text-gray-600 mt-2">{winner.info}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rounds */}
        <div className="col-span-12">
          <Card>
            <CardHeader>
              <CardTitle>Round-by-Round Results</CardTitle>
              <p className="text-gray-600 mt-2">
                {election.mode === 'IRV' ? 'Instant Runoff Voting' : 'Single Transferable Vote'} rounds
              </p>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                {results.rounds.map((round: any, index: number) => (
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
        </div>

        {/* Metadata */}
        <div className="col-span-12 mt-8">
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Total Ballots:</span>
                  <p>{metadata.total_ballots}</p>
                </div>
                <div>
                  <span className="font-semibold">Voting Method:</span>
                  <p>{election.mode}</p>
                </div>
                <div>
                  <span className="font-semibold">Calculated:</span>
                  <p>{new Date(metadata.calculated_at).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}