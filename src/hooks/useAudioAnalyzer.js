import { useRef, useState, useCallback } from 'react';
import { autoCorrelate, computeAllScores } from '../utils/audio';

export function useAudioAnalyzer() {
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const srcRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const canvasRef = useRef(null);

  // All mutable state in a single ref so tick always has fresh values
  const S = useRef({
    volBuf: [], pitchBuf: [], windowRates: [],
    windowStart: null, windowSyl: 0,
    syllables: 0, speechStart: null,
    pauseCount: 0, lastWasSilent: false,
    energyDrops: 0, prevVol: null,
  });

  const [scores, setScores] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const drawWave = (data, n) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#378ADD';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const sw = W / n;
    for (let i = 0; i < n; i++) {
      const v = data[i] / 128;
      const y = v * H / 2;
      i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * sw, y);
    }
    ctx.stroke();
  };

  const tick = useCallback(() => {
    rafRef.current = requestAnimationFrame(tick);
    const analyser = analyserRef.current;
    if (!analyser || !audioCtxRef.current) return;
    const s = S.current;
    const bufLen = analyser.fftSize;
    const td = new Float32Array(bufLen);
    const bt = new Uint8Array(bufLen);
    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getFloatTimeDomainData(td);
    analyser.getByteTimeDomainData(bt);
    analyser.getByteFrequencyData(freqData);
    drawWave(bt, bufLen);

    let rms = 0;
    for (let i = 0; i < td.length; i++) rms += td[i] * td[i];
    rms = Math.sqrt(rms / td.length);
    const volDb = rms > 0.0001 ? 20 * Math.log10(rms) : -80;
    const pitch = autoCorrelate(td, audioCtxRef.current.sampleRate);
    const isSpeech = volDb > -42;

    s.volBuf.push(volDb);
    if (s.volBuf.length > 80) s.volBuf.shift();
    if (pitch > 60 && pitch < 500) {
      s.pitchBuf.push(pitch);
      if (s.pitchBuf.length > 80) s.pitchBuf.shift();
    }

    if (isSpeech) {
      if (!s.speechStart) s.speechStart = Date.now();
      s.syllables += 0.025;
      if (!s.windowStart) { s.windowStart = Date.now(); s.windowSyl = 0; }
      s.windowSyl += 0.025;
      if (Date.now() - s.windowStart > 5000) {
        const wr = s.windowSyl / ((Date.now() - s.windowStart) / 60000) / 1.5;
        s.windowRates.push(wr);
        if (s.windowRates.length > 8) s.windowRates.shift();
        s.windowStart = Date.now();
        s.windowSyl = 0;
      }
      if (s.lastWasSilent) { s.pauseCount++; s.lastWasSilent = false; }
      if (s.prevVol !== null && s.prevVol - volDb > 8) s.energyDrops++;
    } else {
      if (!s.lastWasSilent) s.lastWasSilent = true;
    }
    s.prevVol = volDb;

    const computed = computeAllScores({ ...s, freqData });
    setScores(computed);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);
      srcRef.current = src;
      // Reset state
      S.current = {
        volBuf: [], pitchBuf: [], windowRates: [],
        windowStart: null, windowSyl: 0,
        syllables: 0, speechStart: null,
        pauseCount: 0, lastWasSilent: false,
        energyDrops: 0, prevVol: null,
      };
      setScores(null);
      setIsRecording(true);
      tick();
      return true;
    } catch {
      return false;
    }
  }, [tick]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    try { if (srcRef.current) srcRef.current.disconnect(); } catch {}
    try { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); } catch {}
    try { if (audioCtxRef.current) audioCtxRef.current.close(); } catch {}
    audioCtxRef.current = null;
    analyserRef.current = null;
    setIsRecording(false);
    return { ...S.current };
  }, []);

  const reset = useCallback(() => {
    S.current = {
      volBuf: [], pitchBuf: [], windowRates: [],
      windowStart: null, windowSyl: 0,
      syllables: 0, speechStart: null,
      pauseCount: 0, lastWasSilent: false,
      energyDrops: 0, prevVol: null,
    };
    setScores(null);
  }, []);

  return { scores, isRecording, start, stop, reset, canvasRef };
}
