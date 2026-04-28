'use client';
import FlightSalesApp from './FlightSalesApp';
import { ErrorBoundary } from './ui/ErrorBoundary';

// Thin shell every Next.js route uses to mount the app at a given page state.
// Lives here (not in src/app) so route files can stay one-line server components
// — server components can import + render a client component but cannot embed
// 'use client' inline alongside generateMetadata.
export default function PageShell({
  initialPage = 'home',
  initialListing = null,
  initialListingId = null,
  initialDealer = null,
  initialDealerId = null,
  initialHomeData = null,
}) {
  return (
    <ErrorBoundary>
      <FlightSalesApp
        initialPage={initialPage}
        initialListing={initialListing}
        initialListingId={initialListingId}
        initialDealer={initialDealer}
        initialDealerId={initialDealerId}
        initialHomeData={initialHomeData}
      />
    </ErrorBoundary>
  );
}
