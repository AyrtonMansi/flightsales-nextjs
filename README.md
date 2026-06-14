# FlightSales

Australia's marketplace for aircraft. Buy and sell light aircraft, helicopters,
turboprops, jets, and LSAs.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required environment variables

| Variable | Where it's used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All Supabase reads/writes (client + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon-role client |

Set these in Vercel project settings for production. See `.env.example`.

## Project structure

```
src/
├── app/                              Next.js App Router routes
│   ├── page.jsx                      /
│   ├── buy/page.jsx                  /buy
│   ├── sell/page.jsx                 /sell
│   ├── listings/[id]/page.jsx        /listings/:id   (server-rendered SEO metadata)
│   ├── dealers/page.jsx              /dealers
│   ├── dealers/[id]/page.jsx         /dealers/:id    (server-rendered SEO metadata)
│   ├── dashboard/page.jsx            /dashboard      (noindex)
│   ├── admin/page.jsx                /admin          (noindex)
│   ├── login/page.jsx                /login          (noindex)
│   ├── news/page.jsx                 /news
│   ├── about/page.jsx                /about
│   ├── contact/page.jsx              /contact
│   ├── privacy/page.jsx              /privacy
│   ├── terms/page.jsx                /terms
│   ├── auth/callback/route.js        OAuth callback handler
│   ├── auth/reset-password/page.jsx  Password reset form
│   ├── api/casa-lookup/route.js      CASA aircraft register lookup
│   ├── globals.css                   All site styles
│   └── sitemap.js                    Dynamic sitemap from Supabase
│
├── components/
│   ├── FlightSalesApp.jsx            App shell: auth, page routing, URL sync, toast
│   ├── PageShell.jsx                 ErrorBoundary + FlightSalesApp wrapper used by all routes
│   ├── Nav.jsx                       Top navigation
│   ├── Footer.jsx                    Footer
│   ├── Icons.jsx                     30+ inline SVG icons
│   ├── AircraftImage.jsx             Card image with gallery + fallback
│   ├── ListingCard.jsx               Aircraft listing card
│   ├── EnquiryModal.jsx              Contact-seller modal
│   ├── QuickLookModal.jsx            Listing quick-look
│   ├── CardSkeleton.jsx              Loading shimmer card
│   ├── MobileFilterSheet.jsx         Mobile filter bottom sheet
│   ├── ui/ErrorBoundary.jsx          Error boundary fallback
│   └── pages/                        One file per page-level component
│       ├── HomePage.jsx
│       ├── BuyPage.jsx
│       ├── ListingDetail.jsx
│       ├── SellPage.jsx
│       ├── DealersPage.jsx
│       ├── DealerDetailPage.jsx
│       ├── DashboardPage.jsx
│       ├── AdminPage.jsx
│       ├── LoginPage.jsx
│       ├── NewsPage.jsx
│       ├── AboutPage.jsx
│       └── ContactPage.jsx
│
└── lib/
    ├── hooks.js                      All Supabase data hooks (useAircraft, useAuth, etc.)
    ├── supabase.js                   Supabase client
    ├── format.js                     Pure formatting helpers (price, hours, time-ago)
    ├── constants.js                  Filter dropdown reference data
    └── useRotatingPlaceholder.js     Rotating AI search placeholder hook

supabase/
└── schema.sql                        Full DB schema + RLS policies
```

## Architecture notes

- **Routing.** Each page in `src/app/` is a real Next.js route. Static pages
  (Home, Buy, Sell, etc.) prerender with their own `<title>` and OG metadata.
  Dynamic routes (`/listings/[id]`, `/dealers/[id]`) fetch from Supabase
  server-side for SEO-eligible HTML.
- **App shell.** `FlightSalesApp.jsx` handles auth, current page state,
  URL push/pop sync, and the top-level toast. It accepts `initialPage`,
  `initialListing[Id]`, and `initialDealer[Id]` props from each route file.
- **Internal navigation.** Clicking a card pushes the URL via
  `window.history.pushState` so the browser's back/forward buttons work.
  A `popstate` listener syncs React page state back from the URL.
- **Auth.** `useAuth` wraps Supabase auth (email/password, Google OAuth,
  password reset, session persistence).
- **Roles.** `profiles.role` column drives admin / dealer / private routing.
  Default is `'private'`. Set a row to `'admin'` in the DB to grant access.

## Deploy

Push to `main`. Vercel deploys automatically.

```bash
npx vercel             # first-time setup
```

Configure both env vars in **Vercel → Project → Settings → Environment Variables**
under the **Production** environment.

## Database

Run `supabase/schema.sql` against a fresh Supabase project to create all tables,
RLS policies, and triggers. For existing deployments, the file uses
`CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
where possible so it can be re-run safely.

## Tech stack

- Next.js 14 (App Router)
- React 18
- Supabase (auth + Postgres + storage + RLS)
- Inter typography
- Hand-rolled CSS in `src/app/globals.css`
