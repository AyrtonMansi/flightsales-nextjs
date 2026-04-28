import FlightSalesApp from '@/components/FlightSalesApp';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const SITE = 'https://flightsales.com.au';

export const metadata = {
  title: 'Contact | FlightSales',
  description: 'Get in touch with the FlightSales team.',
  alternates: { canonical: `${SITE}/contact` },
  openGraph: {
    title: 'Contact | FlightSales',
    description: 'Get in touch with the FlightSales team.',
    url: `${SITE}/contact`,
    siteName: 'FlightSales',
    type: 'website',
  },
};

export default function Page() {
  return (
    <ErrorBoundary>
      <FlightSalesApp initialPage="contact" />
    </ErrorBoundary>
  );
}
