'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const sessionId = searchParams.get('session_id');
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (sessionId && session) {
      // Confirm payment and add credits
      fetch('/api/credits/purchase', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSuccess(true);
            setProcessing(false);
            // Track purchase conversion for affiliate
            fetch('/api/affiliate/track', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: session.user.id,
                conversionType: 'purchase',
                conversionValue: 0, // Will be updated from Stripe webhook
              }),
            }).catch(console.error);
          } else {
            setProcessing(false);
          }
        })
        .catch((error) => {
          console.error('Payment confirmation error:', error);
          setProcessing(false);
        });
    } else {
      setProcessing(false);
    }
  }, [sessionId, session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in</p>
          <Link href="/login" className="btn-firecrawl-orange">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {processing ? (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-orange-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Processing Your Purchase</h1>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </>
        ) : success ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
            <p className="text-xl text-gray-600 mb-8">
              Your credits have been added to your account. You can start using GEO on Fire right away!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="btn-firecrawl-orange inline-flex items-center justify-center"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/brand-monitor"
                className="btn-firecrawl-default inline-flex items-center justify-center"
              >
                Start Analysis
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Processing</h1>
            <p className="text-gray-600 mb-8">
              We're having trouble confirming your payment. Please check your email or contact support.
            </p>
            <Link href="/dashboard" className="btn-firecrawl-orange">
              Go to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

