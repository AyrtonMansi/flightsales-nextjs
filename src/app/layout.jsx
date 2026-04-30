import './globals.css';

export const metadata = {
  title: 'Flightsales.com.au | Australia\'s Aircraft Marketplace',
  description: 'Buy and sell aircraft with confidence. Australia\'s most trusted aviation marketplace with verified dealers, transparent listings, and real market data.',
  keywords: 'aircraft for sale, planes for sale australia, aviation marketplace, buy aircraft, sell aircraft, cessna, cirrus, piper, helicopter',
  openGraph: {
    title: 'Flightsales.com.au | Buy & Sell Aircraft',
    description: 'Australia\'s most trusted aviation marketplace.',
    url: 'https://flightsales.com.au',
    siteName: 'Flightsales',
    type: 'website',
  },
};

// Without this, mobile browsers default to rendering at a 980px virtual
// viewport and scale to fit — which is why every responsive @media rule
// in globals.css was silently inert on phones (the page reported itself
// as 980px wide regardless of actual screen size). The Next.js 14 App
// Router preferred pattern is `export const viewport`. Setting both
// width and initialScale ensures the page lays out at the real device
// width and that pinch-zoom resets to 1× on first paint.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
