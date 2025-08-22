import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { electionsApi } from '../lib/api';
import { formatDate } from '../lib/utils';

export default function DashboardPage() {
  const { data: electionsData, isLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: () => electionsApi.list()
  });

  const elections = electionsData?.elections || [];

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
        <div className="col-span-12 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your elections</p>
          </div>
          <Button asChild>
            <Link to="/elections/new">Create Election</Link>
          </Button>
        </div>

        {/* Elections Grid */}
        <div className="col-span-12 mt-8">
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading elections...</p>
            </div>
          ) : elections.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <h3 className="text-xl font-semibold mb-2">No elections yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first election to get started with ranked choice voting.
                </p>
                <Button asChild>
                  <Link to="/elections/new">Create Election</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {elections.map((election: any) => (
                <Card key={election.id} hover>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{election.title}</CardTitle>
                      {getStatusBadge(election.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {election.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {election.description}
                        </p>
                      )}
                      <div className="text-sm text-gray-500">
                        <p>Mode: {election.mode}</p>
                        <p>Created: {formatDate(election.created_at)}</p>
                      </div>
                      <div className="pt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/elections/${election.id}`}>
                            Manage
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}