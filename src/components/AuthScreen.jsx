import { useState } from 'react';

export function AuthScreen({ onAuth, app = 'medical' }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isMedical = app === 'medical';
  const accent = isMedical ? '#0A84FF' : '#BF5AF2';
  const bg = isMedical ? '#0a0a0f' : '#0d0b14';
  const logoGrad = isMedical
    ? 'linear-gradient(135deg,#0A84FF,#0055CC)'
    : 'linear-gradient(135deg,#BF5AF2,#FF6B8A)';

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');
    const result = await onAuth('email', email);
    if (result?.error) { setError(result.error); setLoading(false); }
    else { setSent(true); setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    const result = await onAuth('google');
    if (result?.error) { setError(result.error); setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: bg }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)', borderRadius: 20, padding: '32px 28px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: logoGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'sans-serif' }}>K</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f2f2f7', lineHeight: 1.2 }}>Kip Vocal Intelligence</div>
            <div style={{ fontSize: 10, color: 'rgba(242,242,247,.35)' }}>{isMedical ? 'Medical Edition' : 'Life Edition'}</div>
          </div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f2f2f7', marginBottom: 8 }}>Check your email</h2>
            <p style={{ fontSize: 13, color: 'rgba(242,242,247,.5)', lineHeight: 1.7 }}>
              We sent a magic link to <strong style={{ color: '#f2f2f7' }}>{email}</strong>.<br/>
              Click the link to sign in — no password needed.
            </p>
            <button onClick={() => setSent(false)} style={{ marginTop: 20, fontSize: 12, color: 'rgba(242,242,247,.4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f2f2f7', marginBottom: 6 }}>Sign in</h2>
            <p style={{ fontSize: 12, color: 'rgba(242,242,247,.4)', marginBottom: 24, lineHeight: 1.7 }}>
              Your sessions, history, and coaching reports sync across devices when you're signed in.
            </p>

            {/* Google */}
            <button onClick={handleGoogle} disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#f2f2f7', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 12, opacity: loading ? 0.6 : 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,.1)' }}/>
              <span style={{ fontSize: 11, color: 'rgba(242,242,247,.3)' }}>or</span>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,.1)' }}/>
            </div>

            {/* Magic link */}
            <form onSubmit={handleEmail}>
              <div style={{ marginBottom: 10 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, background: 'rgba(255,255,255,.06)', color: '#f2f2f7', outline: 'none', fontFamily: 'sans-serif' }}
                />
              </div>
              {error && <p style={{ fontSize: 12, color: '#FF453A', marginBottom: 8 }}>{error}</p>}
              <button type="submit" disabled={loading || !email.trim()} style={{ width: '100%', padding: '10px', background: loading ? 'rgba(255,255,255,.07)' : accent, color: loading ? 'rgba(242,242,247,.4)' : '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: loading || !email.trim() ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </form>

            <p style={{ fontSize: 11, color: 'rgba(242,242,247,.25)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              No password needed. We'll email you a secure link.<br/>
              All session data syncs to your account automatically.
            </p>
          </>
        )}

        {/* Skip auth option */}
        <button
          onClick={() => onAuth('skip')}
          style={{ width: '100%', marginTop: 16, fontSize: 11, color: 'rgba(242,242,247,.25)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textAlign: 'center' }}
        >
          Continue without signing in (data saves locally only)
        </button>
      </div>
    </div>
  );
}
