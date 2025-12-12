'use client';

import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function RecommendationsPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view recommendations</p>
          <Link href="/login" className="btn-firecrawl-orange">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">GEO Recommendations</h1>
          <p className="text-gray-600">
            Personalized recommendations to improve your AI visibility
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Recommendations</CardTitle>
            <CardDescription>
              Based on your brand analyses and competitor data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">Run your first brand analysis to get personalized recommendations</p>
              <Link href="/brand-monitor" className="btn-firecrawl-orange inline-block">
                Start Analysis
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recommendation Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Content Optimization</h3>
                <p className="text-sm text-gray-600">
                  Improve your content structure and keywords for better AI citations
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Competitor Insights</h3>
                <p className="text-sm text-gray-600">
                  Learn from competitors who rank higher in AI recommendations
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Technical SEO</h3>
                <p className="text-sm text-gray-600">
                  Optimize technical aspects for better AI crawling and indexing
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Link Building</h3>
                <p className="text-sm text-gray-600">
                  Build authority through strategic link acquisition
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

