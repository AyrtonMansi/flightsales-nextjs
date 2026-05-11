import PageShell from '@/components/PageShell';

const SITE = 'https://flightsales.com.au';

export const metadata = {
  title: 'Pricing | FlightSales',
  description: 'Recreational aircraft list free. Certified aircraft pay a flat $99 (or $99 + 0.025% above $500k). Dealer Lite from $49/mo.',
  alternates: { canonical: `${SITE}/pricing` },
  openGraph: {
    title: 'Pricing | FlightSales',
    description: 'Flat-rate listing fees + dealer plans from $49/mo.',
    url: `${SITE}/pricing`,
    siteName: 'FlightSales',
    type: 'website',
  },
};

export default function Page() {
  return <PageShell initialPage="pricing" />;
}
