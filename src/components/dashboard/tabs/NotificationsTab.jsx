'use client';

// Notification preferences for the private dashboard. Three groups:
// email (3 toggles), SMS (2), other (marketing). Pure UI for now —
// hooked to local component state in DashboardPage. When a
// notification_settings table exists, swap setNotifications for a
// persisted hook without touching this component.

const TOGGLE_GROUPS = [
  {
    heading: 'Email Notifications',
    items: [
      { key: 'emailEnquiries', label: 'New enquiries on my listings', desc: 'When someone contacts you about your aircraft' },
      { key: 'emailOffers', label: 'Offers on my listings', desc: 'When someone makes an offer on your aircraft' },
      { key: 'emailSavedSearch', label: 'Saved search alerts', desc: 'When new aircraft match your saved searches' },
    ],
  },
  {
    heading: 'SMS Notifications',
    items: [
      { key: 'smsEnquiries', label: 'New enquiries', desc: 'Text message for urgent enquiries' },
      { key: 'smsOffers', label: 'New offers', desc: 'Text message when you receive an offer' },
    ],
  },
  {
    heading: 'Other',
    items: [
      { key: 'marketingEmails', label: 'Marketing emails', desc: 'Promotions, tips, and news from Flightsales' },
    ],
  },
];

export default function NotificationsTab({ notifications, setNotifications }) {
  const onToggle = (key) => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  return (
    <>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Notification Preferences</h3>
      <div className="fs-detail-specs" style={{ padding: '24px', borderRadius: 12 }}>
        {TOGGLE_GROUPS.map((group, gi) => (
          <div key={group.heading} style={{ marginBottom: gi < TOGGLE_GROUPS.length - 1 ? 32 : 0 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>{group.heading}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {group.items.map((item) => (
                <Toggle
                  key={item.key}
                  label={item.label}
                  desc={item.desc}
                  checked={!!notifications[item.key]}
                  onChange={() => onToggle(item.key)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: 12, color: 'var(--fs-gray-400)' }}>{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        style={{
          width: 48,
          height: 24,
          borderRadius: 'var(--fs-radius-lg)',
          background: checked ? 'var(--fs-ink)' : 'var(--fs-gray-200)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 26 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'white',
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  );
}
