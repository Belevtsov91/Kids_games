import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { age as ageText } from '@/i18n/plural';
import { Face } from '@/parent/ui/Face';
import { useKidStatus } from '../KidStatus';
import { TimeRing } from '../TimeRing';
import { useKidText } from '../text';
import { KidFrame } from './KidFrame';
import { useMoreText } from '@/more/text';

/** «Мой профиль» ребёнка (/me): открыт без задачи для взрослых. Только смотреть, ничего не менять. */
export function KidHomePage() {
  const { activeChild } = useAuth();
  const { status } = useKidStatus();
  const { locale } = useI18n();
  const k = useKidText();
  const st = useMoreText().stickers.tile;
  if (!activeChild) return null;
  const time = status?.time;

  return (
    <KidFrame>
      <section className="kid-hero">
        <Face photo={activeChild.photo} avatar={activeChild.avatar} size={132} className="kid-hero-face" />
        <div className="kid-hero-copy">
          <span className="dash-eyebrow">{k.me.title} · {ageText(locale, activeChild.age)}</span>
          <h1>
            <span className="dash-hl">{k.me.hello(activeChild.name)}</span>
          </h1>
          <p className="dash-lead">{k.me.lead}</p>
        </div>
        {time && (
          <div className="kid-hero-time">
            <TimeRing time={time} size={150} />
            <strong>{k.me.today}</strong>
            <span>{time.limit === null ? `${k.me.noLimit} · ${k.me.played(k.hm(time.usedMinutes))}` : k.me.of(time.usedMinutes, time.limit)}</span>
          </div>
        )}
      </section>

      <nav className="kid-tiles" aria-label={k.me.title}>
        <Link to="/me/time" className="kid-tile kid-tile-time">
          <span className="kid-tile-icon" aria-hidden="true">⏳</span>
          <strong>{k.me.tiles.time.title}</strong>
          <span>{k.me.tiles.time.text}</span>
          <span className="kid-tile-go" aria-hidden="true">→</span>
        </Link>
        <Link to="/me/progress" className="kid-tile kid-tile-progress">
          <span className="kid-tile-icon" aria-hidden="true">🏆</span>
          <strong>{k.me.tiles.progress.title}</strong>
          <span>{k.me.tiles.progress.text}</span>
          <span className="kid-tile-go" aria-hidden="true">→</span>
        </Link>
        <Link to="/me/stickers" className="kid-tile kid-tile-stickers">
          <span className="kid-tile-icon" aria-hidden="true">⭐</span>
          <strong>{st.title}</strong>
          <span>{st.text}</span>
          <span className="kid-tile-go" aria-hidden="true">→</span>
        </Link>
        <Link to="/dashboard" className="kid-tile kid-tile-play">
          <span className="kid-tile-icon" aria-hidden="true">🎮</span>
          <strong>{k.me.back}</strong>
          <span>Interact Games</span>
          <span className="kid-tile-go" aria-hidden="true">→</span>
        </Link>
      </nav>

      <p className="kid-parents-link">
        <Link to="/parent">🔒 {k.me.parents}</Link>
      </p>
    </KidFrame>
  );
}
