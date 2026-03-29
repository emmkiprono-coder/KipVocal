import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

function loadLS(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } }
function saveLS(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

function dbRowToSession(row) {
  return {
    id: row.id,
    time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date(row.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    ts: new Date(row.created_at).getTime(),
    type: row.type,
    scenario: row.scenario,
    scenarioId: row.scenario_id,
    mode: row.mode,
    conf: row.conf,
    fluency: row.fluency,
    load: row.load,
    stress: row.stress,
    pace: row.pace,
    overallScore: row.overall_score,
    transcript: row.transcript,
    rubricScores: row.rubric_scores,
    nlp: { fc: row.filler_count, wc: row.word_count, ttr: row.ttr },
    fromDB: true,
  };
}

export function useSessions(user, app = 'medical') {
  const lsKey = `kip_sessions_${app}`;
  const [sessions, setSessions] = useState(() => loadLS(lsKey, []));
  const [loading, setLoading] = useState(false);

  // On login, fetch sessions from Supabase and merge with local
  useEffect(() => {
    if (!user || !isSupabaseEnabled) return;
    setLoading(true);
    supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('app', app)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (data && data.length > 0) {
          const dbSessions = data.map(dbRowToSession);
          setSessions(dbSessions);
          saveLS(lsKey, dbSessions);
        }
        setLoading(false);
      });
  }, [user, app]);

  const addSession = useCallback(async (sessionData) => {
    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      ts: Date.now(),
      ...sessionData,
    };

    // Optimistic update
    setSessions(prev => {
      const next = [entry, ...prev].slice(0, 100);
      saveLS(lsKey, next);
      return next;
    });

    // Sync to Supabase if available
    if (user && isSupabaseEnabled) {
      const { data, error } = await supabase.from('sessions').insert({
        user_id: user.id,
        app,
        type: entry.type,
        scenario: entry.scenario || null,
        scenario_id: entry.scenarioId || null,
        mode: entry.mode || null,
        conf: entry.conf ?? null,
        fluency: entry.fluency ?? null,
        load: entry.load ?? null,
        stress: entry.stress ?? null,
        pace: entry.pace ?? null,
        filler_count: entry.nlp?.fc ?? 0,
        word_count: entry.nlp?.wc ?? 0,
        ttr: entry.nlp?.ttr ?? null,
        overall_score: entry.overallScore ?? null,
        transcript: entry.transcript || null,
        rubric_scores: entry.rubricScores || null,
      }).select().single();

      // Update local entry with DB id
      if (data) {
        setSessions(prev => {
          const updated = prev.map(s => s.id === entry.id ? { ...s, id: data.id, fromDB: true } : s);
          saveLS(lsKey, updated);
          return updated;
        });
        return { ...entry, id: data.id, fromDB: true };
      }
    }

    return entry;
  }, [user, app, lsKey]);

  const clearSessions = useCallback(async () => {
    setSessions([]);
    localStorage.removeItem(lsKey);
    if (user && isSupabaseEnabled) {
      await supabase.from('sessions').delete().eq('user_id', user.id).eq('app', app);
    }
  }, [user, app, lsKey]);

  return { sessions, loading, addSession, clearSessions };
}
