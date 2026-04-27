'use client';
import FlightSalesApp from '@/components/FlightSalesApp';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function Page() {
  return (
    <ErrorBoundary>
      <FlightSalesApp />
    </ErrorBoundary>
  );
}
