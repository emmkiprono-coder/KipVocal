import { useState } from 'react';

const ROLES = [
  'Medical interpreter',
  'Language access coordinator',
  'Healthcare provider',
  'Language services manager',
  'Interpreter trainer',
  'Patient advocate',
  'Other',
];

export default function ProfileSetup({ onSave }) {
  const [form, setForm] = useState({ name: '', role: '', org: '' });
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Please enter your name.'); return; }
    onSave(form);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--bg-base)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            Vocal Intelligence Platform
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: 10 }}>
            Build your vocal profile
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Your profile personalizes coaching reports and readiness scoring. All data stays on your device.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 5 }}>
              Your name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Emmanuel Chepkwony"
              style={{
                width: '100%', padding: '10px 12px', fontSize: 14,
                border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 5 }}>
              Role
            </label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 14,
                border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)', color: form.role ? 'var(--text-primary)' : 'var(--text-tertiary)', outline: 'none',
              }}
            >
              <option value="">Select your role</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 5 }}>
              Organization <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={form.org}
              onChange={e => setForm(f => ({ ...f, org: e.target.value }))}
              placeholder="e.g. Advocate Health"
              style={{
                width: '100%', padding: '10px 12px', fontSize: 14,
                border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
              }}
            />
          </div>

          {error && <p style={{ fontSize: 12, color: '#E24B4A' }}>{error}</p>}

          <button
            onClick={handleSubmit}
            style={{
              padding: '11px 24px', background: 'var(--text-primary)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
              cursor: 'pointer', marginTop: 4, transition: 'opacity 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            Get started
          </button>

          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.6 }}>
            No account needed. All data is stored locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
