'use client';

import { useQuery } from '@tanstack/react-query';
import { Wallet, Coins } from 'lucide-react';

async function fetchWalletBalance() {
  const response = await fetch('/api/credits/wallet');
  if (!response.ok) {
    throw new Error('Failed to fetch wallet balance');
  }
  return response.json();
}

export function WalletDisplay() {
  const { data: balance, isLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: fetchWalletBalance,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Coins className="w-4 h-4" />
        <span>Loading...</span>
      </div>
    );
  }

  const totalBalance = balance?.totalBalance || 0;
  const walletBalance = balance?.walletBalance || 0;
  const subscriptionBalance = balance?.subscriptionBalance || 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
        <Wallet className="w-4 h-4" />
        <span>{totalBalance}</span>
        <span className="text-gray-500">credits</span>
      </div>
      {walletBalance > 0 && subscriptionBalance > 0 && (
        <div className="text-xs text-gray-500">
          ({walletBalance} wallet + {subscriptionBalance} plan)
        </div>
      )}
    </div>
  );
}

