import FlightSalesApp from '@/components/FlightSalesApp';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const SITE = 'https://flightsales.com.au';

export const metadata = {
  title: 'Aircraft for sale | FlightSales',
  description: "Browse Australia's aircraft marketplace. Filter by category, manufacturer, state, price and hours.",
  alternates: { canonical: `${SITE}/buy` },
  openGraph: {
    title: 'Aircraft for sale | FlightSales',
    description: "Browse Australia's aircraft marketplace.",
    url: `${SITE}/buy`,
    siteName: 'FlightSales',
    type: 'website',
  },
};

export default function Page() {
  return (
    <ErrorBoundary>
      <FlightSalesApp initialPage="buy" />
    </ErrorBoundary>
  );
}
