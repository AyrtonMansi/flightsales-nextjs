import PageShell from '@/components/PageShell';

const SITE = 'https://flightsales.com.au';

export const metadata = {
  title: 'About | FlightSales',
  description: "Australia's marketplace for buying and selling aircraft.",
  alternates: { canonical: `${SITE}/about` },
  openGraph: {
    title: 'About | FlightSales',
    description: "Australia's marketplace for buying and selling aircraft.",
    url: `${SITE}/about`,
    siteName: 'FlightSales',
    type: 'website',
  },
};

export default function Page() {
  return <PageShell initialPage="about" />;
}
