'use client';

import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'var(--fs-font, system-ui)',
          background: 'var(--fs-bg, #fafafa)'
        }}>
          <div style={{
            maxWidth: '480px',
            textAlign: 'center',
            padding: '40px 24px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--fs-gray-100, #f5f5f5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '28px'
            }}>
              ⚠️
            </div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              marginBottom: '12px',
              color: 'var(--fs-gray-900, #0a0a0a)',
              letterSpacing: '-0.02em'
            }}>
              Something went wrong
            </h1>
            <p style={{
              fontSize: '15px',
              color: 'var(--fs-gray-600, #525252)',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}>
              We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: 'var(--fs-gray-900, #0a0a0a)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
