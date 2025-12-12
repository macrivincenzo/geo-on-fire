'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CREDIT_PACKAGES } from '@/config/credit-packages';
import { Check, Loader2 } from 'lucide-react';

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseDialog({ open, onOpenChange }: PurchaseDialogProps) {
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
  const router = useRouter();

  const handlePurchase = async (packageId: string) => {
    try {
      setLoadingPackageId(packageId);
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoadingPackageId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase Credits</DialogTitle>
          <DialogDescription>
            Choose a credit package to continue using GEO on Fire
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative ${pkg.popular ? 'border-orange-500 border-2' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-3xl font-bold">{pkg.priceDisplay}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {pkg.credits} credits
                    {pkg.bonusCredits && (
                      <span className="text-green-600 ml-1">
                        + {pkg.bonusCredits} bonus
                      </span>
                    )}
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{pkg.credits + (pkg.bonusCredits || 0)} total credits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>No expiration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Use for all features</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loadingPackageId !== null}
                  variant={pkg.popular ? 'default' : 'outline'}
                >
                  {loadingPackageId === pkg.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Purchase'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

