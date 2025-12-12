'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    // Track landing page visit
    fetch('/api/landing/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug,
        url: window.location.href,
        referrer: document.referrer,
      }),
    }).catch((error) => {
      console.error('Failed to track landing page visit:', error);
    });
  }, [slug]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8">
            <span className="block text-zinc-900">GEO on Fire</span>
            <span className="block bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
              Get Recommended by AI
            </span>
          </h1>
          <p className="text-xl lg:text-2xl text-zinc-600 max-w-3xl mx-auto mb-12">
            Optimize your content so ChatGPT, Claude, and Perplexity cite and recommend your brand
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="btn-firecrawl-orange inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
            >
              Start Free Trial
            </Link>
            <Link
              href="/plans"
              className="btn-firecrawl-default inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-base font-medium transition-all duration-200 h-12 px-8"
            >
              View Pricing
            </Link>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold mb-4">Brand Monitoring</h3>
            <p className="text-gray-600">
              See how AI platforms rank your brand against competitors in real-time
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold mb-4">Content Optimization</h3>
            <p className="text-gray-600">
              Get actionable recommendations to improve your AI visibility
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold mb-4">Competitor Tracking</h3>
            <p className="text-gray-600">
              Monitor your competitors and stay ahead in AI recommendations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

