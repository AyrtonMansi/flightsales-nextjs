import PageShell from '@/components/PageShell';

const SITE = 'https://flightsales.com.au';

export const metadata = {
  title: 'Dashboard | FlightSales',
  description: 'Manage your listings, enquiries, and saved aircraft.',
  alternates: { canonical: `${SITE}/dashboard` },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PageShell initialPage="dashboard" />;
}
