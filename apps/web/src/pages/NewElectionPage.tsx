import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { electionsApi } from '../lib/api';
import { useToast } from '../components/Toaster';

export default function NewElectionPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'IRV' | 'STV'>('IRV');
  const [seats, setSeats] = useState(1);
  const [maxRank, setMaxRank] = useState<number | undefined>();
  
  const navigate = useNavigate();
  const { addToast } = useToast();

  const createMutation = useMutation({
    mutationFn: electionsApi.create,
    onSuccess: (data) => {
      addToast({
        variant: 'success',
        message: 'Election created successfully!'
      });
      navigate(`/elections/${data.id}`);
    },
    onError: (error: any) => {
      addToast({
        variant: 'error',
        message: error.message || 'Failed to create election'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createMutation.mutate({
      title,
      description: description || undefined,
      mode,
      seats,
      max_rank: maxRank || undefined
    });
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="app-container py-8">
        <div className="col-span-12 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create New Election</CardTitle>
              <p className="text-gray-600 mt-2">
                Set up the basic details for your ranked choice voting election.
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Election Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Board of Directors Election 2024"
                  required
                />
                
                <Textarea
                  label="Description (Optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context about this election..."
                  helper="This will be shown to voters on the public election page."
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-2">
                      Voting Mode
                    </label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as 'IRV' | 'STV')}
                      className="input w-full"
                    >
                      <option value="IRV">IRV (Single Winner)</option>
                      <option value="STV">STV (Multi Winner)</option>
                    </select>
                  </div>
                  
                  <Input
                    label="Number of Seats"
                    type="number"
                    min="1"
                    value={seats}
                    onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
                    helper={mode === 'IRV' ? 'Always 1 for IRV' : undefined}
                    disabled={mode === 'IRV'}
                  />
                </div>
                
                <Input
                  label="Max Rankings (Optional)"
                  type="number"
                  min="1"
                  value={maxRank || ''}
                  onChange={(e) => setMaxRank(parseInt(e.target.value) || undefined)}
                  placeholder="Leave empty for no limit"
                  helper="Limit how many candidates voters can rank"
                />
                
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={!title || createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Election'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}