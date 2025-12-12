import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCreditBalance } from '@/lib/credits-manager';
import { AuthenticationError, handleApiError } from '@/lib/api-errors';

export async function GET(request: NextRequest) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      throw new AuthenticationError('Please log in to view your credits');
    }

    const balance = await getCreditBalance(sessionResponse.user.id);

    return NextResponse.json(balance);
  } catch (error) {
    return handleApiError(error);
  }
}

