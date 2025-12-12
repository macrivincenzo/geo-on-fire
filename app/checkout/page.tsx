'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PurchaseDialog } from '@/components/credits/purchase-dialog';
import { CREDIT_PACKAGES } from '@/config/credit-packages';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const cancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    if (cancelled) {
      // Show cancellation message
      setTimeout(() => {
        router.replace('/checkout');
      }, 3000);
    }
  }, [cancelled, router]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to purchase credits</p>
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
        {cancelled && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">Checkout was cancelled. Please try again.</p>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Purchase Credits</h1>
          <p className="text-xl text-gray-600">
            Choose a credit package to continue using GEO on Fire
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white p-6 rounded-xl border-2 ${
                pkg.popular ? 'border-orange-500' : 'border-gray-200'
              } hover:shadow-lg transition-shadow`}
            >
              {pkg.popular && (
                <div className="text-center mb-4">
                  <span className="px-3 py-1 bg-orange-500 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{pkg.priceDisplay}</span>
              </div>
              <p className="text-gray-600 mb-4">{pkg.description}</p>
              <ul className="space-y-2 mb-6 text-sm">
                <li>✓ {pkg.credits} credits</li>
                {pkg.bonusCredits && <li>✓ {pkg.bonusCredits} bonus credits</li>}
                <li>✓ No expiration</li>
                <li>✓ Use for all features</li>
              </ul>
              <button
                onClick={() => {
                  setSelectedPackage(pkg.id);
                  setPurchaseDialogOpen(true);
                }}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  pkg.popular
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Purchase
              </button>
            </div>
          ))}
        </div>

        <PurchaseDialog
          open={purchaseDialogOpen}
          onOpenChange={setPurchaseDialogOpen}
        />
      </div>
    </div>
  );
}

