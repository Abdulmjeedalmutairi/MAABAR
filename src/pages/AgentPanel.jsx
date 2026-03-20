import React, { useState } from 'react';

const SERVER = 'http://localhost:3001';
const PASSWORD = 'maabar2026';

export default function AgentPanel() {
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState('');
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);

  const login = () => {
    if (pass === PASSWORD) setAuth(true);
    else alert('كلمة المرور غلط');
  };

  const sendCommand = async () => {
    if (!command.trim() || loading) return;
    setLoading(true);
    const entry = { cmd: command, status: 'جاري التنفيذ...', time: new Date().toLocaleTimeString() };
    setLog(l => [entry, ...l]);
    setCommand('');
    try {
      const res = await fetch(`${SERVER}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: entry.cmd })
      });
      const data = await res.json();
      setLog(l => l.map((item, i) =>
        i === 0
          ? { ...item, status: data.success ? `✅ تم: ${data.files?.join(', ')}` : `❌ خطأ: ${data.error}` }
          : item
      ));
    } catch (e) {
      setLog(l => l.map((item, i) =>
        i === 0 ? { ...item, status: '❌ تعذر الاتصال بالـ server' } : item
      ));
    }
    setLoading(false);
  };

  if (!auth) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#FAF8F4'
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 40,
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: 320, textAlign: 'center'
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
        <h2 style={{ marginBottom: 4, fontSize: 18 }}>Agent معبر</h2>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>أدخل كلمة المرور</p>
        <input
          type="password"
          placeholder="كلمة المرور"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{
            width: '100%', padding: '10px 14px', border: '1px solid #e8e4de',
            borderRadius: 8, fontSize: 14, marginBottom: 12,
            textAlign: 'center', outline: 'none', boxSizing: 'border-box'
          }}
        />
        <button onClick={login} style={{
          width: '100%', background: '#1a1a1a', color: '#fff',
          border: 'none', borderRadius: 8, padding: '11px',
          fontSize: 14, cursor: 'pointer'
        }}>دخول</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', padding: 24, direction: 'rtl' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4caf50' }}></div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Agent معبر</h1>
          <span style={{ fontSize: 12, color: '#888', marginRight: 'auto' }}>متصل بـ localhost:3001</span>
        </div>

        {/* Command Input */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: 20,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20
        }}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>اكتب أمرك بالعربي:</p>
          <textarea
            value={command}
            onChange={e => setCommand(e.target.value)}
            placeholder='مثال: "في صفحة Home، غير لون الزر الرئيسي إلى أزرق"'
            rows={3}
            style={{
              width: '100%', padding: '12px 14px', border: '1px solid #e8e4de',
              borderRadius: 8, fontSize: 14, resize: 'vertical',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              background: '#FAF8F4'
            }}
          />
          <button
            onClick={sendCommand}
            disabled={loading}
            style={{
              marginTop: 12, background: loading ? '#888' : '#1a1a1a',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '11px 28px', fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ جاري التنفيذ...' : '🚀 نفّذ الأمر'}
          </button>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>سجل الأوامر</h3>
            {log.map((item, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 10, padding: '14px 16px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                borderRight: `3px solid ${item.status.includes('✅') ? '#4caf50' : item.status.includes('❌') ? '#f44336' : '#ff9800'}`
              }}>
                <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{item.cmd}</p>
                <p style={{ fontSize: 12, color: '#666' }}>{item.status}</p>
                <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{item.time}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}