import { db } from './db';
import { userCredits, creditTransactions, type NewCreditTransaction } from './db/schema';
import { eq, desc } from 'drizzle-orm';
import { Autumn } from 'autumn-js';
import { FEATURE_ID_MESSAGES } from '@/config/constants';

const autumn = new Autumn({
  apiKey: process.env.AUTUMN_SECRET_KEY!,
});

export interface CreditBalance {
  walletBalance: number;
  subscriptionBalance: number;
  totalBalance: number;
}

export interface CreditCheckResult {
  hasEnough: boolean;
  balance: CreditBalance;
  source: 'wallet' | 'subscription' | 'both' | 'none';
}

/**
 * Get combined credit balance (wallet + subscription)
 */
export async function getCreditBalance(userId: string): Promise<CreditBalance> {
  // Get wallet balance
  const wallet = await db.query.userCredits.findFirst({
    where: eq(userCredits.userId, userId),
  });

  const walletBalance = wallet?.balance || 0;

  // Get subscription balance from Autumn
  let subscriptionBalance = 0;
  try {
    const access = await autumn.check({
      customer_id: userId,
      feature_id: FEATURE_ID_MESSAGES,
    });
    subscriptionBalance = access.data?.balance || 0;
  } catch (error) {
    console.error('Failed to get subscription balance:', error);
    // Continue with wallet balance only
  }

  return {
    walletBalance,
    subscriptionBalance,
    totalBalance: walletBalance + subscriptionBalance,
  };
}

/**
 * Check if user has enough credits for an operation
 */
export async function checkCredits(
  userId: string,
  requiredCredits: number
): Promise<CreditCheckResult> {
  const balance = await getCreditBalance(userId);

  const hasEnough = balance.totalBalance >= requiredCredits;

  let source: 'wallet' | 'subscription' | 'both' | 'none' = 'none';
  if (hasEnough) {
    if (balance.walletBalance >= requiredCredits) {
      source = 'wallet';
    } else if (balance.subscriptionBalance >= requiredCredits) {
      source = 'subscription';
    } else {
      source = 'both';
    }
  }

  return {
    hasEnough,
    balance,
    source,
  };
}

/**
 * Deduct credits from wallet first, then subscription
 * Returns the amount deducted from each source
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string,
  metadata?: Record<string, any>
): Promise<{ walletDeducted: number; subscriptionDeducted: number }> {
  let walletDeducted = 0;
  let subscriptionDeducted = 0;
  let remaining = amount;

  // Get or create wallet
  let wallet = await db.query.userCredits.findFirst({
    where: eq(userCredits.userId, userId),
  });

  if (!wallet) {
    // Create wallet if it doesn't exist
    const [newWallet] = await db
      .insert(userCredits)
      .values({
        userId,
        balance: 0,
        purchasedCredits: 0,
        bonusCredits: 0,
      })
      .returning();
    wallet = newWallet;
  }

  // Deduct from wallet first
  if (wallet.balance > 0 && remaining > 0) {
    walletDeducted = Math.min(wallet.balance, remaining);
    remaining -= walletDeducted;

    // Update wallet balance
    await db
      .update(userCredits)
      .set({
        balance: wallet.balance - walletDeducted,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId));

    // Create transaction record
    await db.insert(creditTransactions).values({
      userId,
      type: 'usage',
      amount: -walletDeducted,
      description,
      referenceId,
      metadata,
    });
  }

  // Deduct remaining from subscription if needed
  if (remaining > 0) {
    try {
      subscriptionDeducted = remaining;
      await autumn.track({
        customer_id: userId,
        feature_id: FEATURE_ID_MESSAGES,
        count: remaining,
      });

      // Create transaction record for subscription usage
      await db.insert(creditTransactions).values({
        userId,
        type: 'usage',
        amount: -subscriptionDeducted,
        description: `${description} (subscription)`,
        referenceId,
        metadata: { ...metadata, source: 'subscription' },
      });
    } catch (error) {
      console.error('Failed to deduct from subscription:', error);
      // If subscription deduction fails, we should rollback wallet deduction
      // For now, we'll throw an error
      if (walletDeducted > 0) {
        // Rollback wallet deduction
        await db
          .update(userCredits)
          .set({
            balance: wallet.balance,
            updatedAt: new Date(),
          })
          .where(eq(userCredits.userId, userId));
      }
      throw new Error('Failed to deduct credits');
    }
  }

  return { walletDeducted, subscriptionDeducted };
}

/**
 * Add credits to wallet (purchase or bonus)
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'bonus',
  description: string,
  referenceId?: string,
  metadata?: Record<string, any>,
  expiresAt?: Date
): Promise<void> {
  // Get or create wallet
  let wallet = await db.query.userCredits.findFirst({
    where: eq(userCredits.userId, userId),
  });

  if (!wallet) {
    const [newWallet] = await db
      .insert(userCredits)
      .values({
        userId,
        balance: 0,
        purchasedCredits: 0,
        bonusCredits: 0,
      })
      .returning();
    wallet = newWallet;
  }

  // Update wallet
  const updateData: {
    balance: number;
    purchasedCredits?: number;
    bonusCredits?: number;
    expiresAt?: Date;
    updatedAt: Date;
  } = {
    balance: wallet.balance + amount,
    updatedAt: new Date(),
  };

  if (type === 'purchase') {
    updateData.purchasedCredits = wallet.purchasedCredits + amount;
  } else {
    updateData.bonusCredits = wallet.bonusCredits + amount;
    if (expiresAt) {
      updateData.expiresAt = expiresAt;
    }
  }

  await db
    .update(userCredits)
    .set(updateData)
    .where(eq(userCredits.userId, userId));

  // Create transaction record
  await db.insert(creditTransactions).values({
    userId,
    type: type === 'purchase' ? 'purchase' : 'bonus',
    amount,
    description,
    referenceId,
    metadata,
  });
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  return await db.query.creditTransactions.findMany({
    where: eq(creditTransactions.userId, userId),
    orderBy: [desc(creditTransactions.createdAt)],
    limit,
    offset,
  });
}

/**
 * Refund credits (for failed operations, etc.)
 */
export async function refundCredits(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  // Get wallet
  const wallet = await db.query.userCredits.findFirst({
    where: eq(userCredits.userId, userId),
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  // Add back to wallet
  await db
    .update(userCredits)
    .set({
      balance: wallet.balance + amount,
      updatedAt: new Date(),
    })
    .where(eq(userCredits.userId, userId));

  // Create refund transaction
  await db.insert(creditTransactions).values({
    userId,
    type: 'refund',
    amount,
    description,
    referenceId,
    metadata,
  });
}

