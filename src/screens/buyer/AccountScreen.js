import React, { useEffect, useState } from 'react';
import { sb } from '../../supabase';

export default function AccountScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) {
        setError('No active session');
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const response = await sb
        .from('profiles')
        .select('full_name, phone, city, created_at')
        .eq('id', userId)
        .single();

      console.log('AccountScreen raw profile response:', response);

      if (response.error) {
        setError(response.error.message);
      } else {
        setProfile(response.data);
      }
      setLoading(false);
    }

    loadProfile();
  }, []);

  if (loading) return <div style={styles.container}><p style={styles.muted}>Loading…</p></div>;
  if (error) return <div style={styles.container}><p style={{ color: '#c0392b' }}>Error: {error}</p></div>;
  if (!profile) return <div style={styles.container}><p style={styles.muted}>No profile found.</p></div>;

  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-SA', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Account</h2>
      <div style={styles.card}>
        <Row label="Full Name" value={profile.full_name || '—'} />
        <Row label="Phone" value={profile.phone || '—'} />
        <Row label="City" value={profile.city || '—'} />
        <Row label="Member Since" value={joinedDate} />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{value}</span>
    </div>
  );
}

const styles = {
  container: {
    padding: '32px 24px',
    maxWidth: 480,
    margin: '0 auto',
  },
  heading: {
    fontSize: 24,
    fontWeight: 400,
    marginBottom: 24,
    color: 'var(--text-primary, #111)',
  },
  card: {
    border: '1px solid var(--border-muted, #e2e2e2)',
    borderRadius: 12,
    padding: '24px 28px',
    background: 'var(--bg-subtle, #fafafa)',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-muted, #efefef)',
    paddingBottom: 14,
  },
  label: {
    fontSize: 13,
    color: 'var(--text-disabled, #888)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  value: {
    fontSize: 15,
    color: 'var(--text-primary, #111)',
    fontWeight: 400,
  },
  muted: {
    color: 'var(--text-disabled, #888)',
    fontSize: 14,
  },
};
