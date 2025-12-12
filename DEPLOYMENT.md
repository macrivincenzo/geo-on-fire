# GEO on Fire - Vercel Deployment Guide

This guide will help you deploy GEO on Fire to Vercel.

## Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- PostgreSQL database (recommended: [Supabase](https://supabase.com) or [Neon](https://neon.tech))
- Stripe account (for credit purchases)
- Autumn account (for subscription billing)
- API keys for AI providers and services

## Step 1: Database Setup

1. Create a PostgreSQL database:
   - **Supabase**: Create a new project → Settings → Database → Copy connection string
   - **Neon**: Create a new project → Copy connection string

2. Use the "Transaction" mode connection string (not "Session" mode)

## Step 2: Vercel Project Setup

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com) and click "New Project"
3. Import your repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or your project root)
   - **Build Command**: `npm run build` (or `pnpm build`)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (or `pnpm install`)

## Step 3: Environment Variables

Add all environment variables in Vercel Dashboard → Settings → Environment Variables:

### Required Variables

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
AUTUMN_SECRET_KEY=your-autumn-key
```

### Optional but Recommended

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...
GOOGLE_GENERATIVE_AI_API_KEY=...
FIRECRAWL_API_KEY=fc-...
NODE_ENV=production
```

## Step 4: Database Migrations

After deployment, run database migrations:

1. **Option 1: Using Vercel CLI**
   ```bash
   vercel env pull .env.local
   npm run db:push
   ```

2. **Option 2: Using Drizzle Studio**
   ```bash
   npm run db:studio
   # Then use the UI to push schema
   ```

3. **Option 3: Manual SQL**
   - Connect to your database
   - Run the SQL from `migrations/001_create_app_schema.sql`
   - Run Better Auth migrations: `npx @better-auth/cli generate --config better-auth.config.ts`

## Step 5: Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel

## Step 6: Autumn Setup

1. Go to Autumn Dashboard → Settings → Developer
2. Create API key → Copy to `AUTUMN_SECRET_KEY`
3. Integrate Stripe in Autumn Dashboard
4. Create products and features in Autumn:
   - Feature: `messages` (Usage type)
   - Products: `free` and `pro` (matching `config/autumn-products.ts`)

## Step 7: Domain Configuration (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` to your domain
4. Configure DNS records as instructed by Vercel

## Step 8: Verify Deployment

1. Visit your Vercel deployment URL
2. Test registration/login
3. Test credit purchase flow
4. Test brand analysis (requires credits)
5. Check Vercel logs for any errors

## Troubleshooting

### Database Connection Issues

- Ensure `DATABASE_URL` uses "Transaction" mode
- Check if database allows connections from Vercel IPs
- Verify SSL is enabled in connection string

### Build Errors

- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version (should be 18+)

### Webhook Issues

- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check Stripe webhook logs
- Ensure webhook endpoint is accessible

### Authentication Issues

- Verify `BETTER_AUTH_SECRET` is set and consistent
- Check `BETTER_AUTH_URL` matches your domain
- Ensure Better Auth tables are created in database

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Stripe webhook configured
- [ ] Autumn products created
- [ ] Test user registration
- [ ] Test credit purchase
- [ ] Test brand analysis
- [ ] Monitor error logs
- [ ] Set up monitoring/alerts

## Support

For issues or questions:
- Check Vercel logs: Dashboard → Deployments → View Function Logs
- Check database connection
- Verify all environment variables are set correctly

