import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

const sc = v => v >= 70 ? '#30D158' : v >= 45 ? '#FF9F0A' : '#FF453A';

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, fontWeight: 600, color: color || '#f2f2f7' }}>{value ?? '--'}</div>
      <div style={{ fontSize: 9, color: 'rgba(242,242,247,.35)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
    </div>
  );
}

export function AdminDashboard({ onBack }) {
  const [sessions, setSessions] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterApp, setFilterApp] = useState('all');
  const [filterMode, setFilterMode] = useState('all');

  useEffect(() => {
    if (!isSupabaseEnabled) { setError('Supabase not configured.'); setLoading(false); return; }
    Promise.all([
      supabase.from('sessions').select('*, profiles(name,role,mode,app,attach_style)').order('created_at', { ascending: false }).limit(200),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ]).then(([{ data: s, error: se }, { data: p, error: pe }]) => {
      if (se || pe) setError(se?.message || pe?.message);
      else { setSessions(s || []); setProfiles(p || []); }
      setLoading(false);
    });
  }, []);

  const filtered = sessions.filter(s =>
    (filterApp === 'all' || s.app === filterApp) &&
    (filterMode === 'all' || s.mode === filterMode)
  );

  const avgConf = filtered.length ? Math.round(filtered.reduce((a, b) => a + (b.conf || 0), 0) / filtered.length) : null;
  const avgStress = filtered.length ? Math.round(filtered.reduce((a, b) => a + (b.stress || 0), 0) / filtered.length) : null;
  const scenarioSessions = filtered.filter(s => s.type === 'Scenario').length;

  // Group by user for CRM view
  const byUser = profiles.map(p => {
    const userSessions = filtered.filter(s => s.user_id === p.id);
    const latest = userSessions[0];
    const avgC = userSessions.length ? Math.round(userSessions.reduce((a, b) => a + (b.conf || 0), 0) / userSessions.length) : null;
    const trend = userSessions.length >= 2
      ? (userSessions[0].conf || 0) - (userSessions[userSessions.length - 1].conf || 0)
      : null;
    return { ...p, sessions: userSessions, latest, avgConf: avgC, trend };
  }).filter(p => p.sessions.length > 0).sort((a, b) => b.sessions.length - a.sessions.length);

  const btn = (val, current, setter, label) => (
    <button onClick={() => setter(val)} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 500, background: current === val ? 'rgba(10,132,255,.2)' : 'rgba(255,255,255,.06)', border: `1px solid ${current === val ? '#0A84FF' : 'rgba(255,255,255,.09)'}`, borderRadius: 8, color: current === val ? '#0A84FF' : 'rgba(242,242,247,.5)', cursor: 'pointer' }}>
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '20px 16px 60px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(242,242,247,.35)', marginBottom: 4 }}>Kip Vocal Intelligence</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f2f2f7' }}>Admin dashboard</h1>
          </div>
          <button onClick={onBack} style={{ fontSize: 12, color: 'rgba(242,242,247,.4)', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>← Back</button>
        </div>

        {loading && <p style={{ color: 'rgba(242,242,247,.4)', fontSize: 13 }}>Loading...</p>}
        {error && <p style={{ color: '#FF453A', fontSize: 13 }}>{error}</p>}

        {!loading && !error && (
          <>
            {/* Aggregate stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, marginBottom: 20 }}>
              <StatCard label="Total users" value={profiles.length} />
              <StatCard label="Total sessions" value={filtered.length} />
              <StatCard label="Avg confidence" value={avgConf} color={avgConf ? sc(avgConf) : undefined} />
              <StatCard label="Scenario sessions" value={scenarioSessions} />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {btn('all', filterApp, setFilterApp, 'All apps')}
              {btn('medical', filterApp, setFilterApp, 'Medical')}
              {btn('life', filterApp, setFilterApp, 'Life')}
              <div style={{ width: 1, background: 'rgba(255,255,255,.08)', margin: '0 4px' }}/>
              {btn('all', filterMode, setFilterMode, 'All modes')}
              {btn('clinician', filterMode, setFilterMode, 'Clinician')}
              {btn('patient', filterMode, setFilterMode, 'Patient')}
            </div>

            {/* CRM: per-user view */}
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(242,242,247,.35)', marginBottom: 8 }}>User progress</div>
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
              {byUser.length === 0 && <p style={{ padding: '1rem', fontSize: 13, color: 'rgba(242,242,247,.3)' }}>No users with sessions yet.</p>}
              {byUser.map((u, i) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i < byUser.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none', flexWrap: 'wrap' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(10,132,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0A84FF', flexShrink: 0 }}>
                    {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f2f2f7' }}>{u.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(242,242,247,.35)' }}>{u.role || u.mode} · {u.app} · {u.sessions.length} session{u.sessions.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ minWidth: 90 }}>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${u.avgConf || 0}%`, background: sc(u.avgConf || 0), borderRadius: 2 }}/>
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(242,242,247,.35)', marginTop: 2 }}>avg {u.avgConf ?? '--'}</div>
                  </div>
                  {u.trend !== null && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: u.trend > 0 ? '#30D158' : u.trend < 0 ? '#FF453A' : 'rgba(242,242,247,.35)', minWidth: 36, textAlign: 'right' }}>
                      {u.trend > 0 ? '+' : ''}{u.trend}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: 'rgba(242,242,247,.25)', minWidth: 64, textAlign: 'right' }}>
                    {u.latest ? new Date(u.latest.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent sessions table */}
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(242,242,247,.35)', marginBottom: 8 }}>Recent sessions</div>
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 14, overflow: 'hidden' }}>
              {filtered.slice(0, 50).map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: i < Math.min(filtered.length, 50) - 1 ? '1px solid rgba(255,255,255,.06)' : 'none', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'rgba(242,242,247,.25)', minWidth: 60 }}>
                    {new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#f2f2f7', minWidth: 100 }}>{s.profiles?.name || 'Unknown'}</span>
                  <span style={{ fontSize: 10, background: 'rgba(255,255,255,.07)', color: 'rgba(242,242,247,.5)', padding: '2px 8px', borderRadius: 8, whiteSpace: 'nowrap' }}>{s.scenario || s.type}</span>
                  <div style={{ flex: 1, minWidth: 60, height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.conf || 0}%`, background: sc(s.conf || 0), borderRadius: 2 }}/>
                  </div>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, color: sc(s.conf || 0), minWidth: 24 }}>{s.conf}</span>
                  <span style={{ fontSize: 10, color: 'rgba(242,242,247,.25)', minWidth: 50, textAlign: 'right' }}>stress {s.stress}</span>
                </div>
              ))}
              {filtered.length === 0 && <p style={{ padding: '1rem', fontSize: 13, color: 'rgba(242,242,247,.3)' }}>No sessions match this filter.</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
