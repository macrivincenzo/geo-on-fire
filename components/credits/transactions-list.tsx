'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, Gift, ShoppingCart, X } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'purchase' | 'usage' | 'bonus' | 'refund' | 'expiration';
  amount: number;
  description: string | null;
  referenceId: string | null;
  createdAt: string;
}

async function fetchTransactions() {
  const response = await fetch('/api/credits/transactions?limit=50');
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return response.json();
}

function getTransactionIcon(type: Transaction['type']) {
  switch (type) {
    case 'purchase':
      return <ShoppingCart className="w-4 h-4" />;
    case 'bonus':
      return <Gift className="w-4 h-4" />;
    case 'refund':
      return <ArrowUp className="w-4 h-4" />;
    case 'expiration':
      return <X className="w-4 h-4" />;
    default:
      return <ArrowDown className="w-4 h-4" />;
  }
}

function getTransactionColor(type: Transaction['type']) {
  switch (type) {
    case 'purchase':
    case 'bonus':
    case 'refund':
      return 'text-green-600';
    case 'usage':
    case 'expiration':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export function TransactionsList() {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['credit-transactions'],
    queryFn: fetchTransactions,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">Loading transactions...</div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your credit transactions will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">No transactions yet</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>View all your credit purchases and usage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className={`${getTransactionColor(transaction.type)}`}>
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {transaction.description || transaction.type}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(transaction.createdAt), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
              <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                {transaction.amount > 0 ? '+' : ''}
                {transaction.amount} credits
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

