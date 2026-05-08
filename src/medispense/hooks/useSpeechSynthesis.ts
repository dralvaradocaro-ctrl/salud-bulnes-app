import { useState, useEffect, useCallback, useRef } from 'react';

export type SpeechSpeed = 'slow' | 'normal' | 'fast';
export type SpeechStatus = 'idle' | 'speaking' | 'paused';

const SPEED_RATES: Record<SpeechSpeed, number> = {
  slow: 0.7,
  normal: 1.0,
  fast: 1.4,
};

export interface SpeechSection {
  id: string;
  label: string;
  text: string;
}

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [speed, setSpeed] = useState<SpeechSpeed>('normal');
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const sectionsRef = useRef<SpeechSection[]>([]);
  const sectionIndexRef = useRef(0);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    setIsSupported(supported);
    if (!supported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer es-CL, then any es-* voice
      const esCL = voices.find(v => v.lang === 'es-CL');
      const esAny = voices.find(v => v.lang.startsWith('es'));
      voiceRef.current = esCL || esAny || null;
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakSection = useCallback((index: number) => {
    const sections = sectionsRef.current;
    if (index >= sections.length) {
      setStatus('idle');
      setCurrentSectionId(null);
      return;
    }

    const section = sections[index];
    sectionIndexRef.current = index;
    setCurrentSectionId(section.id);

    const utterance = new SpeechSynthesisUtterance(section.text);
    utterance.lang = 'es-CL';
    utterance.rate = SPEED_RATES[speed];
    utterance.pitch = 1;
    utterance.volume = 1;
    if (voiceRef.current) utterance.voice = voiceRef.current;

    utterance.onend = () => {
      speakSection(index + 1);
    };
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        speakSection(index + 1);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [speed]);

  const speak = useCallback((sections: SpeechSection[]) => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    sectionsRef.current = sections.filter(s => s.text.trim().length > 0);
    setStatus('speaking');
    speakSection(0);
  }, [isSupported, speakSection]);

  const speakSingle = useCallback((section: SpeechSection) => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    sectionsRef.current = [section];
    setStatus('speaking');
    speakSection(0);
  }, [isSupported, speakSection]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setStatus('paused');
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
    setStatus('speaking');
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setStatus('idle');
    setCurrentSectionId(null);
  }, [isSupported]);

  return {
    isSupported,
    status,
    speed,
    setSpeed,
    currentSectionId,
    speak,
    speakSingle,
    pause,
    resume,
    stop,
  };
}
