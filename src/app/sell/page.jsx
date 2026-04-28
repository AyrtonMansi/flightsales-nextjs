import FlightSalesApp from '@/components/FlightSalesApp';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const SITE = 'https://flightsales.com.au';

export const metadata = {
  title: 'Sell your aircraft | FlightSales',
  description: 'List your aircraft on Australia\'s aircraft marketplace. Reach verified buyers across the country.',
  alternates: { canonical: `${SITE}/sell` },
  openGraph: {
    title: 'Sell your aircraft | FlightSales',
    description: 'List your aircraft on Australia\'s aircraft marketplace.',
    url: `${SITE}/sell`,
    siteName: 'FlightSales',
    type: 'website',
  },
};

export default function Page() {
  return (
    <ErrorBoundary>
      <FlightSalesApp initialPage="sell" />
    </ErrorBoundary>
  );
}
