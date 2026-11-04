import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { doneToday, markToday } from './daily';
import { dayPart, decorOf } from './season';
import { useFamilyText } from './text';
import { loadVoice } from './voice';

const LANG = { ru: 'ru-RU', uk: 'uk-UA', ro: 'ro-RO', en: 'en-GB' } as const;

interface Props {
  childId: string;
  name: string;
  /** Игр в плане и сколько уже сыграно сегодня. */
  plan: number;
  played: number;
  /** Свежая реплика (например, «Ура!» после задания дома) — показать вместо обычной. */
  note?: string;
}

/** Мишка Тёпа на дашборде: здоровается, напоминает про план и сезон, включает голосовой привет взрослого. */
export function Mascot({ childId, name, plan, played, note }: Props) {
  const f = useFamilyText().mascot;
  const { locale } = useI18n();
  const [voice, setVoice] = useState<Blob | null>(null);
  const [heard, setHeard] = useState(() => doneToday('voice', childId));
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let alive = true;
    void loadVoice(childId).then((b) => alive && setVoice(b ?? null));
    return () => {
      alive = false;
      audio.current?.pause();
    };
  }, [childId]);

  const now = new Date();
  const hello = f.name(f.hello[dayPart(now)], name);
  const line =
    note ??
    (voice && !heard ? f.voice : plan > 0 && played >= plan ? f.planDone : plan > 0 ? f.plan(plan) : f.season[decorOf(now)]);

  const speak = () => {
    if (voice) {
      audio.current?.pause();
      const url = URL.createObjectURL(voice);
      const a = new Audio(url);
      a.onended = () => URL.revokeObjectURL(url);
      audio.current = a;
      void a.play().catch(() => URL.revokeObjectURL(url));
      markToday('voice', childId);
      setHeard(true);
      return;
    }
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${hello} ${line}`);
    u.lang = LANG[locale];
    u.rate = 0.95;
    u.pitch = 1.1;
    speechSynthesis.speak(u);
  };

  return (
    <div className="mascot" data-testid="mascot">
      <button type="button" className={`mascot-bear${voice && !heard ? ' has-voice' : ''}`} onClick={speak} aria-label={f.label} title={f.tap}>
        🐻
      </button>
      <p className="mascot-bubble" aria-live="polite">
        <b>{hello}</b> {line}
      </p>
    </div>
  );
}
