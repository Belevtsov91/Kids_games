import { useEffect, useRef, useState } from 'react';
import { loadVoice, MAX_SECONDS, removeVoice, saveVoice } from './voice';
import { useFamilyText } from './text';

/** Кабинет: записать голосовой привет ребёнку. Запись остаётся в IndexedDB этого устройства. */
export function VoiceRecorder({ childId, toast }: { childId: string; toast: (text: string) => void }) {
  const v = useFamilyText().voice;
  const [blob, setBlob] = useState<Blob | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef(0);
  const supported = typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

  useEffect(() => {
    void loadVoice(childId).then((b) => setBlob(b ?? null));
    return () => {
      clearInterval(timer.current);
      if (rec.current?.state === 'recording') rec.current.stop();
    };
  }, [childId]);

  const start = async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast(v.noMic);
      return;
    }
    const chunks: Blob[] = [];
    const r = new MediaRecorder(stream);
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      clearInterval(timer.current);
      setLeft(null);
      const b = new Blob(chunks, { type: r.mimeType || 'audio/webm' });
      if (!b.size) return;
      void saveVoice(childId, b).then(
        () => (setBlob(b), toast(v.saved)),
        () => toast(v.unsupported),
      );
    };
    rec.current = r;
    r.start();
    setLeft(MAX_SECONDS);
    timer.current = window.setInterval(() => {
      setLeft((s) => {
        if (s !== null && s <= 1) r.state === 'recording' && r.stop();
        return s === null ? null : s - 1;
      });
    }, 1000);
  };

  const play = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    a.onended = () => URL.revokeObjectURL(url);
    void a.play().catch(() => URL.revokeObjectURL(url));
  };

  const remove = async () => {
    await removeVoice(childId);
    setBlob(null);
    toast(v.removed);
  };

  if (!supported) return <p className="pa-empty">{v.unsupported}</p>;
  return (
    <div className="voice-rec">
      {left === null ? (
        <button type="button" className="pa-btn pa-btn-gold" onClick={() => void start()}>{v.record}</button>
      ) : (
        <>
          <button type="button" className="pa-btn pa-btn-gold" onClick={() => rec.current?.stop()}>{v.stop}</button>
          <span className="voice-rec-live">{v.left(left)}</span>
        </>
      )}
      {blob && left === null && (
        <>
          <button type="button" className="pa-btn pa-btn-mint" onClick={play}>{v.play}</button>
          <button type="button" className="pa-btn pa-btn-quiet" onClick={() => void remove()}>{v.remove}</button>
        </>
      )}
    </div>
  );
}
