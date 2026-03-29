import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

const LS_KEY = 'kip_profile';

function loadLS(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } }
function saveLS(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

export function useProfile(user, app = 'medical') {
  const [profile, setProfile] = useState(() => loadLS(`${LS_KEY}_${app}`, null));
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user || !isSupabaseEnabled) return;
    setSyncing(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .eq('app', app)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const p = { name: data.name, role: data.role, mode: data.mode, focus: data.focus,
            attachStyle: data.attach_style, partnerName: data.partner_name,
            partnerStyle: data.partner_style, app: data.app, created: data.created_at };
          setProfile(p); saveLS(`${LS_KEY}_${app}`, p);
        }
        setSyncing(false);
      });
  }, [user, app]);

  const saveProfile = useCallback(async (profileData) => {
    const p = { ...profileData, app };
    setProfile(p); saveLS(`${LS_KEY}_${app}`, p);
    if (!user || !isSupabaseEnabled) return;
    await supabase.from('profiles').upsert({
      id: user.id, name: p.name, role: p.role || null, mode: p.mode || null,
      focus: p.focus || null, attach_style: p.attachStyle || null,
      partner_name: p.partnerName || null, partner_style: p.partnerStyle || null, app: p.app,
    }, { onConflict: 'id' });
  }, [user, app]);

  const clearProfile = useCallback(async () => {
    setProfile(null); localStorage.removeItem(`${LS_KEY}_${app}`);
    if (user && isSupabaseEnabled)
      await supabase.from('profiles').delete().eq('id', user.id).eq('app', app);
  }, [user, app]);

  return { profile, saveProfile, clearProfile, syncing };
}
