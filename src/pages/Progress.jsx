import { useRef, useEffect } from 'react';
import { getScoreColor } from '../utils/audio';
import { SectionLabel, Card, Badge } from '../components/UI';
import { INTERPRETER_READINESS_LEVELS } from '../data/scenarios';

function TrendChart({ sessions }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sessions.length < 2) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const data = [...sessions].reverse();
    const pad = { l: 36, r: 16, t: 16, b: 24 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.5;
    [0, 25, 50, 75, 100].forEach(v => {
      const y = pad.t + chartH - (v / 100) * chartH;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.font = '9px DM Mono, monospace';
      ctx.textAlign = 'right'; ctx.fillText(v, pad.l - 4, y + 3);
    });

    // Confidence line
    const pts = data.map((s, i) => ({
      x: pad.l + (i / (data.length - 1)) * chartW,
      y: pad.t + chartH - (s.conf / 100) * chartH,
    }));
    ctx.strokeStyle = '#1D9E75'; ctx.lineWidth = 2; ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    pts.forEach(p => {
      ctx.fillStyle = '#1D9E75'; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    });

    // Fluency line
    const pts2 = data.map((s, i) => ({
      x: pad.l + (i / (data.length - 1)) * chartW,
      y: pad.t + chartH - ((s.fluency || 0) / 100) * chartH,
    }));
    ctx.strokeStyle = '#378ADD'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath();
    pts2.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke(); ctx.setLineDash([]);

    // X labels
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.font = '9px DM Mono, monospace'; ctx.textAlign = 'center';
    data.forEach((s, i) => {
      const x = pad.l + (i / (data.length - 1)) * chartW;
      ctx.fillText(s.time || `S${i+1}`, x, H - 4);
    });
  }, [sessions]);

  if (sessions.length < 2) return <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem' }}>Record at least 2 sessions to see your trend.</p>;

  return (
    <div>
      <canvas ref={canvasRef} width={640} height={160} style={{ width: '100%', height: 160, display: 'block' }} />
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
          <span style={{ width: 16, height: 2, background: '#1D9E75', display: 'inline-block' }} /> Confidence
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
          <span style={{ width: 16, height: 0, borderTop: '2px dashed #378ADD', display: 'inline-block' }} /> Fluency
        </span>
      </div>
    </div>
  );
}

export default function Progress({ sessions, onClear }) {
  if (!sessions.length) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
        <p style={{ fontSize: 14 }}>No sessions recorded yet. Complete a live or scenario session to track your progress.</p>
      </div>
    );
  }

  const avgConf = Math.round(sessions.reduce((a, b) => a + b.conf, 0) / sessions.length);
  const bestConf = Math.max(...sessions.map(s => s.conf));
  const avgFluency = Math.round(sessions.reduce((a, b) => a + (b.fluency || 0), 0) / sessions.length);
  const totalSessions = sessions.length;
  const scenarioSessions = sessions.filter(s => s.type === 'Scenario');

  const readinessLevel = INTERPRETER_READINESS_LEVELS.find(l => avgConf >= l.min && avgConf <= l.max) || INTERPRETER_READINESS_LEVELS[0];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Sessions', val: totalSessions, color: 'var(--text-primary)' },
          { label: 'Avg confidence', val: avgConf, color: getScoreColor(avgConf) },
          { label: 'Best session', val: bestConf, color: getScoreColor(bestConf) },
          { label: 'Avg fluency', val: avgFluency, color: getScoreColor(avgFluency) },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: c.color }}>{c.val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {scenarioSessions.length > 0 && (
        <>
          <SectionLabel>Interpreter readiness (avg)</SectionLabel>
          <div style={{ background: readinessLevel.bg, borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: readinessLevel.color }}>{readinessLevel.label}</span>
              <span style={{ fontSize: 11, color: readinessLevel.color, maxWidth: '60%', textAlign: 'right' }}>{readinessLevel.description}</span>
            </div>
          </div>
        </>
      )}

      <SectionLabel>Confidence and fluency trend</SectionLabel>
      <Card style={{ marginBottom: 16 }}>
        <TrendChart sessions={sessions} />
      </Card>

      <SectionLabel>Session history</SectionLabel>
      <Card>
        {sessions.map((s, i) => (
          <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < sessions.length - 1 ? '0.5px solid var(--border-light)' : 'none', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', minWidth: 52 }}>{s.time}</span>
            <span style={{ fontSize: 10, background: s.type === 'Scenario' ? '#e6f1fb' : 'var(--bg-muted)', color: s.type === 'Scenario' ? '#0c447c' : 'var(--text-secondary)', padding: '2px 8px', borderRadius: 10, fontWeight: 500, whiteSpace: 'nowrap' }}>
              {s.scenario || s.type}
            </span>
            <div style={{ flex: 1, minWidth: 60, height: 4, background: 'var(--bg-muted)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${s.conf}%`, background: getScoreColor(s.conf), borderRadius: 2 }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: getScoreColor(s.conf), minWidth: 24, textAlign: 'right' }}>{s.conf}</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', minWidth: 56, textAlign: 'right' }}>stress {s.stressIndex}</span>
          </div>
        ))}
      </Card>

      <button
        onClick={onClear}
        style={{ marginTop: 16, padding: '7px 16px', background: 'transparent', border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}
      >
        Clear session history
      </button>
    </div>
  );
}
