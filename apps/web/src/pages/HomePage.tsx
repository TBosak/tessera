import React from 'react';
import { Link } from 'react-router-dom';
import { Vote, Lock, BarChart3 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="app-container py-12">
        {/* Hero Section */}
        <div className="col-span-12 text-center space-y-6">
          <h1 className="text-hero font-display font-black text-ink">
            Tessera
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Ranked choice voting made simple. Create elections, collect votes, and see results with full transparency and auditability.
          </p>
        </div>

        {/* CTA Section */}
        <div className="col-span-12 flex flex-wrap justify-center gap-4 mt-8">
          <Button asChild>
            <Link to="/login">Get Started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="#features">Learn More</Link>
          </Button>
        </div>

        {/* Features Grid */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 mt-16" id="features">
          <Card hover>
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-brutal mx-auto flex items-center justify-center">
                <Vote className="w-8 h-8 text-paper" />
              </div>
              <h3 className="text-xl font-bold">Instant Runoff Voting</h3>
              <p className="text-gray-600">
                Single-winner ranked choice voting with deterministic tie-breaking and transparent counting.
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 bg-accent rounded-brutal mx-auto flex items-center justify-center">
                <Lock className="w-8 h-8 text-ink" />
              </div>
              <h3 className="text-xl font-bold">Secure & Private</h3>
              <p className="text-gray-600">
                Unlinkable ballots protect voter privacy while maintaining full election auditability.
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 bg-secondary rounded-brutal mx-auto flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-paper" />
              </div>
              <h3 className="text-xl font-bold">Transparent Results</h3>
              <p className="text-gray-600">
                Published receipts, normalized ballots, and deterministic replay enable full verification.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="col-span-12 mt-16 space-y-8">
          <h2 className="text-3xl font-bold text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary text-paper rounded-brutal mx-auto flex items-center justify-center font-bold text-xl">
                1
              </div>
              <h4 className="font-semibold">Create Election</h4>
              <p className="text-sm text-gray-600">Set up candidates and voting parameters</p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary text-paper rounded-brutal mx-auto flex items-center justify-center font-bold text-xl">
                2
              </div>
              <h4 className="font-semibold">Distribute Tokens</h4>
              <p className="text-sm text-gray-600">Share secure voting tokens with eligible voters</p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary text-paper rounded-brutal mx-auto flex items-center justify-center font-bold text-xl">
                3
              </div>
              <h4 className="font-semibold">Collect Votes</h4>
              <p className="text-sm text-gray-600">Voters rank candidates in order of preference</p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary text-paper rounded-brutal mx-auto flex items-center justify-center font-bold text-xl">
                4
              </div>
              <h4 className="font-semibold">View Results</h4>
              <p className="text-sm text-gray-600">See transparent results with full audit trail</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}