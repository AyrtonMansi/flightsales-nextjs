import './globals.css';

export const metadata = {
  title: 'FlightSales.au | Australia\'s Aircraft Marketplace',
  description: 'Buy and sell aircraft with confidence. Australia\'s most trusted aviation marketplace with verified dealers, transparent listings, and real market data.',
  keywords: 'aircraft for sale, planes for sale australia, aviation marketplace, buy aircraft, sell aircraft, cessna, cirrus, piper, helicopter',
  openGraph: {
    title: 'FlightSales.au | Buy & Sell Aircraft',
    description: 'Australia\'s most trusted aviation marketplace.',
    url: 'https://flightsales.com.au',
    siteName: 'FlightSales',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
