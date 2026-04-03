import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary caught:', error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    const isAr = this.props.lang === 'ar';
    return (
      <div style={{ minHeight: 'var(--app-dvh)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 20 }}>ERROR</p>
        <h1 style={{ fontSize: 32, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
          {isAr ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-disabled)', marginBottom: 40, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
          {isAr ? 'نعتذر — حاول تحديث الصفحة' : 'Please try refreshing the page'}
        </p>
        <button onClick={() => window.location.reload()} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-muted)', color: 'var(--text-primary)', padding: '12px 28px', fontSize: 13, cursor: 'pointer', borderRadius: 'var(--radius-md)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
          {isAr ? 'تحديث الصفحة' : 'Refresh Page'}
        </button>
      </div>
    );
  }
}
