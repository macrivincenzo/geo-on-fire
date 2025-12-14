import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCreditBalance } from '@/lib/credits-manager';
import { AuthenticationError, handleApiError } from '@/lib/api-errors';

// Force dynamic rendering to prevent build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get the session
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      throw new AuthenticationError('Please log in to view your credits');
    }

    // Get combined balance (wallet + subscription)
    const balance = await getCreditBalance(sessionResponse.user.id);

    return NextResponse.json({
      allowed: balance.totalBalance > 0,
      balance: balance.totalBalance,
      walletBalance: balance.walletBalance,
      subscriptionBalance: balance.subscriptionBalance,
    });
  } catch (error) {
    return handleApiError(error);
  }
}