// Refund + cancellation policy. Public, no auth required. Linked from
// the footer + checkout flow (when Stripe lands). Drafted in plain
// English with the 4 most common buyer questions answered up-front so
// support inbox doesn't drown in "can I get a refund" emails.
//
// Every dollar amount is illustrative — final pricing lives in the
// monetization spec and gets reflected here once Stripe is wired.

import PageShell from '@/components/PageShell';

export const metadata = {
  title: 'Refunds & Cancellations | FlightSales',
  description: 'How refunds and cancellations work for paid listings, dealer subscriptions, and add-ons on FlightSales.',
  alternates: { canonical: 'https://flightsales.com.au/refunds' },
};

export default function Page() {
  return <PageShell initialPage="refunds" />;
}
