import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';

export async function POST(request: NextRequest) {
  try {
    // Handle email events from Resend
    // This can be used to track email opens, clicks, bounces, etc.
    const event = await request.json();

    console.log('Email webhook event:', event);

    // Process different event types
    switch (event.type) {
      case 'email.sent':
        // Email was sent successfully
        break;
      case 'email.delivered':
        // Email was delivered
        break;
      case 'email.opened':
        // Email was opened
        break;
      case 'email.clicked':
        // Link in email was clicked
        break;
      case 'email.bounced':
        // Email bounced
        break;
      case 'email.complained':
        // User marked as spam
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}

