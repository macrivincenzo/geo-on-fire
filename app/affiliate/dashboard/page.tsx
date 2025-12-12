'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface AffiliateStats {
  totalVisits: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  revenueFormatted: string;
}

interface AffiliateTracking {
  id: string;
  userId: string | null;
  affiliateId: string;
  source: string;
  campaign: string | null;
  converted: boolean;
  conversionType: string | null;
  conversionValue: number | null;
  createdAt: string;
  convertedAt: string | null;
}

async function fetchAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  const response = await fetch(`/api/affiliate/stats?affiliateId=${affiliateId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch affiliate stats');
  }
  return response.json();
}

async function fetchAffiliateTracking(): Promise<{ tracking: AffiliateTracking[] }> {
  const response = await fetch('/api/affiliate/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch affiliate tracking');
  }
  return response.json();
}

export default function AffiliateDashboard() {
  const { data: session, isPending } = useSession();

  // Use user ID as affiliate ID for now (can be customized later)
  const affiliateId = session?.user?.id || '';

  const { data: stats, isLoading: statsLoading } = useQuery<AffiliateStats>({
    queryKey: ['affiliate-stats', affiliateId],
    queryFn: () => fetchAffiliateStats(affiliateId),
    enabled: !!affiliateId,
  });

  const { data: trackingData, isLoading: trackingLoading } = useQuery<{ tracking: AffiliateTracking[] }>({
    queryKey: ['affiliate-tracking'],
    queryFn: fetchAffiliateTracking,
    enabled: !!session,
  });

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your affiliate dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Track your referrals and earnings
          </p>
        </div>

        {statsLoading ? (
          <div className="text-center py-12">Loading stats...</div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVisits}</div>
                <p className="text-xs text-muted-foreground">All-time visits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalConversions}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.conversionRate}% conversion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.revenueFormatted}</div>
                <p className="text-xs text-muted-foreground">From conversions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">Average rate</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
            <CardDescription>Track your affiliate referrals and conversions</CardDescription>
          </CardHeader>
          <CardContent>
            {trackingLoading ? (
              <div className="text-center py-8">Loading tracking data...</div>
            ) : trackingData?.tracking && trackingData.tracking.length > 0 ? (
              <div className="space-y-4">
                {trackingData.tracking.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{track.source}</span>
                        {track.campaign && (
                          <span className="text-sm text-gray-500">• {track.campaign}</span>
                        )}
                        {track.converted && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Converted
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {format(new Date(track.createdAt), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                    <div className="text-right">
                      {track.converted && track.conversionValue && (
                        <div className="font-semibold text-green-600">
                          ${(track.conversionValue / 100).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No referrals yet. Share your affiliate link to start earning!
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your Affiliate Link</CardTitle>
            <CardDescription>Share this link to track referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?affiliate=${affiliateId}&source=custom`}
                className="flex-1 px-4 py-2 border rounded-lg bg-gray-50"
              />
              <button
                onClick={() => {
                  const link = `${window.location.origin}/?affiliate=${affiliateId}&source=custom`;
                  navigator.clipboard.writeText(link);
                  alert('Link copied to clipboard!');
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Copy
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

