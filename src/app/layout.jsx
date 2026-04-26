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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
