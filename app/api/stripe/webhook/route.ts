import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { addCredits } from '@/lib/credits-manager';
import { trackAffiliateConversion } from '@/lib/affiliate-tracker';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === 'paid') {
      const userId = session.metadata?.userId;
      const packageId = session.metadata?.packageId;
      const credits = parseInt(session.metadata?.credits || '0');
      const bonusCredits = parseInt(session.metadata?.bonusCredits || '0');

      if (userId && credits > 0) {
        try {
          // Add purchased credits
          await addCredits(
            userId,
            credits,
            'purchase',
            `Purchased ${credits} credits via ${packageId} package`,
            session.id,
            {
              packageId,
              stripeSessionId: session.id,
              amount: session.amount_total,
            }
          );

          // Add bonus credits if any
          if (bonusCredits > 0) {
            await addCredits(
              userId,
              bonusCredits,
              'bonus',
              `Bonus credits from ${packageId} package`,
              session.id,
              {
                packageId,
                source: 'purchase_bonus',
              }
            );
          }

          // Track affiliate conversion
          if (userId) {
            await trackAffiliateConversion(
              userId,
              'purchase',
              session.amount_total || undefined,
              undefined
            );
          }
        } catch (error) {
          console.error('Failed to process credit purchase:', error);
          // Don't fail the webhook, log the error
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

