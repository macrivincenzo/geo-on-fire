import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addCredits, checkCredits } from '@/lib/credits-manager';
import { getCreditPackage } from '@/config/credit-packages';
import { AuthenticationError, ValidationError, handleApiError } from '@/lib/api-errors';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      throw new AuthenticationError('Please log in to purchase credits');
    }

    const { packageId } = await request.json();

    if (!packageId) {
      throw new ValidationError('Package ID is required', {
        packageId: 'Package ID is required',
      });
    }

    const creditPackage = getCreditPackage(packageId);
    if (!creditPackage) {
      throw new ValidationError('Invalid package ID', {
        packageId: 'Package not found',
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${creditPackage.name} Credit Package`,
              description: `${creditPackage.credits} credits${creditPackage.bonusCredits ? ` + ${creditPackage.bonusCredits} bonus` : ''}`,
            },
            unit_amount: creditPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?cancelled=true`,
      client_reference_id: sessionResponse.user.id,
      metadata: {
        userId: sessionResponse.user.id,
        packageId: creditPackage.id,
        credits: creditPackage.credits.toString(),
        bonusCredits: (creditPackage.bonusCredits || 0).toString(),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Webhook handler for Stripe payment confirmation
export async function PUT(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new ValidationError('Payment not completed');
    }

    const userId = session.metadata?.userId;
    const packageId = session.metadata?.packageId;
    const credits = parseInt(session.metadata?.credits || '0');
    const bonusCredits = parseInt(session.metadata?.bonusCredits || '0');

    if (!userId || !packageId || !credits) {
      throw new ValidationError('Invalid session metadata');
    }

    // Add purchased credits
    await addCredits(
      userId,
      credits,
      'purchase',
      `Purchased ${credits} credits via ${packageId} package`,
      sessionId,
      {
        packageId,
        stripeSessionId: sessionId,
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
        sessionId,
        {
          packageId,
          source: 'purchase_bonus',
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

