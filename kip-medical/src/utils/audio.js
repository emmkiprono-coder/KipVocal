export function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  const half = Math.floor(SIZE / 2);
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let best = -1, bestCorr = 0, lastCorr = 1, found = false;
  for (let off = 0; off < half; off++) {
    let c = 0;
    for (let i = 0; i < half; i++) c += Math.abs(buffer[i] - buffer[i + off]);
    c = 1 - c / half;
    if (c > 0.9 && c > lastCorr) { found = true; bestCorr = c; best = off; }
    else if (found) break;
    lastCorr = c;
  }
  if (best === -1) return -1;

  const sh = Math.max(0, best - 1), sh2 = Math.min(half - 1, best + 1);
  let y1 = 0, y2 = 0;
  for (let i = 0; i < half; i++) {
    y1 += Math.abs(buffer[i] - buffer[i + sh]);
    y2 += Math.abs(buffer[i] - buffer[i + sh2]);
  }
  y1 = 1 - y1 / half; y2 = 1 - y2 / half;
  const shift = (y2 - y1) / (2 * (2 * bestCorr - y1 - y2));
  return sampleRate / (best + shift);
}

export function computeNLP(text) {
  const clean = (text || '').toLowerCase().replace(/[^a-z\s']/g, '');
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  const fillerList = ['um','uh','like','you know','basically','literally','right','so','well','actually','i mean','kind of','sort of','just','really'];
  let fillerCount = 0;
  fillerList.forEach(f => {
    const re = new RegExp(`\\b${f}\\b`, 'gi');
    const m = text.match(re);
    if (m) fillerCount += m.length;
  });
  const unique = new Set(words);
  const ttr = words.length > 5 ? Math.round((unique.size / words.length) * 100) : null;
  const awl = words.length > 0 ? +(words.reduce((s, w) => s + w.length, 0) / words.length).toFixed(1) : null;
  const sentences = (text || '').split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentLen = sentences.length > 0 ? Math.round(words.length / sentences.length) : null;
  // Expose both naming conventions for compatibility
  return { wordCount: words.length, wc: words.length, ttr, fillerCount, fc: fillerCount, avgWordLen: awl, awl, sentenceCount: sentences.length, avgSentLen };
}

export function getScoreColor(v) {
  if (v >= 70) return '#1D9E75';
  if (v >= 50) return '#EF9F27';
  return '#E24B4A';
}

export function getStressColor(v) {
  if (v < 30) return '#1D9E75';
  if (v < 60) return '#EF9F27';
  return '#E24B4A';
}

export function getStressLabel(v) {
  if (v < 30) return 'low';
  if (v < 60) return 'moderate';
  return 'elevated';
}

export function computeAllScores({ volBuf, pitchBuf, windowRates, syllables, speechStart, pauseCount, energyDrops, freqData }) {
  const avgVol = volBuf.length ? volBuf.reduce((a, b) => a + b, 0) / volBuf.length : -60;
  const validPitch = pitchBuf.filter(p => p > 0);
  const avgPitch = validPitch.length ? validPitch.reduce((a, b) => a + b, 0) / validPitch.length : 0;
  const elapsedMin = speechStart ? (Date.now() - speechStart) / 60000 : 0;
  const pace = elapsedMin > 0.05 ? Math.round(syllables / elapsedMin / 1.5) : 0;

  const recent = validPitch.slice(-20);
  const pitchVolat = recent.length > 2
    ? Math.sqrt(recent.reduce((s, p) => s + Math.pow(p - avgPitch, 2), 0) / recent.length)
    : 0;

  const hesitRate = elapsedMin > 0.1 ? Math.round(pauseCount / elapsedMin) : 0;
  const rateInconsist = windowRates.length > 2
    ? Math.sqrt(windowRates.reduce((s, r) => {
        const m = windowRates.reduce((a, b) => a + b, 0) / windowRates.length;
        return s + Math.pow(r - m, 2);
      }, 0) / windowRates.length)
    : 0;

  const highFreqSlice = freqData ? Array.from(freqData.slice(Math.floor(freqData.length * 0.6))) : [];
  const tension = highFreqSlice.length
    ? Math.min(100, (highFreqSlice.reduce((a, b) => a + b, 0) / highFreqSlice.length) * 1.2)
    : 0;

  const pvScore = Math.min(100, pitchVolat * 1.5);
  const hiScore = Math.min(100, hesitRate * 6);
  const riScore = Math.min(100, rateInconsist * 1.2);
  const edScore = Math.min(100, energyDrops * 2);

  const stressIndex = Math.round((pvScore + hiScore + riScore + edScore + tension) / 5);
  const loadScore = Math.round(pvScore * 0.3 + hiScore * 0.3 + riScore * 0.2 + tension * 0.2);
  const fluency = Math.round(Math.max(0, Math.min(100, 100 - (pvScore * 0.3 + hiScore * 0.3 + edScore * 0.2 + riScore * 0.2))));

  let conf = 50;
  if (avgVol > -30 && avgVol < -5) conf += 15;
  else if (avgVol <= -30) conf -= 15;
  if (avgPitch > 85 && avgPitch < 260) conf += 10;
  if (pace > 110 && pace < 170) conf += 20;
  else if (pace > 80 && pace < 200) conf += 10;
  conf -= stressIndex * 0.15;
  conf = Math.round(Math.max(0, Math.min(100, conf)));

  return { conf, fluency, loadScore, stressIndex, avgVol, avgPitch, pace, pvScore, hiScore, riScore, edScore, tension, hesitRate };
}
