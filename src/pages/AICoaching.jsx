import { useState } from 'react';
import { getScoreColor } from '../utils/audio';
import { INTERPRETER_READINESS_LEVELS } from '../data/scenarios';
import { SectionLabel, Card, Spinner } from '../components/UI';

function ReadinessLevel({ score }) {
  const level = INTERPRETER_READINESS_LEVELS.find(l => score >= l.min && score <= l.max) || INTERPRETER_READINESS_LEVELS[0];
  return (
    <div style={{ background: level.bg, borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: level.color }}>{level.label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: level.color }}>{score}</span>
      </div>
      <p style={{ fontSize: 12, color: level.color, opacity: 0.85, lineHeight: 1.5 }}>{level.description}</p>
    </div>
  );
}

export default function AICoaching({ lastSession, profile }) {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    if (!lastSession) return;
    setLoading(true);
    setError('');
    setReport('');

    const s = lastSession;
    const roleContext = profile?.role ? `The speaker's role is: ${profile.role}.` : '';
    const scenarioCtx = s.scenario ? `This was a scenario practice session: "${s.scenario}".` : 'This was a free recording session.';

    const prompt = `You are a professional vocal communication coach specializing in healthcare communication and interpreter readiness. Analyze the speaker's session data and write a personalized, actionable coaching report.

${roleContext}
${scenarioCtx}

Session metrics:
- Confidence score: ${s.conf}/100
- Fluency score: ${s.fluency}/100
- Cognitive load: ${s.loadScore}/100
- Stress index: ${s.stressIndex}/100
- Speaking pace: ${s.pace} wpm (optimal: 120-160 wpm)
- Pitch volatility: ${Math.round(s.pvScore || 0)} (lower is more stable)
- Hesitation index: ${Math.round(s.hiScore || 0)} (pauses per minute)
- Vocal tension: ${Math.round(s.tension || 0)}
- Words spoken: ${s.nlp?.wordCount || 0}
- Vocabulary diversity (TTR): ${s.nlp?.ttr || '--'}%
- Filler words detected: ${s.nlp?.fillerCount || 0}
- Avg word length: ${s.nlp?.avgWordLen || '--'}
${s.overallScore ? `- Scenario weighted score: ${s.overallScore}/100` : ''}
${s.transcript ? `\nTranscript excerpt (first 400 chars): "${s.transcript.substring(0, 400)}"` : ''}

Write a coaching report in exactly 4 paragraphs with NO headers, NO bullet points, and NO markdown formatting:

1. Open with one specific, genuine strength you observe in the data.
2. Name the single most impactful area to improve, with a specific behavioral description of what to do differently. Be concrete, not vague.
3. Give one targeted drill or practice exercise they can do in the next 24 hours.
4. Close with a forward-looking encouragement that connects to their professional context.

Use warm, direct, professional language. Do not use generic praise. Do not use the words "certainly", "absolutely", or "great". Write as a coach who respects the speaker's intelligence.`;

    try {
      // Try in-context API first (claude.ai), then our Vercel proxy
      let txt = null;
      for (const endpoint of ['https://api.anthropic.com/v1/messages', '/api/claude']) {
        try {
          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
          });
          if (!resp.ok) continue;
          const data = await resp.json();
          txt = data.content?.find(b => b.type === 'text')?.text;
          if (txt) break;
        } catch { continue; }
      }
      if (txt) setReport(txt);
      else setError('AI coaching requires an Anthropic API key. Add ANTHROPIC_API_KEY to your Vercel environment variables.');
    } catch (e) {
      setError('Could not connect to coaching engine. Check your network and try again.');
    }
    setLoading(false);
  };

  if (!lastSession) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
        <p style={{ fontSize: 14 }}>Complete a recording session to generate your coaching report.</p>
      </div>
    );
  }

  const s = lastSession;
  const isInterpreter = s.scenarioId === 'interpreter-handoff' || s.scenarioId === 'interpreter-difficult';

  return (
    <div>
      <SectionLabel>Session summary</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Confidence', val: s.conf },
          { label: 'Fluency', val: s.fluency },
          { label: 'Stress', val: s.stressIndex },
          { label: 'Pace', val: s.pace > 0 ? `${s.pace}` : '--' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: typeof c.val === 'number' ? getScoreColor(c.val) : 'var(--text-primary)' }}>{c.val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {(isInterpreter || s.scenario?.includes('interpreter') || s.scenario?.includes('Interpreter')) && s.conf != null && (
        <>
          <SectionLabel>Interpreter readiness rating</SectionLabel>
          <ReadinessLevel score={s.overallScore || s.conf} />
        </>
      )}

      <SectionLabel>Coaching report</SectionLabel>
      <Card style={{ marginBottom: 14, minHeight: 80 }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
            <Spinner /> Generating your personalized coaching report...
          </div>
        )}
        {error && <p style={{ fontSize: 13, color: '#E24B4A' }}>{error}</p>}
        {report && (
          <div style={{ fontSize: 13, lineHeight: 1.85, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{report}</div>
        )}
        {!loading && !report && !error && (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Click below to generate your AI coaching report based on this session.</p>
        )}
      </Card>

      <button
        onClick={generateReport}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px',
          background: loading ? 'var(--bg-muted)' : 'var(--text-primary)',
          color: loading ? 'var(--text-secondary)' : '#fff',
          border: 'none', borderRadius: 'var(--radius-md)',
          fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {loading && <Spinner />}
        {report ? 'Regenerate report' : 'Generate coaching report'}
      </button>

      {s.transcript && (
        <>
          <SectionLabel>Session transcript</SectionLabel>
          <div style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', padding: '12px 14px', maxHeight: 160, overflowY: 'auto' }}>
            <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{s.transcript}</p>
          </div>
        </>
      )}
    </div>
  );
}
