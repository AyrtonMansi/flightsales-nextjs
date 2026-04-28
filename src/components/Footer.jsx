'use client';

const Footer = ({ setPage }) => (
  <footer className="fs-footer">
    <div className="fs-container">
      <div className="fs-footer-grid">
        <div>
          <div className="fs-footer-brand">FlightSales</div>
          <p className="fs-footer-desc">Australia's aircraft marketplace. Buy and sell aircraft with confidence — from single-engine pistons to turboprops and helicopters.</p>
        </div>
        <div>
          <div className="fs-footer-heading">Browse</div>
          {["Single Engine", "Multi Engine", "Turboprop", "Helicopter", "LSA / Ultralight", "All Aircraft"].map(t => (
            <span key={t} className="fs-footer-link" onClick={() => setPage("buy")}>{t}</span>
          ))}
        </div>
        <div>
          <div className="fs-footer-heading">Services</div>
          {[["sell", "Sell Your Aircraft"], ["dealers", "Dealer Portal"]].map(([p, t]) => (
            <span key={t} className="fs-footer-link" onClick={() => setPage(p)}>{t}</span>
          ))}
        </div>
        <div>
          <div className="fs-footer-heading">Company</div>
          {[["about", "About Us"], ["contact", "Contact"], ["news", "News"]].map(([p, t]) => (
            <span key={p} className="fs-footer-link" onClick={() => setPage(p)}>{t}</span>
          ))}
          <span className="fs-footer-link" onClick={() => setPage("terms")}>Terms of Service</span>
          <span className="fs-footer-link" onClick={() => setPage("privacy")}>Privacy Policy</span>
        </div>
      </div>
      <div className="fs-footer-bottom">
        <span>&copy; 2026 Flightsales Pty Ltd. All rights reserved.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
