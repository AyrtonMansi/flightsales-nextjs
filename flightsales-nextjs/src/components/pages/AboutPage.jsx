'use client';

const AboutPage = () => (
  <>
    <div className="fs-about-hero" style={{ padding: "72px 0" }}>
      <div className="fs-container">
        <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 40, marginBottom: 12 }}>About Flightsales</h1>
        <p style={{ color: "var(--fs-ink-3)", maxWidth: 600, margin: "0 auto", fontSize: 16, lineHeight: 1.5 }}>
          We're building Australia's most trusted aircraft marketplace. A place where pilots, owners, and dealers can buy and sell with transparency, confidence, and fair pricing.
        </p>
      </div>
    </div>
    <section className="fs-section">
      <div className="fs-container">
        <div className="fs-about-grid">
          {[
            { title: "Transparency First", desc: "Every listing has structured data — hours, specs, maintenance history. No more guessing from vague classifieds." },
            { title: "Verified Dealers", desc: "We vet every dealer on the platform. Look for the verified badge for added confidence." },
            { title: "Market Intelligence", desc: "Our valuation tools and market reports give you the data to make informed decisions." },
            { title: "Built by Pilots", desc: "We're aviators ourselves. We know what matters when you're buying or selling an aircraft." },
          ].map((c, i) => (
            <div key={i} className="fs-about-card">
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default AboutPage;
