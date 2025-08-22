import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { electionsApi } from '../lib/api';

interface VotingAnalyticsChartProps {
  electionId: number;
}

export function VotingAnalyticsChart({ electionId }: VotingAnalyticsChartProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['election-analytics', electionId],
    queryFn: () => electionsApi.getAnalytics(electionId)
  });

  if (isLoading) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-500">
        Loading analytics...
      </div>
    );
  }

  if (!analytics || analytics.timeline.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-500">
        No voting data yet
      </div>
    );
  }

  // Group timeline data by hour for the last 24 hours or since voting started
  const maxVotes = Math.max(...analytics.timeline.map(d => d.votes));
  const chartHeight = 80;
  const chartWidth = 300;
  const barWidth = Math.max(8, chartWidth / analytics.timeline.length - 2);

  return (
    <div className="space-y-4">
      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="font-bold text-lg text-primary">{analytics.completion_rate}%</div>
          <div className="text-gray-600">Completion Rate</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-lg text-accent">{analytics.ballot_stats.total_ballots}</div>
          <div className="text-gray-600">Votes Cast</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-lg text-secondary">{analytics.token_stats.unused_tokens}</div>
          <div className="text-gray-600">Unused Tokens</div>
        </div>
      </div>

      {/* Simple voting timeline chart */}
      <div>
        <h4 className="font-semibold mb-2 text-sm">Voting Timeline</h4>
        <div className="border-2 border-ink rounded p-2 bg-white">
          <svg width={chartWidth} height={chartHeight} className="w-full h-20">
            {analytics.timeline.map((point, index) => {
              const barHeight = (point.votes / maxVotes) * (chartHeight - 20);
              const x = index * (barWidth + 2);
              const y = chartHeight - barHeight - 10;
              
              return (
                <g key={`${point.date}-${point.hour}`}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="#2D5BFF"
                    className="hover:fill-opacity-80"
                  />
                  <title>{`${point.hour}:00 - ${point.votes} votes`}</title>
                </g>
              );
            })}
            
            {/* Y-axis labels */}
            <text x="5" y="15" fontSize="10" fill="#666">
              {maxVotes}
            </text>
            <text x="5" y={chartHeight - 5} fontSize="10" fill="#666">
              0
            </text>
            
            {/* X-axis label */}
            <text x={chartWidth / 2} y={chartHeight - 2} fontSize="10" fill="#666" textAnchor="middle">
              Hours
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}