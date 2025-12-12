import { NextRequest, NextResponse } from 'next/server';
import { trackAffiliateConversion } from '@/lib/affiliate-tracker';
import { handleApiError, ValidationError } from '@/lib/api-errors';

// Force dynamic rendering to prevent build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { userId, conversionType, conversionValue, trackingId } = await request.json();

    if (!userId || !conversionType) {
      throw new ValidationError('User ID and conversion type are required', {
        userId: userId ? undefined : 'User ID is required',
        conversionType: conversionType ? undefined : 'Conversion type is required',
      });
    }

    await trackAffiliateConversion(
      userId,
      conversionType,
      conversionValue,
      trackingId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

