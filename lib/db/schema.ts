import { pgTable, text, timestamp, uuid, boolean, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['user', 'assistant']);
export const themeEnum = pgEnum('theme', ['light', 'dark']);
export const creditTransactionTypeEnum = pgEnum('credit_transaction_type', ['purchase', 'usage', 'bonus', 'refund', 'expiration']);

// User Profile table - extends Better Auth user with additional fields
export const userProfile = pgTable('user_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Conversations table - stores chat threads
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  title: text('title'),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Messages table - stores individual chat messages
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  role: roleEnum('role').notNull(),
  content: text('content').notNull(),
  tokenCount: integer('token_count'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Message Feedback table - for rating AI responses
export const messageFeedback = pgTable('message_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  rating: integer('rating'), // 1-5
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow(),
});

// User Settings table - app-specific preferences
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  theme: themeEnum('theme').default('light'),
  emailNotifications: boolean('email_notifications').default(true),
  marketingEmails: boolean('marketing_emails').default(false),
  defaultModel: text('default_model').default('gpt-3.5-turbo'),
  metadata: jsonb('metadata'), // For any additional settings
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Define relations without user table reference
export const userProfileRelations = relations(userProfile, ({ many }) => ({
  conversations: many(conversations),
  brandAnalyses: many(brandAnalyses),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  userProfile: one(userProfile, {
    fields: [conversations.userId],
    references: [userProfile.userId],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  feedback: many(messageFeedback),
}));

export const messageFeedbackRelations = relations(messageFeedback, ({ one }) => ({
  message: one(messages, {
    fields: [messageFeedback.messageId],
    references: [messages.id],
  }),
}));

// Brand Monitor Analyses
export const brandAnalyses = pgTable('brand_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  url: text('url').notNull(),
  companyName: text('company_name'),
  industry: text('industry'),
  analysisData: jsonb('analysis_data'), // Stores the full analysis results
  competitors: jsonb('competitors'), // Stores competitor data
  prompts: jsonb('prompts'), // Stores the prompts used
  creditsUsed: integer('credits_used').default(10),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// User Credits Wallet - separate from subscription credits
export const userCredits = pgTable('user_credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  balance: integer('balance').notNull().default(0),
  purchasedCredits: integer('purchased_credits').notNull().default(0),
  bonusCredits: integer('bonus_credits').notNull().default(0),
  expiresAt: timestamp('expires_at'), // Optional expiration for bonus credits
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Credit Transactions - audit trail for all credit operations
export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  type: creditTransactionTypeEnum('type').notNull(),
  amount: integer('amount').notNull(), // Positive for additions, negative for deductions
  description: text('description'),
  referenceId: text('reference_id'), // For linking to purchases, analyses, etc.
  metadata: jsonb('metadata'), // Additional data (Stripe payment ID, analysis ID, etc.)
  createdAt: timestamp('created_at').defaultNow(),
});

// Affiliate Tracking - track affiliate referrals and conversions
export const affiliateTracking = pgTable('affiliate_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id'), // Nullable - can track before user registration
  affiliateId: text('affiliate_id').notNull(),
  source: text('source').notNull(), // warriorplus, jvzoo, clickbank, digistore24, custom
  campaign: text('campaign'),
  landingPage: text('landing_page'),
  referrer: text('referrer'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  converted: boolean('converted').default(false),
  conversionValue: integer('conversion_value'), // In cents
  conversionType: text('conversion_type'), // signup, purchase, subscription
  metadata: jsonb('metadata'), // Additional tracking data
  createdAt: timestamp('created_at').defaultNow(),
  convertedAt: timestamp('converted_at'),
});

// Landing Page Visits - track landing page performance
export const landingPageVisits = pgTable('landing_page_visits', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),
  url: text('url'),
  referrer: text('referrer'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  converted: boolean('converted').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const brandAnalysesRelations = relations(brandAnalyses, ({ one }) => ({
  userProfile: one(userProfile, {
    fields: [brandAnalyses.userId],
    references: [userProfile.userId],
  }),
}));

export const userCreditsRelations = relations(userCredits, ({ one, many }) => ({
  userProfile: one(userProfile, {
    fields: [userCredits.userId],
    references: [userProfile.userId],
  }),
  transactions: many(creditTransactions),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  userCredits: one(userCredits, {
    fields: [creditTransactions.userId],
    references: [userCredits.userId],
  }),
}));

export const affiliateTrackingRelations = relations(affiliateTracking, ({ one }) => ({
  userProfile: one(userProfile, {
    fields: [affiliateTracking.userId],
    references: [userProfile.userId],
  }),
}));

// Type exports for use in application
export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageFeedback = typeof messageFeedback.$inferSelect;
export type NewMessageFeedback = typeof messageFeedback.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type BrandAnalysis = typeof brandAnalyses.$inferSelect;
export type NewBrandAnalysis = typeof brandAnalyses.$inferInsert;
export type UserCredits = typeof userCredits.$inferSelect;
export type NewUserCredits = typeof userCredits.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
export type AffiliateTracking = typeof affiliateTracking.$inferSelect;
export type NewAffiliateTracking = typeof affiliateTracking.$inferInsert;
export type LandingPageVisit = typeof landingPageVisits.$inferSelect;
export type NewLandingPageVisit = typeof landingPageVisits.$inferInsert;