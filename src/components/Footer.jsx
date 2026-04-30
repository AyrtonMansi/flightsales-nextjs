'use client';
import Link from 'next/link';

// Real <Link> anchors so footer links work for right-click "open in new tab",
// crawlers, and screen readers. The <span onClick> pattern looked like links
// but failed all three. Category-specific browse pages can wire to query
// params later (e.g. /buy?category=Single+Engine+Piston) when BuyPage reads them.
const Footer = () => (
  <footer className="fs-footer">
    <div className="fs-container">
      <div className="fs-footer-grid">
        <div>
          <div className="fs-footer-brand">FlightSales</div>
          <p className="fs-footer-desc">Australia's aircraft marketplace. Buy and sell aircraft with confidence — from single-engine pistons to turboprops and helicopters.</p>
        </div>
        <div>
          <div className="fs-footer-heading">Browse</div>
          {[
            ["Single Engine", "Single Engine Piston"],
            ["Multi Engine", "Multi Engine Piston"],
            ["Turboprop", "Turboprop"],
            ["Helicopter", "Helicopter"],
            ["LSA / Ultralight", "LSA"],
            ["All Aircraft", null],
          ].map(([label, cat]) => (
            <Link
              key={label}
              href={cat ? `/buy?category=${encodeURIComponent(cat)}` : "/buy"}
              className="fs-footer-link"
            >
              {label}
            </Link>
          ))}
        </div>
        <div>
          <div className="fs-footer-heading">Services</div>
          <Link href="/sell" className="fs-footer-link">Sell Your Aircraft</Link>
          <Link href="/dealers" className="fs-footer-link">Dealer Portal</Link>
        </div>
        <div>
          <div className="fs-footer-heading">Company</div>
          <Link href="/about" className="fs-footer-link">About Us</Link>
          <Link href="/contact" className="fs-footer-link">Contact</Link>
          <Link href="/news" className="fs-footer-link">News</Link>
          <Link href="/terms" className="fs-footer-link">Terms of Service</Link>
          <Link href="/privacy" className="fs-footer-link">Privacy Policy</Link>
        </div>
      </div>
      <div className="fs-footer-bottom">
        <span>
          &copy; 2026 Flightsales Pty Ltd. All rights reserved.
          {process.env.NEXT_PUBLIC_FS_ABN ? (
            <> · ABN {process.env.NEXT_PUBLIC_FS_ABN}</>
          ) : null}
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
