import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { publicApi } from '../lib/api';
import { useToast } from '../components/Toaster';

export default function ReceiptsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchReceipt, setSearchReceipt] = useState('');
  const { addToast } = useToast();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['election-receipts', slug],
    queryFn: () => publicApi.getReceipts(slug!),
    enabled: !!slug
  });

  const handleSearch = () => {
    if (!searchReceipt.trim()) {
      addToast({
        variant: 'warning',
        message: 'Please enter a receipt hash to search'
      });
      return;
    }

    const receipts = data?.receipts || [];
    const found = receipts.includes(searchReceipt.trim());
    
    addToast({
      variant: found ? 'success' : 'error',
      message: found 
        ? 'Receipt found! Your vote was included in the final tally.' 
        : 'Receipt not found. Please check the hash and try again.'
    });
  };

  const downloadReceipts = () => {
    if (!data?.receipts) return;
    
    const content = data.receipts.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug}-receipts.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p>Loading receipts...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">Receipts Not Available</h1>
            <p className="text-gray-600">
              Receipts are not yet available for this election.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { election, receipts, metadata } = data;

  return (
    <div className="min-h-screen bg-paper">
      <div className="app-container py-8">
        {/* Header */}
        <div className="col-span-12 text-center mb-8">
          <h1 className="text-3xl font-bold">{election.title}</h1>
          <Badge variant="info">Vote Receipts</Badge>
          <p className="text-gray-600 mt-2">
            Verify your vote was included in the final tally
          </p>
        </div>

        {/* Receipt Verification */}
        <div className="col-span-12 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Receipt</CardTitle>
              <p className="text-gray-600 mt-2">
                Enter your receipt hash to confirm your vote was counted.
              </p>
            </CardHeader>
            
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter your receipt hash..."
                  value={searchReceipt}
                  onChange={(e) => setSearchReceipt(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>
                  Verify Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Receipts List */}
        <div className="col-span-12">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Vote Receipts</CardTitle>
                  <p className="text-gray-600 mt-2">
                    Complete list of all {receipts.length} vote receipt hashes
                  </p>
                </div>
                <Button variant="outline" onClick={downloadReceipts}>
                  Download List
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="bg-gray-50 border-3 border-ink rounded-brutal p-4 max-h-96 overflow-y-auto">
                {receipts.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No receipts available yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {receipts.map((receipt: string, index: number) => (
                      <div 
                        key={index}
                        className="font-mono text-sm bg-white p-2 rounded border break-all"
                      >
                        {receipt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        <div className="col-span-12 mt-8">
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Total Receipts:</span>
                  <p>{metadata.total_receipts}</p>
                </div>
                <div>
                  <span className="font-semibold">Generated:</span>
                  <p>{new Date(metadata.generated_at).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <div className="col-span-12 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>About Vote Receipts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Privacy Protection:</strong> These receipt hashes cannot be linked back to 
                individual voters or their specific ballot choices.
              </p>
              <p>
                <strong>Verification:</strong> Use your personal receipt hash to verify your vote 
                was included in this list and counted in the final results.
              </p>
              <p>
                <strong>Transparency:</strong> This complete list enables independent auditing 
                of the election while maintaining voter privacy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}