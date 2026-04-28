import FlightSalesApp from '@/components/FlightSalesApp';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const SITE = 'https://flightsales.com.au';

export const metadata = {
  title: 'Admin | FlightSales',
  description: "Admin console.",
  alternates: { canonical: `${SITE}/admin` },
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <ErrorBoundary>
      <FlightSalesApp initialPage="admin" />
    </ErrorBoundary>
  );
}
