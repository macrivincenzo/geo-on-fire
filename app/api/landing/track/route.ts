import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { landingPageVisits } from '@/lib/db/schema';
import { handleApiError, ValidationError } from '@/lib/api-errors';

export async function POST(request: NextRequest) {
  try {
    const { slug, url, referrer } = await request.json();

    if (!slug) {
      throw new ValidationError('Landing page slug is required');
    }

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.ip || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Track landing page visit
    await db.insert(landingPageVisits).values({
      slug,
      url,
      referrer,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

