import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAffiliateStats, getUserAffiliateTracking } from '@/lib/affiliate-tracker';
import { handleApiError, AuthenticationError } from '@/lib/api-errors';

export async function GET(request: NextRequest) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      throw new AuthenticationError('Please log in to view affiliate stats');
    }

    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('affiliateId');

    if (affiliateId) {
      // Get stats for specific affiliate
      const stats = await getAffiliateStats(affiliateId);
      return NextResponse.json(stats);
    } else {
      // Get user's affiliate tracking history
      const tracking = await getUserAffiliateTracking(sessionResponse.user.id);
      return NextResponse.json({ tracking });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

