'use client';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../lib/hooks';
import { Icons } from './Icons';

// Bell icon + dropdown panel. Sits in the desktop nav for signed-in
// users. Mobile users can see notifications in the dashboard's Messages
// tab (deferred — bell is desktop-only for v1).
export default function NotificationBell({ user, setPage }) {
  const { items, unreadCount, markRead, markAllRead } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  const handleItemClick = async (n) => {
    if (!n.read_at) await markRead(n.id);
    setOpen(false);
    if (n.link) {
      // Best-effort routing — most links are /dashboard or /listings/:id
      if (typeof window !== 'undefined') window.location.href = n.link;
    } else {
      setPage?.('dashboard');
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="fs-bell"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      >
        {Icons.bell}
        {unreadCount > 0 && <span className="fs-bell-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="fs-bell-panel" role="menu">
          <div className="fs-bell-head">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead}>Mark all read</button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="fs-bell-empty">You're all caught up.</div>
          ) : (
            <div className="fs-bell-list">
              {items.slice(0, 12).map(n => (
                <button
                  key={n.id}
                  type="button"
                  className={`fs-bell-row${n.read_at ? '' : ' unread'}`}
                  onClick={() => handleItemClick(n)}
                >
                  <p className="fs-bell-row-title">{n.title}</p>
                  {n.body && <p className="fs-bell-row-body">{n.body}</p>}
                  <p className="fs-bell-row-time">{new Date(n.created_at).toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
