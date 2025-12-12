import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { trackAffiliateConversion, getAffiliateCookieFromRequest } from '@/lib/affiliate-tracker';
import { handleApiError, AuthenticationError } from '@/lib/api-errors';

export async function POST(request: NextRequest) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      throw new AuthenticationError('Please log in');
    }

    // Track signup conversion
    const cookieData = getAffiliateCookieFromRequest(request);
    if (cookieData) {
      await trackAffiliateConversion(
        sessionResponse.user.id,
        'signup',
        undefined,
        undefined
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

