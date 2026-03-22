# Flightsales Production Setup Guide

## 1. Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Choose organization, name it `flightsales-prod`
4. Select region: `Sydney (Australia)` 
5. Choose password for database
6. Wait for project to be created (~2 minutes)

## 2. Get API Keys

Once project is ready:

1. Go to Project Settings → API
2. Copy:
   - `Project URL` (e.g., `https://xxxxxxxxxxxx.supabase.co`)
   - `anon public` key

## 3. Configure Environment Variables

Create `.env.local` file in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Never commit this file to Git!** It's already in `.gitignore`.

## 4. Set Up Database Schema

1. In Supabase Dashboard, go to SQL Editor
2. Click "New Query"
3. Copy entire contents of `supabase/schema.sql`
4. Paste and click "Run"

This creates:
- All tables (aircraft, dealers, enquiries, profiles, etc.)
- Row Level Security policies
- Indexes for performance
- Sample seed data

## 5. Enable Auth

1. Go to Authentication → Providers
2. Enable Email provider (default)
3. (Optional) Enable Google OAuth:
   - Go to https://console.cloud.google.com
   - Create OAuth 2.0 credentials
   - Add redirect URL: `https://your-domain.com/auth/callback`
   - Copy Client ID and Secret to Supabase

## 6. Set Up Storage (Images)

1. Go to Storage → New Bucket
2. Create bucket named `aircraft-images`
3. Set to Public
4. Add these policies:

**Upload policy:**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'aircraft-images');
```

**Read policy:**
```sql
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'aircraft-images');
```

## 7. Deploy to Vercel with Environment Variables

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Redeploy

## 8. Test the Integration

1. Visit deployed site
2. Check that aircraft listings load from Supabase
3. Test creating an account
4. Test submitting an enquiry
5. Test saving an aircraft to watchlist

## 9. Post-Launch Tasks

### Set up Email (Resend/Postmark)

For working enquiry notifications:

1. Create account at https://resend.com
2. Add domain and verify
3. Get API key
4. Add to Supabase Edge Function or Vercel API route

### Set up Stripe (for listing fees)

1. Create Stripe account
2. Get Publishable and Secret keys
3. Create product for listing fees
4. Add payment flow to sell form

### Domain Setup

1. Purchase domain: `flightsales.com.au`
2. In Vercel: Settings → Domains → Add
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_SITE_URL` env var

## Database Schema Overview

### Tables

| Table | Purpose |
|-------|---------|
| `aircraft` | All aircraft listings |
| `dealers` | Verified dealer profiles |
| `enquiries` | Buyer enquiries sent to sellers |
| `profiles` | Extended user profiles |
| `saved_aircraft` | User watchlist/favorites |
| `news_articles` | Blog/news content |

### Row Level Security (RLS)

All tables have RLS enabled:
- Aircraft: Public read, authenticated write own
- Dealers: Public read only
- Enquiries: Public create, owner read
- Profiles: Own data only
- Saved aircraft: Own data only

## Common Issues

### "Cannot read property of undefined" (Supabase)
- Check env vars are loaded
- Verify Supabase URL is correct
- Check browser console for CORS errors

### Images not loading
- Verify Storage bucket is public
- Check bucket policies are created
- Test upload in Supabase dashboard

### Auth not persisting
- Check `NEXT_PUBLIC_` prefix on env vars
- Verify no ad-blockers interfering
- Check browser localStorage permissions

## Support

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs
