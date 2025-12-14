import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Force dynamic rendering to prevent build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return NextResponse.json({
      session: session || null,
      cookies: request.headers.get('cookie'),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      session: null,
    });
  }
}