import './globals.css';
import './ship-polish.css';
import PasswordGate from '@/components/PasswordGate';
import { isSiteGated } from '@/lib/siteGate';

// Evaluated on the server at build/render time. Single source of truth for
// whether the pre-launch password wall is up — see src/lib/siteGate.js.
const GATED = isSiteGated();

export const metadata = {
  title: 'FlightSales.com.au | Australia\'s Aircraft Marketplace',
  description: 'Browse and list aircraft for sale across Australia. FlightSales connects buyers with aviation businesses and private sellers.',
  keywords: 'aircraft for sale, planes for sale australia, aviation marketplace, buy aircraft, sell aircraft, cessna, cirrus, piper, helicopter',
  robots: GATED
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
  openGraph: {
    title: 'FlightSales.com.au | Buy & Sell Aircraft',
    description: 'Australia\'s aircraft marketplace for dealer and private listings.',
    url: 'https://flightsales.com.au',
    siteName: 'FlightSales',
    type: 'website',
  },
};

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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..600&display=swap"
        />
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <>
            <script
              defer
              data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
              src="https://plausible.io/js/script.js"
            />
            <script
              dangerouslySetInnerHTML={{
                __html:
                  'window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}',
              }}
            />
          </>
        )}
      </head>
      <body>
        <PasswordGate enabled={GATED}>
          {children}
        </PasswordGate>
      </body>
    </html>
  );
}
