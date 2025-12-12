'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ContentAnalysisPage() {
  const { data: session } = useSession();
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to use content analysis</p>
          <Link href="/login" className="btn-firecrawl-orange">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const handleAnalyze = async () => {
    if (!url) return;
    setAnalyzing(true);
    // TODO: Implement content analysis API call
    setTimeout(() => {
      setAnalyzing(false);
      alert('Content analysis feature coming soon!');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Content Analysis</h1>
          <p className="text-gray-600">
            Analyze your content for GEO optimization opportunities
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analyze Content</CardTitle>
            <CardDescription>
              Enter a URL to analyze how well your content is optimized for AI platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={!url || analyzing}
                className="w-full"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Content'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Content analysis will provide:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>AI-friendly content scoring</li>
              <li>Keyword optimization suggestions</li>
              <li>Structure and formatting recommendations</li>
              <li>Competitor content comparison</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

