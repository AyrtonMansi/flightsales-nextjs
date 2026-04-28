'use client';
import { useState, useRef } from 'react';
import { Icons } from '../Icons';
import { createListing, uploadImage } from '../../lib/hooks';
import { MANUFACTURERS, CATEGORIES, STATES, CONDITIONS } from '../../lib/constants';

const SellPage = ({ user, setPage }) => {
  // Require login to sell
  if (!user) {
    return (
      <>
        <div className="fs-about-hero">
          <div className="fs-container">
            <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Sell Your Aircraft</h1>
            <p style={{ color: "var(--fs-ink-3)", marginTop: 8, fontSize: 16 }}>Reach thousands of qualified buyers across Australia</p>
          </div>
        </div>
        <section className="fs-section">
          <div className="fs-container" style={{ maxWidth: 480, margin: "0 auto" }}>
            <div className="fs-detail-specs" style={{ textAlign: 'center', padding: '48px 32px' }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: 'var(--fs-bg-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 36
              }}>
                {Icons.user}
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Sign in to List Your Aircraft</h3>
              <p style={{ fontSize: 14, color: 'var(--fs-gray-500)', marginBottom: 24 }}>
                Create an account or sign in to list your aircraft for sale. 
                It's free to create a basic listing.
              </p>
              <button 
                className="fs-form-submit"
                onClick={() => setPage('login')}
                style={{ maxWidth: 280, margin: '0 auto 12px' }}
              >
                Sign In / Create Account
              </button>
              <button 
                className="fs-detail-cta fs-detail-cta-secondary"
                onClick={() => setPage('buy')}
                style={{ maxWidth: 280, margin: '0 auto' }}
              >
                Browse Aircraft Instead
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  // Stripe not yet wired — every new listing is Basic until payment is integrated.
  const selectedPlan = 'Basic';
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    manufacturer: '',
    model: '',
    year: '',
    category: '',
    rego: '',
    condition: 'Pre-Owned',
    price: '',
    state: '',
    city: '',
    ttaf: '',
    eng_hours: '',
    eng_tbo: '',
    engineType: '',
    propeller: '',
    avionics: '',
    description: ''
  });
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  const lookupCASA = async () => {
    const rego = formData.rego.toUpperCase().trim();
    
    // Validate format
    if (!rego.match(/^VH-[A-Z]{3}$/)) {
      setLookupError('Invalid format. Use VH-ABC (3 letters after VH-)');
      return;
    }
    
    setIsLookingUp(true);
    setLookupError(null);
    setAutoFilled(false);
    
    try {
      const response = await fetch(`/api/casa-lookup?rego=${rego}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lookup failed');
      }
      
      // Map CASA data to form fields - comprehensive mapping
      const updates = { rego };
      if (data.manufacturer) updates.manufacturer = data.manufacturer;
      if (data.model) updates.model = data.model;
      if (data.year) updates.year = data.year.toString();
      if (data.category) updates.category = data.category;
      if (data.engineType) updates.engineType = data.engineType;
      if (data.mtow_kg) updates.mtow = data.mtow_kg.toString();
      if (data.seats) updates.seats = data.seats.toString();
      if (data.serialNumber) updates.serialNumber = data.serialNumber;
      if (data.propeller) updates.propeller = data.propeller;
      if (data.registration) updates.rego = data.registration;
      
      setFormData(prev => ({ ...prev, ...updates }));
      setAutoFilled(true);
      setShowManualForm(true);
      
      // Show toast
      setToast?.('Aircraft details found and auto-filled!');
      
    } catch (error) {
      setLookupError(error.message || 'Aircraft not found in CASA register');
      // Still show form so they can enter manually
      setShowManualForm(true);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'rego') {
      setLookupError(null);
      setAutoFilled(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && formData.rego.length >= 6) {
      lookupCASA();
    }
  };

  const validateStep1 = () => {
    const errors = [];
    if (!formData.manufacturer) errors.push('Manufacturer is required');
    if (!formData.model) errors.push('Model is required');
    if (!formData.year) errors.push('Year is required');
    if (!formData.category) errors.push('Category is required');
    if (!formData.rego) errors.push('Registration is required');
    if (!formData.condition) errors.push('Condition is required');
    if (!formData.price) errors.push('Price is required');
    if (!formData.state) errors.push('Location is required');
    return errors;
  };

  const validateStep2 = () => {
    const errors = [];
    if (!formData.ttaf) errors.push('Total Time Airframe is required');
    if (!formData.eng_hours) errors.push('Engine Hours is required');
    return errors;
  };

  const [errors, setErrors] = useState([]);

  const handleContinue = (nextStep, validateFn) => {
    const validationErrors = validateFn();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo(0, 0);
    } else {
      setErrors([]);
      setStep(nextStep);
      window.scrollTo(0, 0);
    }
  };

  return (
    <>
      <div className="fs-about-hero">
        <div className="fs-container">
          <h1 style={{ fontFamily: "var(--fs-font)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Sell Your Aircraft</h1>
          <p style={{ color: "var(--fs-ink-3)", marginTop: 8, fontSize: 16 }}>Reach thousands of qualified buyers across Australia</p>
        </div>
      </div>
      <section className="fs-section">
        <div className="fs-container" style={{ maxWidth: 700, margin: "0 auto" }}>
          {/* Progress */}
          <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
            {[1,2,3].map(s => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? "var(--fs-ink)" : "var(--fs-gray-200)", transition: "background 0.3s" }} />
            ))}
          </div>
          
          {step === 1 && (
            <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-md)" }}>
              <h3 style={{ fontSize: 18, marginBottom: 24 }}>Step 1: Aircraft Details</h3>
              
              {errors.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--fs-radius-sm)', padding: '12px 16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>Please fix the following:</p>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#dc2626' }}>
                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
              
              {/* CASA Rego Lookup - SLIMLINE */}
              <div style={{ marginBottom: 24 }}>
                <label className="fs-form-label">Aircraft Registration</label>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input 
                    className="fs-form-input" 
                    placeholder="VH-ABC"
                    value={formData.rego}
                    onChange={e => handleInputChange('rego', e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    style={{ 
                      textTransform: 'uppercase', 
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      flex: 1
                    }}
                    maxLength={6}
                  />
                  <button 
                    type="button"
                    onClick={lookupCASA}
                    disabled={isLookingUp || formData.rego.length < 6}
                    className="fs-nav-btn-primary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {isLookingUp ? '...' : 'Lookup'}
                  </button>
                </div>
                
                {lookupError && (
                  <p style={{ fontSize: 12, color: 'var(--fs-red)', marginTop: 8 }}>
                    {lookupError} — <button onClick={() => setShowManualForm(true)} style={{ textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>enter manually</button>
                  </p>
                )}
                
                {autoFilled && (
                  <p style={{ fontSize: 12, color: 'var(--fs-green)', marginTop: 8 }}>
                    {Icons.check} Found in CASA — details loaded below
                  </p>
                )}
                
                {!showManualForm && !lookupError && !autoFilled && (
                  <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginTop: 8 }}>
                    Or <button onClick={() => setShowManualForm(true)} style={{ textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>skip and enter manually</button>
                  </p>
                )}
              </div>
              
              {/* Aircraft Details Form - Shows after lookup or manual entry */}
              {showManualForm && (
                <>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    marginBottom: 20,
                    paddingBottom: 16,
                    borderBottom: '1px solid var(--fs-gray-200)'
                  }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Aircraft Details</h4>
                    {autoFilled && (
                      <span style={{ 
                        fontSize: 11, 
                        color: '#16a34a', 
                        background: '#dcfce7',
                        padding: '2px 8px',
                        borderRadius: 4
                      }}>
                        Auto-filled from CASA
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="fs-form-group">
                      <label className="fs-form-label">Manufacturer *</label>
                  <select 
                    className="fs-form-select"
                    value={formData.manufacturer}
                    onChange={e => handleInputChange('manufacturer', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Model *</label>
                  <input 
                    className="fs-form-input" 
                    placeholder="e.g. SR22T, C182T"
                    value={formData.model}
                    onChange={e => handleInputChange('model', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Year *</label>
                  <input 
                    className="fs-form-input" 
                    type="number" 
                    placeholder="2020"
                    value={formData.year}
                    onChange={e => handleInputChange('year', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Category *</label>
                  <select 
                    className="fs-form-select"
                    value={formData.category}
                    onChange={e => handleInputChange('category', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Registration *</label>
                  <input 
                    className="fs-form-input" 
                    placeholder="VH-XXX"
                    value={formData.rego}
                    onChange={e => handleInputChange('rego', e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Condition *</label>
                  <select 
                    className="fs-form-select"
                    value={formData.condition}
                    onChange={e => handleInputChange('condition', e.target.value)}
                  >
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Asking Price (AUD) *</label>
                  <input 
                    className="fs-form-input" 
                    type="number" 
                    placeholder="350000"
                    value={formData.price}
                    onChange={e => handleInputChange('price', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Location (State) *</label>
                  <select 
                    className="fs-form-select"
                    value={formData.state}
                    onChange={e => handleInputChange('state', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              </>
            )}
              <button className="fs-form-submit" onClick={() => handleContinue(2, validateStep1)} style={{ marginTop: 16 }}>Continue to Specs</button>
            </div>
          )}
          
          {step === 2 && (
            <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-md)" }}>
              <h3 style={{ fontSize: 18 }}>Step 2: Specifications & Hours</h3>
              
              {errors.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--fs-radius-sm)', padding: '12px 16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>Please fix the following:</p>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#dc2626' }}>
                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="fs-form-group">
                  <label className="fs-form-label">Total Time Airframe *</label>
                  <input 
                    className="fs-form-input" 
                    type="number" 
                    placeholder="Hours"
                    value={formData.ttaf}
                    onChange={e => handleInputChange('ttaf', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Engine Hours (SMOH) *</label>
                  <input 
                    className="fs-form-input" 
                    type="number" 
                    placeholder="Hours"
                    value={formData.eng_hours}
                    onChange={e => handleInputChange('eng_hours', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Engine Type</label>
                  <input 
                    className="fs-form-input" 
                    placeholder="e.g. Lycoming IO-540"
                    value={formData.engineType}
                    onChange={e => handleInputChange('engineType', e.target.value)}
                  />
                </div>
                <div className="fs-form-group">
                  <label className="fs-form-label">Propeller</label>
                  <input 
                    className="fs-form-input" 
                    placeholder="e.g. Hartzell 3-blade"
                    value={formData.propeller}
                    onChange={e => handleInputChange('propeller', e.target.value)}
                  />
                </div>
                <div className="fs-form-group" style={{ gridColumn: "span 2" }}>
                  <label className="fs-form-label">Avionics</label>
                  <input
                    className="fs-form-input"
                    placeholder="e.g. Garmin G1000 NXi, GFC700 autopilot"
                    value={formData.avionics || ''}
                    onChange={e => handleInputChange('avionics', e.target.value)}
                  />
                </div>
                <div className="fs-form-group" style={{ gridColumn: "span 2" }}>
                  <label className="fs-form-label">Description *</label>
                  <textarea
                    className="fs-form-textarea"
                    placeholder="Describe the aircraft condition, history, notable features..."
                    style={{ minHeight: 120 }}
                    value={formData.description || ''}
                    onChange={e => handleInputChange('description', e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                <button className="fs-form-submit" onClick={() => handleContinue(3, validateStep2)} style={{ flex: 2, marginTop: 0 }}>Continue to Photos</button>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="fs-detail-specs" style={{ boxShadow: "var(--fs-shadow-md)" }}>
              {!user ? (
                /* LOGIN PROMPT */
                <div style={{ textAlign: 'center', padding: '32px 24px' }}>
                  <div style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: '50%', 
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: 28
                  }}>
                    {Icons.user}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sign in to continue</h3>
                  <p style={{ fontSize: 14, color: 'var(--fs-gray-500)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                    Create an account or sign in to submit your aircraft listing and manage your ads.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 280, margin: '0 auto' }}>
                    <button 
                      className="fs-form-submit"
                      onClick={() => setPage && setPage('login')}
                      style={{ marginTop: 0 }}
                    >
                      Sign In / Create Account
                    </button>
                    <button 
                      className="fs-detail-cta fs-detail-cta-secondary"
                      onClick={() => setStep(2)}
                    >
                      Back to Edit
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--fs-gray-400)', marginTop: 20 }}>
                    Free to list. No credit card required.
                  </p>
                </div>
              ) : (
                /* LOGGED IN - SHOW SUBMIT FORM */
                <>
                  <h3 style={{ fontSize: 18 }}>Photos & Submit</h3>
                  {submitSuccess ? (
                    <div style={{ textAlign: "center", padding: "40px 24px" }}>
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>{Icons.check}</div>
                      <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Listing Submitted!</h3>
                      <p style={{ fontSize: 14, color: "var(--fs-gray-500)", marginBottom: 24 }}>Your listing is under review and will go live within 24 hours. You'll receive an email confirmation shortly.</p>
                      <button className="fs-form-submit" style={{ maxWidth: 220, margin: "0 auto" }} onClick={() => setPage('dashboard')}>Go to Dashboard</button>
                    </div>
                  ) : (
                    <>
                      <h3 style={{ fontSize: 18 }}>Photos & Submit</h3>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        if (!files.length) return;
                        setUploadingImages(true);
                        try {
                          const tempId = `temp-${Date.now()}`;
                          const urls = await Promise.all(files.map(f => uploadImage(f, tempId)));
                          setUploadedImages(prev => [...prev, ...urls]);
                        } catch (err) {
                          setSubmitError('Image upload failed: ' + err.message);
                        } finally {
                          setUploadingImages(false);
                        }
                      }} />
                      <div style={{ border: "2px dashed var(--fs-gray-200)", borderRadius: "var(--fs-radius)", padding: 32, textAlign: "center", marginBottom: 20 }}>
                        <div style={{ color: "var(--fs-gray-400)", marginBottom: 8 }}>{Icons.camera}</div>
                        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Upload Photos</p>
                        <p style={{ fontSize: 12, color: "var(--fs-gray-400)" }}>Minimum 4 photos recommended. Include exterior, cockpit, panel, and engine bay.</p>
                        {uploadedImages.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", margin: "12px 0" }}>
                            {uploadedImages.map((url, i) => (
                              <div key={i} style={{ position: "relative" }}>
                                <img src={url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "var(--fs-radius)", border: "2px solid var(--fs-green)" }} />
                                <button onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                                  style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button className="fs-detail-cta fs-detail-cta-secondary" style={{ maxWidth: 200, margin: "16px auto 0" }} onClick={() => fileInputRef.current?.click()} disabled={uploadingImages}>
                          {uploadingImages ? "Uploading..." : `Choose Files${uploadedImages.length > 0 ? ` (${uploadedImages.length} added)` : ''}`}
                        </button>
                      </div>
                      {/* Listing Plan selector hidden until Stripe is wired.
                          Showing Featured/Premium plans without a working payment flow
                          would be a broken UX (paid radio that goes nowhere).
                          When Stripe is integrated, restore the plan list and wire
                          submit → Stripe Checkout. Until then every listing is Basic. */}
                      {submitError && (
                        <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--fs-radius-sm)", marginBottom: 12, fontSize: 13, color: "#dc2626" }}>{submitError}</div>
                      )}
                      <div style={{ display: "flex", gap: 12 }}>
                        <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>Back</button>
                        <button
                          className="fs-form-submit"
                          style={{ flex: 2, marginTop: 0, opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
                          disabled={submitting}
                          onClick={async () => {
                            setSubmitting(true);
                            setSubmitError(null);
                            try {
                              await createListing({
                                title: `${formData.year} ${formData.manufacturer} ${formData.model}`.trim(),
                                manufacturer: formData.manufacturer,
                                model: formData.model,
                                year: parseInt(formData.year),
                                category: formData.category,
                                rego: formData.rego,
                                condition: formData.condition,
                                price: parseInt(formData.price),
                                state: formData.state,
                                city: formData.city || formData.state,
                                ttaf: parseInt(formData.ttaf) || 0,
                                eng_hours: parseInt(formData.eng_hours) || null,
                                avionics: formData.avionics,
                                description: formData.description,
                                images: uploadedImages,
                                specs: { engine: formData.engineType, propeller: formData.propeller },
                                featured: selectedPlan !== 'Basic',
                              }, user.id);
                              setSubmitSuccess(true);
                            } catch (err) {
                              setSubmitError(err.message || 'Failed to submit listing. Please try again.');
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                        >
                          {submitting ? "Submitting..." : "Submit Listing for Review"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default SellPage;
