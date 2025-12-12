import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTransactionHistory } from '@/lib/credits-manager';
import { AuthenticationError, handleApiError } from '@/lib/api-errors';

export async function GET(request: NextRequest) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      throw new AuthenticationError('Please log in to view your transactions');
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const transactions = await getTransactionHistory(
      sessionResponse.user.id,
      limit,
      offset
    );

    return NextResponse.json(transactions);
  } catch (error) {
    return handleApiError(error);
  }
}

