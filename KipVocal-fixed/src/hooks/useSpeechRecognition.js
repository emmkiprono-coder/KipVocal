import { useRef, useState, useCallback } from 'react';

export function useSpeechRecognition() {
  const recRef = useRef(null);
  const fullRef = useRef('');
  const [transcript, setTranscript] = useState('');
  const [supported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));

  const start = useCallback(() => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      if (final) fullRef.current += final;
      setTranscript((fullRef.current + interim).trim());
    };
    r.onerror = () => {};
    r.start();
    recRef.current = r;
  }, [supported]);

  const stop = useCallback(() => {
    if (recRef.current) {
      try { recRef.current.stop(); } catch {}
      recRef.current = null;
    }
    return fullRef.current;
  }, []);

  const reset = useCallback(() => {
    fullRef.current = '';
    setTranscript('');
  }, []);

  return { transcript, supported, start, stop, reset };
}
