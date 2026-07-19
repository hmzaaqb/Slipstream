import { Component } from 'react';

// Last-resort error boundary. Without one, any render exception blanks the
// whole app with no explanation — the worst possible failure mode on a phone.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          background: '#050505',
          color: '#F7F7F5',
          fontFamily: "'Archivo', system-ui, sans-serif",
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 34 }}>⚡</div>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Something broke.</div>
        <div style={{ fontSize: 13, color: '#B5B5B1', maxWidth: 320 }}>
          {String(this.state.error?.message || this.state.error)}
        </div>
        <button
          onClick={() => location.reload()}
          style={{
            marginTop: 8,
            padding: '12px 26px',
            borderRadius: 14,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 800,
            background: 'linear-gradient(135deg,#F2D675,#D4AF37)',
            color: '#090909',
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
