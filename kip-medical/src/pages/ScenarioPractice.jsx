import { useState } from 'react';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { computeNLP, getScoreColor } from '../utils/audio';
import { SCENARIOS } from '../data/scenarios';
import { RubricBar, TranscriptBox, SectionLabel, RecordButton, Card, Badge } from '../components/UI';

const CATEGORY_COLORS = {
  'Healthcare': { color: '#085041', bg: '#e1f5ee' },
  'Language Services': { color: '#0c447c', bg: '#e6f1fb' },
  'Leadership': { color: '#3C3489', bg: '#eeedfe' },
};

function computeRubricScores(scores, nlp, scenario) {
  if (!scores) return {};
  const pace = scores.pace > 110 && scores.pace < 170 ? 90 : scores.pace > 80 && scores.pace < 200 ? 72 : scores.pace > 0 ? 50 : 0;
  const fillerPenalty = nlp ? Math.max(0, 100 - nlp.fillerCount * 9) : 0;
  const composure = Math.round(Math.max(0, 100 - scores.stressIndex));
  const assertiveness = Math.round(Math.min(100, scores.conf + 10));
  const empathy = Math.round(Math.max(0, 100 - scores.pvScore * 0.4 - scores.hiScore * 0.3));
  const efficiency = Math.round(scores.pace > 120 && scores.pace < 180 ? 90 : 65);
  const clarity = Math.round(Math.min(100, (nlp?.ttr ?? 50) * 0.5 + scores.conf * 0.5));
  const neutrality = Math.round(Math.max(0, 90 - scores.stressIndex * 0.4));

  return { pace, confidence: scores.conf, composure, fillers: fillerPenalty, empathy, clarity, assertiveness, efficiency, neutrality, calm: composure };
}

export default function ScenarioPractice({ onSessionEnd }) {
  const [chosen, setChosen] = useState(0);
  const { scores, isRecording, start, stop, canvasRef } = useAudioAnalyzer();
  const { transcript, supported, start: startSR, stop: stopSR, reset: resetSR } = useSpeechRecognition();
  const [finalScores, setFinalScores] = useState(null);
  const [finalTranscript, setFinalTranscript] = useState('');

  const scenario = SCENARIOS[chosen];
  const nlp = computeNLP(isRecording ? transcript : finalTranscript);
  const rubricScores = computeRubricScores(isRecording ? scores : finalScores, nlp, scenario);

  const catStyle = CATEGORY_COLORS[scenario.category] || {};

  const handleToggle = async () => {
    if (!isRecording) {
      resetSR();
      setFinalScores(null);
      setFinalTranscript('');
      const ok = await start();
      if (!ok) return alert('Microphone access denied.');
      startSR();
    } else {
      const ft = stopSR();
      stop();
      setFinalTranscript(ft);
      setFinalScores(scores);
      const overallScore = scenario.rubric.reduce((acc, r) => acc + (rubricScores[r.id] || 0) * r.weight, 0);
      if (onSessionEnd) {
        onSessionEnd({
          ...scores,
          transcript: ft,
          nlp: computeNLP(ft),
          type: 'Scenario',
          scenario: scenario.title,
          scenarioId: scenario.id,
          overallScore: Math.round(overallScore),
          rubricScores,
        });
      }
    }
  };

  const groups = [...new Set(SCENARIOS.map(s => s.category))];

  return (
    <div>
      {groups.map(group => (
        <div key={group}>
          <SectionLabel>{group}</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10, marginBottom: 12 }}>
            {SCENARIOS.filter(s => s.category === group).map((s, gi) => {
              const idx = SCENARIOS.indexOf(s);
              const cat = CATEGORY_COLORS[s.category] || {};
              return (
                <div
                  key={s.id}
                  onClick={() => !isRecording && setChosen(idx)}
                  style={{
                    background: 'var(--bg-surface)', border: `${chosen === idx ? '1.5px solid ' + s.color : '0.5px solid var(--border-light)'}`,
                    borderRadius: 'var(--radius-lg)', padding: '13px 15px', cursor: isRecording ? 'default' : 'pointer',
                    transition: 'border-color 0.15s', opacity: isRecording && chosen !== idx ? 0.5 : 1,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{s.description}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge label={s.category} color={cat.color} bg={cat.bg} />
                    <Badge label={s.difficulty} color={s.difficulty === 'Advanced' ? '#712B13' : '#444441'} bg={s.difficulty === 'Advanced' ? '#faece7' : '#f1efea'} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <SectionLabel>Script prompt</SectionLabel>
      <Card style={{ marginBottom: '1.25rem', background: 'var(--bg-muted)', border: 'none' }}>
        <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', lineHeight: 1.8, color: 'var(--text-primary)' }}>{scenario.script}</p>
      </Card>

      <div style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', padding: '10px 12px', marginBottom: '1.25rem' }}>
        <canvas ref={canvasRef} width={640} height={44} style={{ width: '100%', height: 44, display: 'block' }} />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <RecordButton isRecording={isRecording} onToggle={handleToggle} />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {isRecording ? `Practicing: ${scenario.title}` : finalScores ? 'Session complete. Select a scenario or try again.' : 'Select a scenario above, then record'}
        </span>
      </div>

      <SectionLabel>Live transcript</SectionLabel>
      <TranscriptBox text={isRecording ? transcript : finalTranscript} placeholder="Your speech will appear here..." />

      <SectionLabel>Scenario rubric</SectionLabel>
      <Card>
        {scenario.rubric.map(r => (
          <RubricBar key={r.id} label={r.label} value={rubricScores[r.id] || 0} />
        ))}
        {finalScores && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Weighted overall score</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: getScoreColor(Math.round(scenario.rubric.reduce((acc, r) => acc + (rubricScores[r.id] || 0) * r.weight, 0))) }}>
              {Math.round(scenario.rubric.reduce((acc, r) => acc + (rubricScores[r.id] || 0) * r.weight, 0))}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}
