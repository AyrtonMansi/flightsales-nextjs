import PageShell from '@/components/PageShell';

const SITE = 'https://flightsales.com.au';

export const metadata = {
  title: 'Admin | FlightSales',
  description: 'Admin console.',
  alternates: { canonical: `${SITE}/admin` },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PageShell initialPage="admin" />;
}
