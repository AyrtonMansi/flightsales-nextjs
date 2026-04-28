import FlightSalesApp from '@/components/FlightSalesApp';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const SITE = 'https://flightsales.com.au';

export const metadata = {
  title: 'Sign in | FlightSales',
  description: "Sign in to manage your aircraft listings, saved searches, and enquiries.",
  alternates: { canonical: `${SITE}/login` },
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <ErrorBoundary>
      <FlightSalesApp initialPage="login" />
    </ErrorBoundary>
  );
}
