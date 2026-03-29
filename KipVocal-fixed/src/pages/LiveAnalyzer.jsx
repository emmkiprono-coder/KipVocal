import { useEffect } from 'react';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { computeNLP, getScoreColor } from '../utils/audio';
import {
  ScoreRing, MetricCard, StressBar, TranscriptBox,
  NLPRow, SectionLabel, RecordButton, Card
} from '../components/UI';

export default function LiveAnalyzer({ onSessionEnd }) {
  const { scores, isRecording, start, stop, canvasRef } = useAudioAnalyzer();
  const { transcript, supported, start: startSR, stop: stopSR, reset: resetSR } = useSpeechRecognition();

  const nlp = computeNLP(transcript || '');

  const handleToggle = async () => {
    if (!isRecording) {
      resetSR();
      const ok = await start();
      if (!ok) return alert('Microphone access denied. Please allow mic access and try again.');
      startSR();
    } else {
      const finalTranscript = stopSR();
      stop();
      if (scores && onSessionEnd) {
        onSessionEnd({ ...scores, transcript: finalTranscript, nlp: computeNLP(finalTranscript), type: 'Free recording', scenario: null });
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 8 }}>
        <ScoreRing value={scores?.conf} label="Confidence" />
        <ScoreRing value={scores?.fluency} label="Fluency" color="#378ADD" />
        <ScoreRing value={scores?.loadScore} label="Cog. load" color={scores?.loadScore > 60 ? '#E24B4A' : '#EF9F27'} />
        <ScoreRing value={scores?.stressIndex != null ? 100 - scores.stressIndex : null} label="Composure" color={getScoreColor(scores ? 100 - scores.stressIndex : 0)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10, marginBottom: '1.25rem' }}>
        <MetricCard label="Volume" value={scores ? Math.round(scores.avgVol) : null} unit="dB" pct={scores ? Math.min(100, (scores.avgVol + 60) / 55 * 100) : 0} color="#1D9E75" />
        <MetricCard label="Pitch" value={scores?.avgPitch > 0 ? Math.round(scores.avgPitch) : null} unit="Hz" pct={scores ? (scores.avgPitch / 400) * 100 : 0} color="#378ADD" />
        <MetricCard label="Pace" value={scores?.pace > 0 ? scores.pace : null} unit="wpm" pct={scores ? (scores.pace / 200) * 100 : 0} color="#D85A30" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8, marginBottom: '1.25rem' }}>
        <StressBar label="Pitch volatility" value={scores?.pvScore} />
        <StressBar label="Hesitation index" value={scores?.hiScore} />
        <StressBar label="Rate consistency" value={scores?.riScore} />
        <StressBar label="Vocal tension" value={scores?.tension} />
      </div>

      <div style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', padding: '10px 12px', marginBottom: '1.25rem' }}>
        <canvas ref={canvasRef} width={640} height={52} style={{ width: '100%', height: 52, display: 'block' }} />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <RecordButton isRecording={isRecording} onToggle={handleToggle} />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {isRecording ? 'Recording and analyzing...' : 'Click to begin session'}
        </span>
        {!supported && <span style={{ fontSize: 11, color: '#E24B4A' }}>Speech-to-text not available in this browser (use Chrome/Edge)</span>}
      </div>

      <SectionLabel>Live transcript</SectionLabel>
      <TranscriptBox text={isRecording || transcript ? transcript : ''} placeholder="Start recording to see live transcription..." />

      <SectionLabel>Verbal signals</SectionLabel>
      <NLPRow {...nlp} />

      <Card style={{ marginTop: 16, background: '#faeeda', border: 'none' }}>
        <p style={{ fontSize: 11, color: '#633806', lineHeight: 1.7 }}>
          Stress and cognitive load signals reflect mental effort and arousal, not deception. Verbal fluency and vocabulary scores are proxies for oral language proficiency. All signals should be interpreted with context.
        </p>
      </Card>
    </div>
  );
}
