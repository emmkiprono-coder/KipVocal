import { getScoreColor, getStressColor } from '../utils/audio';

export function ScoreRing({ value, label, color, size = 90 }) {
  const R = size * 0.4;
  const C = 2 * Math.PI * R;
  const offset = value != null ? C - (value / 100) * C : C;
  const displayColor = color || getScoreColor(value ?? 0);
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" strokeWidth="6" stroke="var(--bg-muted)" />
        <circle
          cx={size/2} cy={size/2} r={R} fill="none" strokeWidth="6"
          stroke={value != null ? displayColor : '#d0cec9'}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.4s' }}
        />
        <text
          x={size/2} y={size/2 + 6}
          textAnchor="middle"
          fontSize={size * 0.22}
          fontWeight="500"
          fill="var(--text-primary)"
          fontFamily="'DM Mono', monospace"
        >
          {value != null ? Math.round(value) : '--'}
        </text>
      </svg>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export function MetricCard({ label, value, unit, pct, color }) {
  return (
    <div style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
      <div>
        <span style={{ fontSize: 20, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{value ?? '--'}</span>
        {unit && <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 2 }}>{unit}</span>}
      </div>
      <div style={{ height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, Math.round(pct || 0))}%`, background: color || 'var(--green)', borderRadius: 2, transition: 'width 0.35s ease' }} />
      </div>
    </div>
  );
}

export function StressBar({ label, value }) {
  const pct = Math.min(100, Math.round(value || 0));
  const color = getStressColor(pct);
  const lbl = pct < 30 ? 'low' : pct < 60 ? 'moderate' : 'elevated';
  return (
    <div style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
      <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-mono)', minWidth: 30 }}>{pct}</div>
        <div style={{ flex: 1, height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.35s ease' }} />
        </div>
        <div style={{ fontSize: 10, color, minWidth: 48, textAlign: 'right', fontWeight: 500 }}>{lbl}</div>
      </div>
    </div>
  );
}

export function RubricBar({ label, value }) {
  const pct = Math.min(100, Math.round(value || 0));
  const color = getScoreColor(pct);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '0.5px solid var(--border-light)' }}>
      <div style={{ fontSize: 13, minWidth: 170, color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ flex: 1, height: 5, background: 'var(--bg-muted)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', minWidth: 28, textAlign: 'right' }}>{pct}</div>
    </div>
  );
}

export function TranscriptBox({ text, placeholder }) {
  return (
    <div style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', padding: '12px 14px', minHeight: 64 }}>
      <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: text ? 'var(--text-primary)' : 'var(--text-tertiary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {text || placeholder || 'Transcript will appear here...'}
      </p>
    </div>
  );
}

export function NLPRow({ wordCount, wc, ttr, fillerCount, fc, avgWordLen, awl }) {
  wordCount = wordCount ?? wc ?? 0;
  fillerCount = fillerCount ?? fc ?? 0;
  avgWordLen = avgWordLen ?? awl ?? null;
  const cells = [
    { label: 'Words', val: wordCount ?? 0 },
    { label: 'Vocab diversity', val: ttr != null ? `${ttr}%` : '--' },
    { label: 'Fillers', val: fillerCount ?? 0 },
    { label: 'Avg word len', val: avgWordLen ?? '--' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
      {cells.map(c => (
        <div key={c.label} style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{c.val}</div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8, marginTop: 16 }}>
      {children}
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', boxShadow: 'var(--shadow-sm)', ...style }}>
      {children}
    </div>
  );
}

export function RecordButton({ isRecording, onToggle, disabled }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px',
        background: isRecording ? '#fff8f8' : 'var(--bg-surface)',
        border: `0.5px solid ${isRecording ? '#E24B4A' : 'var(--border-mid)'}`,
        borderRadius: 'var(--radius-md)',
        fontSize: 13, fontWeight: 500,
        color: isRecording ? '#E24B4A' : 'var(--text-primary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
    >
      {isRecording
        ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E24B4A', animation: 'blink 1s ease-in-out infinite', flexShrink: 0 }} />
        : <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E24B4A', flexShrink: 0 }} />
      }
      {isRecording ? 'Stop recording' : 'Start recording'}
    </button>
  );
}

export function Badge({ label, color, bg }) {
  return (
    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 10, background: bg || 'var(--bg-muted)', color: color || 'var(--text-secondary)' }}>
      {label}
    </span>
  );
}

export function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: 14, height: 14, border: '1.5px solid var(--border-mid)', borderTopColor: 'var(--text-secondary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
  );
}
