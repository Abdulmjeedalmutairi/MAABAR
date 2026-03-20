import React, { useState } from 'react';

const AGENT_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/dev-agent';
const PASSWORD = 'maabar-dev-2026';

export default function AgentPanel() {
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState('');
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('dev'); // dev | suggest
  const [log, setLog] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const login = () => {
    if (pass === PASSWORD) setAuth(true);
    else alert('كلمة المرور غلط');
  };

  const sendCommand = async () => {
    if (loading) return;
    if (mode === 'dev' && !command.trim()) return;
    setLoading(true);
    setSuggestions([]);

    try {
      const res = await fetch(AGENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: command.trim() || 'اعطني اقتراحات لتحسين المنصة',
          password: PASSWORD,
          mode
        })
      });
      const data = await res.json();

      if (mode === 'suggest' && data.suggestions) {
        setSuggestions(data.suggestions);
      } else if (data.success) {
        setLog(l => [{ cmd: command, file: data.file, status: data.message, time: new Date().toLocaleTimeString('ar') }, ...l]);
        setCommand('');
      } else {
        setLog(l => [{ cmd: command, status: `❌ ${data.error}`, time: new Date().toLocaleTimeString('ar') }, ...l]);
      }
    } catch (e) {
      setLog(l => [{ cmd: command, status: '❌ تعذر الاتصال', time: new Date().toLocaleTimeString('ar') }, ...l]);
    }
    setLoading(false);
  };

  if (!auth) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: 'rgba(247,245,242,0.95)', border: '1px solid #E5E0D8',
        borderRadius: 4, padding: '48px 40px', width: 340,
        backdropFilter: 'blur(16px)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        <p style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 24, textAlign: 'center' }}>
          MAABAR DEV AGENT
        </p>
        <input
          type="password"
          placeholder="كلمة المرور"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{
            width: '100%', padding: '12px 16px', border: '1px solid #E5E0D8',
            background: 'rgba(247,245,242,0.8)', fontSize: 14, outline: 'none',
            borderRadius: 2, marginBottom: 12, textAlign: 'center',
            boxSizing: 'border-box', color: '#2C2C2C'
          }}
        />
        <button onClick={login} style={{
          width: '100%', background: '#2C2C2C', color: '#F7F5F2',
          border: 'none', padding: 13, fontSize: 11, letterSpacing: 2,
          textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2
        }}>دخول</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, direction: 'rtl' }}>

      {/* HEADER */}
      <div style={{
        padding: '40px 60px 0',
        background: 'rgba(0,0,0,0.52)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <p style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
          MAABAR
        </p>
        <h1 style={{ fontSize: 48, fontWeight: 300, color: '#F7F5F2', fontFamily: 'var(--font-en)', letterSpacing: -1, marginBottom: 6 }}>
          Dev Agent
        </h1>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 32, letterSpacing: 3, textTransform: 'uppercase' }}>
          مطور الموقع الذكي
        </p>

        {/* MODE TABS */}
        <div style={{ display: 'flex' }}>
          {[
            { id: 'dev', label: 'تطوير' },
            { id: 'suggest', label: 'اقتراحات' }
          ].map(t => (
            <button key={t.id} onClick={() => { setMode(t.id); setSuggestions([]); }} style={{
              padding: '12px 28px', background: 'none', border: 'none',
              borderBottom: mode === t.id ? '1px solid rgba(255,255,255,0.6)' : '1px solid transparent',
              color: mode === t.id ? '#F7F5F2' : 'rgba(255,255,255,0.3)',
              fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
              letterSpacing: 2, textTransform: 'uppercase',
              fontFamily: 'var(--font-ar)'
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '40px 60px', maxWidth: 800, margin: '0 auto' }}>

        {/* INPUT */}
        <div style={{
          background: 'rgba(247,245,242,0.92)', border: '1px solid #E5E0D8',
          padding: 28, marginBottom: 32, backdropFilter: 'blur(8px)'
        }}>
          {mode === 'dev' ? (
            <>
              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16 }}>
                الأمر
              </p>
              <textarea
                value={command}
                onChange={e => setCommand(e.target.value)}
                placeholder='مثال: "في Dashboard، حسّن تصميم الكروت وخلها أكثر أناقة"'
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px', border: '1px solid #E5E0D8',
                  fontSize: 14, resize: 'vertical', outline: 'none',
                  fontFamily: 'var(--font-ar)', boxSizing: 'border-box',
                  background: 'rgba(247,245,242,0.8)', color: '#2C2C2C', borderRadius: 2
                }}
              />
            </>
          ) : (
            <>
              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16 }}>
                نوع التحليل
              </p>
              <textarea
                value={command}
                onChange={e => setCommand(e.target.value)}
                placeholder='اتركه فارغاً للتحليل الشامل، أو اكتب: "ركز على تجربة المورد" أو "حسّن صفحة الطلبات"'
                rows={2}
                style={{
                  width: '100%', padding: '12px 14px', border: '1px solid #E5E0D8',
                  fontSize: 14, resize: 'vertical', outline: 'none',
                  fontFamily: 'var(--font-ar)', boxSizing: 'border-box',
                  background: 'rgba(247,245,242,0.8)', color: '#2C2C2C', borderRadius: 2
                }}
              />
            </>
          )}

          <button
            onClick={sendCommand}
            disabled={loading}
            style={{
              marginTop: 16,
              background: loading ? '#7a7a7a' : '#2C2C2C',
              color: '#F7F5F2', border: 'none', padding: '12px 32px',
              fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 2,
              transition: 'all 0.2s'
            }}>
            {loading ? 'جاري التنفيذ...' : mode === 'dev' ? 'نفّذ الأمر' : 'حلّل الموقع'}
          </button>
        </div>

        {/* SUGGESTIONS */}
        {suggestions.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 20 }}>
              الاقتراحات — {suggestions.length} نقطة
            </p>
            {suggestions.map((s, i) => (
              <div key={i} style={{
                borderTop: i === 0 ? '1px solid #E5E0D8' : 'none',
                borderBottom: '1px solid #E5E0D8',
                padding: '20px 0',
                animation: `fadeIn 0.4s ease ${i * 0.08}s both`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: '#7a7a7a', fontFamily: 'var(--font-en)', minWidth: 20 }}>
                      {String(s.priority).padStart(2, '0')}
                    </span>
                    <p style={{ fontSize: 15, fontWeight: 500, color: '#2C2C2C', fontFamily: 'var(--font-ar)' }}>{s.title}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', padding: '3px 10px',
                      border: '1px solid #E5E0D8', color: '#7a7a7a', borderRadius: 2
                    }}>{s.category}</span>
                    <span style={{
                      fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', padding: '3px 10px',
                      background: s.impact === 'عالي' ? '#2C2C2C' : 'transparent',
                      color: s.impact === 'عالي' ? '#F7F5F2' : '#7a7a7a',
                      border: '1px solid #E5E0D8', borderRadius: 2
                    }}>{s.impact}</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#7a7a7a', lineHeight: 1.7, paddingRight: 32, fontFamily: 'var(--font-ar)' }}>
                  {s.description}
                </p>
                <button
                  onClick={() => { setMode('dev'); setCommand(`طبّق هذا الاقتراح: ${s.title} — ${s.description}`); setSuggestions([]); }}
                  style={{
                    marginTop: 12, marginRight: 32, background: 'none', border: 'none',
                    color: '#2C2C2C', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                    cursor: 'pointer', padding: 0, textDecoration: 'underline'
                  }}>
                  تطبيق هذا الاقتراح
                </button>
              </div>
            ))}
          </div>
        )}

        {/* LOG */}
        {log.length > 0 && (
          <div>
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 20 }}>
              سجل الأوامر
            </p>
            {log.map((item, i) => (
              <div key={i} style={{
                borderTop: i === 0 ? '1px solid #E5E0D8' : 'none',
                borderBottom: '1px solid #E5E0D8',
                padding: '16px 0',
                animation: 'fadeIn 0.4s ease'
              }}>
                <p style={{ fontSize: 13, color: '#2C2C2C', marginBottom: 6, fontFamily: 'var(--font-ar)' }}>{item.cmd}</p>
                {item.file && (
                  <p style={{ fontSize: 11, color: '#7a7a7a', marginBottom: 4, fontFamily: 'var(--font-en)', letterSpacing: 0.5 }}>
                    {item.file}
                  </p>
                )}
                <p style={{ fontSize: 12, color: item.status.includes('❌') ? '#c00' : '#2d7a4f', fontFamily: 'var(--font-ar)' }}>
                  {item.status}
                </p>
                <p style={{ fontSize: 10, color: '#7a7a7a', marginTop: 4 }}>{item.time}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer style={{ background: '#2C2C2C', padding: '32px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 80 }}>
        <div style={{ fontFamily: 'var(--font-en)', fontSize: 16, fontWeight: 600, color: '#F7F5F2', letterSpacing: 2 }}>
          MAABAR <span style={{ fontFamily: 'var(--font-ar)', fontSize: 13, opacity: 0.5 }}>| مَعبر</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: 1 }}>Dev Agent v2</p>
      </footer>
    </div>
  );
}