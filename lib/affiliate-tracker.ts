import { db } from './db';
import { affiliateTracking, type NewAffiliateTracking } from './db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface AffiliateParams {
  affiliate?: string;
  source?: string;
  campaign?: string;
}

const AFFILIATE_COOKIE_NAME = 'geo_affiliate';
const AFFILIATE_COOKIE_EXPIRY_DAYS = 30;

/**
 * Parse affiliate parameters from URL
 */
export function parseAffiliateParams(searchParams: URLSearchParams): AffiliateParams | null {
  const affiliate = searchParams.get('affiliate');
  const source = searchParams.get('source');
  const campaign = searchParams.get('campaign');

  if (!affiliate) {
    return null;
  }

  return {
    affiliate,
    source: source || 'custom',
    campaign: campaign || undefined,
  };
}

/**
 * Store affiliate tracking in cookie
 */
export function setAffiliateCookie(params: AffiliateParams): string {
  const cookieValue = JSON.stringify({
    affiliate: params.affiliate,
    source: params.source || 'custom',
    campaign: params.campaign,
    timestamp: new Date().toISOString(),
  });

  return `${AFFILIATE_COOKIE_NAME}=${encodeURIComponent(cookieValue)}; Path=/; Max-Age=${AFFILIATE_COOKIE_EXPIRY_DAYS * 24 * 60 * 60}; SameSite=Lax; Secure`;
}

/**
 * Get affiliate data from cookie (for server-side use)
 */
export function getAffiliateCookieFromRequest(request: Request): AffiliateParams | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const cookieValue = cookies[AFFILIATE_COOKIE_NAME];
  if (!cookieValue) {
    return null;
  }

  try {
    const data = JSON.parse(decodeURIComponent(cookieValue));
    return {
      affiliate: data.affiliate,
      source: data.source,
      campaign: data.campaign,
    };
  } catch (error) {
    console.error('Failed to parse affiliate cookie:', error);
    return null;
  }
}

/**
 * Track affiliate visit (before user registration)
 */
export async function trackAffiliateVisit(
  params: AffiliateParams,
  requestInfo: {
    url: string;
    referrer?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<string> {
  const [tracking] = await db
    .insert(affiliateTracking)
    .values({
      affiliateId: params.affiliate!,
      source: params.source || 'custom',
      campaign: params.campaign,
      landingPage: requestInfo.url,
      referrer: requestInfo.referrer,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      converted: false,
    })
    .returning();

  return tracking.id;
}

/**
 * Track affiliate conversion (on signup, purchase, etc.)
 */
export async function trackAffiliateConversion(
  userId: string,
  conversionType: 'signup' | 'purchase' | 'subscription',
  conversionValue?: number,
  trackingId?: string
): Promise<void> {
  // If tracking ID provided, update that record
  if (trackingId) {
    await db
      .update(affiliateTracking)
      .set({
        userId,
        converted: true,
        conversionType,
        conversionValue,
        convertedAt: new Date(),
      })
      .where(eq(affiliateTracking.id, trackingId));
    return;
  }

  // Otherwise, find the most recent unclaimed tracking for this user
  const recentTracking = await db.query.affiliateTracking.findFirst({
    where: and(
      eq(affiliateTracking.userId, userId),
      eq(affiliateTracking.converted, false)
    ),
    orderBy: [desc(affiliateTracking.createdAt)],
  });

  if (recentTracking) {
    await db
      .update(affiliateTracking)
      .set({
        converted: true,
        conversionType,
        conversionValue,
        convertedAt: new Date(),
      })
      .where(eq(affiliateTracking.id, recentTracking.id));
  }
}

/**
 * Get affiliate stats for a user
 */
export async function getAffiliateStats(affiliateId: string) {
  const allTracking = await db.query.affiliateTracking.findMany({
    where: eq(affiliateTracking.affiliateId, affiliateId),
  });

  const totalVisits = allTracking.length;
  const conversions = allTracking.filter((t) => t.converted);
  const conversionRate = totalVisits > 0 ? (conversions.length / totalVisits) * 100 : 0;
  const totalRevenue = conversions.reduce((sum, c) => sum + (c.conversionValue || 0), 0);

  return {
    totalVisits,
    totalConversions: conversions.length,
    conversionRate: Math.round(conversionRate * 100) / 100,
    totalRevenue,
    revenueFormatted: `$${(totalRevenue / 100).toFixed(2)}`,
  };
}

/**
 * Get user's affiliate tracking history
 */
export async function getUserAffiliateTracking(userId: string) {
  return await db.query.affiliateTracking.findMany({
    where: eq(affiliateTracking.userId, userId),
    orderBy: [desc(affiliateTracking.createdAt)],
  });
}

