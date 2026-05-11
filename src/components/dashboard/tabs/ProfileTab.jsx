'use client';

// Profile tab for the private dashboard. Two states:
//   1. View — avatar + name/email + phone/location/role rows + Edit button
//   2. Edit — form to update name/phone/location (email is immutable)
//
// Save goes through the parent's handleSaveProfile (which uses the
// useProfile hook to PATCH the row).

export default function ProfileTab({
  user,
  profileData,
  setProfileData,
  editProfile,
  setEditProfile,
  savingProfile,
  onSave,
}) {
  return (
    <>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Profile Settings</h3>
      <div className="fs-detail-specs" style={{ padding: '24px' }}>
        {!editProfile ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <img src={user.avatar} alt={user.full_name} style={{ width: 80, height: 80, borderRadius: '50%' }} />
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 600 }}>{profileData.full_name}</h4>
                <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>{profileData.email}</p>
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <Row label="Phone" value={profileData.phone || 'Not set'} />
              <Row label="Location" value={profileData.location || 'Not set'} />
              <Row label="Account Type" value={user.role} capitalize last />
            </div>
            <button className="fs-detail-cta fs-detail-cta-primary" onClick={() => setEditProfile(true)}>
              Edit Profile
            </button>
          </>
        ) : (
          <>
            <div className="fs-form-group">
              <label className="fs-form-label">Full Name</label>
              <input
                className="fs-form-input"
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              />
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Email</label>
              <input className="fs-form-input" value={profileData.email} disabled />
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Phone</label>
              <input
                className="fs-form-input"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="04XX XXX XXX"
              />
            </div>
            <div className="fs-form-group">
              <label className="fs-form-label">Location</label>
              <input
                className="fs-form-input"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                placeholder="e.g. Sydney, NSW"
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="fs-form-submit"
                onClick={onSave}
                disabled={savingProfile}
                style={{ opacity: savingProfile ? 0.7 : 1 }}
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="fs-detail-cta fs-detail-cta-secondary" onClick={() => setEditProfile(false)}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Row({ label, value, capitalize, last }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: last ? 'none' : '1px solid var(--fs-gray-100)',
    }}>
      <span style={{ color: 'var(--fs-gray-500)' }}>{label}</span>
      <span style={capitalize ? { textTransform: 'capitalize' } : undefined}>{value}</span>
    </div>
  );
}
