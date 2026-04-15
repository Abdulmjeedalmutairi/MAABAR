import React, { useEffect, useState } from 'react';
import BrandLogo from '../components/BrandLogo';

const LAUNCH = new Date('2026-05-01T00:00:00+03:00').getTime();

function useCountdown() {
  const [diff, setDiff] = useState(() => Math.max(0, LAUNCH - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, LAUNCH - Date.now())), 1000);
    return () => clearInterval(id);
  }, []);
  const total = Math.floor(diff / 1000);
  return {
    d: Math.floor(total / 86400),
    h: Math.floor(total / 3600) % 24,
    m: Math.floor(total / 60) % 60,
    s: total % 60,
  };
}

function Box({ value, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 72,
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        background: '#FFFFFF',
        fontSize: 30,
        fontWeight: 300,
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-primary)',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <span style={{
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)',
        fontFamily: 'var(--font-sans)',
      }}>
        {label}
      </span>
    </div>
  );
}

export default function ComingSoon() {
  useEffect(() => { document.title = 'Maabar | مَعبر'; }, []);
  const { d, h, m, s } = useCountdown();

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 44,
      padding: 24,
    }}>
      <BrandLogo size="xl" />
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <Box value={d} label="Days" />
        <Box value={h} label="Hours" />
        <Box value={m} label="Min" />
        <Box value={s} label="Sec" />
      </div>
    </div>
  );
}
