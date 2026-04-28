import FlightSalesApp from '@/components/FlightSalesApp';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const SITE = 'https://flightsales.com.au';

export const metadata = {
  title: 'Dashboard | FlightSales',
  description: "Manage your listings, enquiries, and saved aircraft.",
  alternates: { canonical: `${SITE}/dashboard` },
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <ErrorBoundary>
      <FlightSalesApp initialPage="dashboard" />
    </ErrorBoundary>
  );
}
