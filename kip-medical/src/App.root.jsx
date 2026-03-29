// App.root.jsx — drop this content into your App.jsx
// This shows how to wire useAuth, useProfile, useSessions, useCoaching
// into the existing Medical or Life app shell.

import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useSessions } from './hooks/useSessions';
import { useCoaching } from './hooks/useCoaching';
import { AuthScreen } from './components/AuthScreen';
import { AdminDashboard } from './components/AdminDashboard';

// ── EXAMPLE ROOT (Medical edition) ────────────────────────────────────────────
// Replace your existing App() export with this pattern.
// The individual page components (LivePage, ScenarioPage, etc.) remain unchanged.

export default function App() {
  const { user, loading: authLoading, signInWithEmail, signInWithGoogle, signOut, isSupabaseEnabled } = useAuth();
  const { profile, saveProfile, clearProfile, syncing } = useProfile(user, 'medical');
  const { sessions, addSession, clearSessions } = useSessions(user, 'medical');
  const coaching = useCoaching(user);

  const [tab, setTab] = useState('live');
  const [last, setLast] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [authSkipped, setAuthSkipped] = useState(false);

  // Show auth screen if Supabase is enabled and user is not logged in and hasn't skipped
  const needsAuth = isSupabaseEnabled && !user && !authSkipped;

  const handleAuth = async (method, email) => {
    if (method === 'skip') { setAuthSkipped(true); return {}; }
    if (method === 'google') return signInWithGoogle();
    if (method === 'email') return signInWithEmail(email);
    return {};
  };

  const handleSessionEnd = async (data) => {
    const entry = await addSession(data);
    setLast(entry);
    setTimeout(() => setTab('coach'), 350);
  };

  const handleClearAll = async () => {
    if (!confirm('Clear profile and all sessions?')) return;
    await clearProfile();
    await clearSessions();
    setLast(null);
    setAuthSkipped(false);
    if (user) await signOut();
  };

  // Loading state
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, color: 'rgba(242,242,247,.4)' }}>Loading...</div>
      </div>
    );
  }

  // Auth wall
  if (needsAuth) return <AuthScreen onAuth={handleAuth} app="medical" />;

  // Admin view
  if (showAdmin) return <AdminDashboard onBack={() => setShowAdmin(false)} />;

  // Profile setup (if no profile yet)
  // if (!profile) return <ProfileSetup onSave={saveProfile} />;

  // ── The rest of your existing App JSX goes here unchanged ──
  // Just replace:
  //   sessions → from useSessions hook
  //   addSession → handleSessionEnd
  //   onEnd → handleSessionEnd
  //   clearSessions → clearSessions from hook
  //
  // In the header, you can add:
  //   {user && <span style={{fontSize:10,color:'rgba(242,242,247,.3)'}}>{user.email}</span>}
  //   {isSupabaseEnabled && <button onClick={()=>setShowAdmin(true)}>Admin</button>}

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f2f2f7', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Kip Vocal Intelligence — Integration Ready</h1>
      <p style={{ marginTop: 8, color: 'rgba(242,242,247,.5)', fontSize: 13 }}>
        Auth, profile sync, session persistence, and coaching reports are all wired.<br/>
        Merge this pattern into your existing App.jsx pages.
      </p>
      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {user
          ? <><span style={{ fontSize: 13, color: '#30D158' }}>✓ Signed in: {user.email}</span>
              <button onClick={signOut} style={{ fontSize: 12, padding: '6px 14px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: 'rgba(242,242,247,.5)', cursor: 'pointer' }}>Sign out</button></>
          : <span style={{ fontSize: 13, color: 'rgba(242,242,247,.4)' }}>Running without auth (localStorage only)</span>
        }
        <button onClick={() => setShowAdmin(true)} style={{ fontSize: 12, padding: '6px 14px', background: 'rgba(10,132,255,.15)', border: '1px solid rgba(10,132,255,.3)', borderRadius: 8, color: '#0A84FF', cursor: 'pointer' }}>View admin dashboard</button>
      </div>
      <div style={{ marginTop: 24, fontSize: 12, color: 'rgba(242,242,247,.35)', lineHeight: 1.8 }}>
        <strong style={{ color: 'rgba(242,242,247,.6)' }}>Hooks available:</strong><br/>
        useAuth() → user, signInWithEmail, signInWithGoogle, signOut<br/>
        useProfile(user, app) → profile, saveProfile, clearProfile<br/>
        useSessions(user, app) → sessions, addSession, clearSessions<br/>
        useCoaching(user) → report, loading, error, generate, loadReport
      </div>
    </div>
  );
}
