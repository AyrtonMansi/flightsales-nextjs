import PageShell from '@/components/PageShell';

const SITE = 'https://flightsales.com.au';

export const metadata = {
  title: 'Verified aircraft dealers | FlightSales',
  description: 'Browse verified aircraft dealerships across Australia.',
  alternates: { canonical: `${SITE}/dealers` },
  openGraph: {
    title: 'Verified aircraft dealers | FlightSales',
    description: 'Browse verified aircraft dealerships across Australia.',
    url: `${SITE}/dealers`,
    siteName: 'FlightSales',
    type: 'website',
  },
};

export default function Page() {
  return <PageShell initialPage="dealers" />;
}
