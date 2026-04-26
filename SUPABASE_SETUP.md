# Supabase Setup Guide

Your Supabase project: **gztdahwsfwybpzqcegty**
Dashboard: https://supabase.com/dashboard/project/gztdahwsfwybpzqcegty

## Step 1: Run the Schema

1. Go to: https://supabase.com/dashboard/project/gztdahwsfwybpzqcegty/sql/new
2. Copy the entire contents of `supabase/schema.sql`
3. Paste it into the SQL Editor and click **Run**

This creates all tables, RLS policies, triggers, and seed data.

## Step 2: Create Storage Bucket

1. Go to: https://supabase.com/dashboard/project/gztdahwsfwybpzqcegty/storage/buckets
2. Click **New bucket**
3. Name: `aircraft-images`
4. Check **Public bucket** ✓
5. Click **Create bucket**

Then add a storage policy:
1. Click on `aircraft-images` bucket → **Policies**
2. Click **New policy** → **For full customisation**
3. Policy name: `Authenticated users can upload`
4. Allowed operations: `INSERT`
5. Target roles: `authenticated`
6. Policy definition: `true`
7. Click **Review** → **Save**

## Step 3: Set Environment Variables in Vercel

1. Go to: https://vercel.com/dashboard → your project → **Settings** → **Environment Variables**
2. Add these two variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gztdahwsfwybpzqcegty.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dGRhaHdzZnd5YnB6cWNlZ3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNjA4MDMsImV4cCI6MjA4OTczNjgwM30.ldQPIP69b79kbsPRKQPPQyAkSFI5HKGVAETRUpIsxEc` |

3. Redeploy (Deployments → the latest → **Redeploy**)

## Step 4: Enable Google OAuth (optional)

1. Go to: https://supabase.com/dashboard/project/gztdahwsfwybpzqcegty/auth/providers
2. Find **Google** and toggle it on
3. Add your Google OAuth credentials from https://console.cloud.google.com
4. Set redirect URL to: `https://gztdahwsfwybpzqcegty.supabase.co/auth/v1/callback`

## Step 5: Configure Email (optional)

By default Supabase sends confirmation emails. To use a custom sender:
1. Go to: https://supabase.com/dashboard/project/gztdahwsfwybpzqcegty/auth/email-templates
2. Customise the templates with your branding

## What's Already Set Up

- `.env.local` — credentials for local development ✓
- All tables with RLS policies ✓
- Auto-profile creation on signup ✓
- Auth callback route at `/auth/callback` ✓
- Image upload to `aircraft-images` bucket ✓
- Real-time data on all pages ✓

## Testing Checklist

After running the schema, test these flows:

- [ ] Register new account → check email confirmation
- [ ] Log in → lands on dashboard
- [ ] Browse aircraft → shows real DB listings (+ sample fallback)
- [ ] Click aircraft → detail page with enquiry form
- [ ] Submit enquiry → appears in seller dashboard
- [ ] List aircraft (sell flow) → submitted listing appears in dashboard
- [ ] Save aircraft to watchlist → persists on refresh
- [ ] Admin login (admin@flightsales.com.au) → admin panel
