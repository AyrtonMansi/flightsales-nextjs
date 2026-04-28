import FlightSalesApp from '@/components/FlightSalesApp';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const SITE = 'https://flightsales.com.au';

export const metadata = {
  title: 'Aviation news | FlightSales',
  description: 'Latest news from the Australian aviation marketplace.',
  alternates: { canonical: `${SITE}/news` },
  openGraph: {
    title: 'Aviation news | FlightSales',
    description: 'Latest news from the Australian aviation marketplace.',
    url: `${SITE}/news`,
    siteName: 'FlightSales',
    type: 'website',
  },
};

export default function Page() {
  return (
    <ErrorBoundary>
      <FlightSalesApp initialPage="news" />
    </ErrorBoundary>
  );
}
