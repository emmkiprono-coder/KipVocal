import { useState, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

export function useCoaching(user) {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = useCallback(async (sessionData, profile, partner = null, app = 'medical') => {
    setLoading(true); setError(''); setReport('');

    const s = sessionData;
    const isPatient = s.mode === 'patient' || profile.mode === 'patient';
    const isLife = app === 'life';

    let prompt = '';

    if (isLife) {
      const STYLES = {
        secure: 'Secure — comfortable with closeness and independence, communicates needs directly.',
        anxious: 'Anxious/Preoccupied — seeks closeness, worries about relationships, may over-explain.',
        avoidant: 'Avoidant/Dismissive — values independence, may withdraw under stress, under-shares emotions.',
        disorganized: 'Fearful/Disorganized — mixed approach to closeness, oscillates between wanting and fearing connection.',
      };
      prompt = `You are a relationship and communication coach with deep knowledge of attachment theory. Write a personalized coaching report.

Person: ${profile.name}${profile.focus ? `, Focus: ${profile.focus}` : ''}
Communication style: ${STYLES[profile.attachStyle] || 'not assessed'}
Session: ${s.type}${s.scenario ? ` — ${s.scenario}` : ''}
${partner ? `Partner: ${partner.name} (${STYLES[partner.attachStyle] || 'not assessed'})` : ''}

Metrics: Confidence ${s.conf}/100, Fluency ${s.fluency}/100, Cognitive load ${s.load}/100, Stress ${s.stress}/100, Pace ${s.pace} wpm, Fillers ${s.nlp?.fc || 0}${s.overallScore ? `, Scenario score ${s.overallScore}/100` : ''}
${s.transcript ? `Transcript: "${s.transcript.substring(0, 350)}"` : ''}

Write exactly 4 plain paragraphs. No headers, bullets, or markdown. 1) One genuine communication strength — tie it to their attachment style where authentic. 2) The single most important pattern to shift — specific, behavioral, tied to attachment style. 3) One relationship communication drill for the next week. 4) Encouragement that honors their growth. ${partner ? 'Acknowledge the courage of practicing together.' : ''} Warm, insightful, direct.`;
    } else {
      prompt = `You are a healthcare communication coach. Write a personalized coaching report.

Role: ${profile.role || profile.mode}
Session: ${s.type}${s.scenario ? ` (${s.scenario})` : ''}${isPatient ? ' — patient communication coaching' : ' — clinician/interpreter coaching'}

Metrics: Confidence ${s.conf}/100, Fluency ${s.fluency}/100, Cognitive load ${s.load}/100, Stress ${s.stress}/100, Pace ${s.pace} wpm, Fillers ${s.nlp?.fc || 0}${s.overallScore ? `, Scenario score ${s.overallScore}/100` : ''}
${s.transcript ? `Transcript: "${s.transcript.substring(0, 300)}"` : ''}

Write exactly 4 plain paragraphs. No headers, bullets, markdown. 1) One genuine strength. 2) Top improvement area with specific behavioral guidance. 3) One drill for next 24 hours. 4) Encouragement tied to their healthcare context. Warm, direct, professional. ${isPatient ? 'Patient mode: be empowering.' : 'Clinician mode: hold to high clinical communication standard.'}`;
    }

    try {
      let txt = null;
      for (const url of ['https://api.anthropic.com/v1/messages', '/api/claude']) {
        try {
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 900, messages: [{ role: 'user', content: prompt }] }),
          });
          if (!r.ok) continue;
          const d = await r.json();
          txt = d.content?.find(b => b.type === 'text')?.text;
          if (txt) break;
        } catch { continue; }
      }

      if (txt) {
        setReport(txt);

        // Save to Supabase if session has a DB id
        if (user && isSupabaseEnabled && s.id && s.fromDB) {
          await supabase.from('coaching_reports').insert({
            session_id: s.id,
            user_id: user.id,
            report_text: txt,
          });
        }
      } else {
        setError('AI coaching requires an Anthropic API connection. Add ANTHROPIC_API_KEY to your Vercel environment variables.');
      }
    } catch {
      setError('Network error. Please try again.');
    }

    setLoading(false);
    return report;
  }, [user, report]);

  // Load the most recent coaching report for a session
  const loadReport = useCallback(async (sessionId) => {
    if (!user || !isSupabaseEnabled || !sessionId) return null;
    const { data } = await supabase
      .from('coaching_reports')
      .select('report_text, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setReport(data.report_text);
    return data?.report_text || null;
  }, [user]);

  return { report, loading, error, generate, loadReport, setReport };
}
