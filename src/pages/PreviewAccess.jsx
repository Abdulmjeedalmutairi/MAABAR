import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';

const PASSWORD    = 'Abdul@1234';
const STORAGE_KEY = 'maabar_preview';

export default function PreviewAccess() {
  const navigate = useNavigate();
  const [input, setInput]   = useState('');
  const [error, setError]   = useState(false);

  useEffect(() => {
    document.title = 'Preview | Maabar';
    // Already unlocked in this session — go straight to dashboard.
    if (sessionStorage.getItem(STORAGE_KEY) === '1') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      navigate('/dashboard', { replace: true });
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 32,
    }}>
      <BrandLogo size="lg" />

      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#FFFFFF',
          border: '1px solid var(--border-subtle)',
          borderRadius: 20,
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <p style={{
          margin: 0,
          fontSize: 13,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)',
          textAlign: 'center',
          letterSpacing: '0.03em',
        }}>
          Enter preview password
        </p>

        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          placeholder="Password"
          autoFocus
          style={{
            width: '100%',
            boxSizing: 'border-box',
            height: 48,
            border: `1px solid ${error ? '#e53e3e' : 'var(--border-default)'}`,
            borderRadius: 12,
            padding: '0 14px',
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
            background: '#FAFAFA',
            color: 'var(--text-primary)',
            outline: 'none',
            direction: 'ltr',
          }}
        />

        {error && (
          <p style={{
            margin: 0,
            fontSize: 12,
            color: '#e53e3e',
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
          }}>
            Incorrect password
          </p>
        )}

        <button
          type="submit"
          style={{
            height: 48,
            background: 'var(--text-primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Enter
        </button>
      </form>
    </div>
  );
}
