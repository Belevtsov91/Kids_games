import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { GameManifest } from '@ig/sdk';
import { games } from '@/catalog/catalog';
import { useAuth } from '@/auth/AuthContext';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitch } from '@/i18n/LanguageSwitch';
import { DashSky } from '@/dashboard/DashSky';
import { FeaturedPortal, GamePortal } from '@/dashboard/Portal';
import { ProfileMenu } from '@/dashboard/ProfileMenu';
import { lastGame } from '@/dashboard/lastPlayed';
import { useKidStatus } from '@/kid/KidStatus';
import { KidTimer } from '@/kid/KidTimer';
import { isToddler } from '@/kid/toddler';
import { useMoreText } from '@/more/text';

type Filter = 'all' | GameManifest['kind'];
const FILTERS: Filter[] = ['all', '3d', '2d'];

/**
 * Дашборд в стиле стартовой страницы: закатное небо, облака и игры-порталы с обложками.
 * Сверху игры по возрасту выбранного ребёнка, ниже — все остальные «за облаками».
 * Прятать игры совсем нельзя: в каталоге 20 игр, а ребёнку 13–15 лет по возрасту подходят только 4.
 */
export function MenuPage() {
  const { activeChild, logout } = useAuth();
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const m = t.menu;
  const toddler = isToddler(activeChild);
  const more = useMoreText();

  const { status } = useKidStatus();
  const access = status?.access ?? {};
  const age = activeChild?.age;
  // Взрослый может закрыть игру (её не видно) или поднять игру не по возрасту в «Твои миры».
  const visible = games.filter((g) => access[g.id] !== false);
  const fits = (g: GameManifest) => access[g.id] === true || age === undefined || (g.ages.min <= age && age <= g.ages.max);
  const available = visible.filter(fits);
  const others = visible.filter((g) => !fits(g));
  const shown = available.filter((g) => filter === 'all' || g.kind === filter);

  const lastId = activeChild && lastGame(activeChild.id);
  const last = visible.find((g) => g.id === lastId);
  const featured = last ?? available[0] ?? visible[0];
  const play = (g: GameManifest) => navigate(`/play/${g.id}`);

  return (
    <div className="dash">
      <DashSky />
      <header className="dash-top dash-wrap">
        <Link to="/" className="dash-logo" aria-label={t.common.home}>
          <span className="dash-logo-mark" aria-hidden="true">🐻</span>
          <span className="dash-logo-name">Interact Games</span>
        </Link>
        {/* Малышу не нужны кнопки, которые выкидывают из сайта: язык и выход — у взрослого в кабинете. */}
        {!toddler && <LanguageSwitch className="dash-lang" />}
        <KidTimer />
        <ProfileMenu />
        {!toddler && (
          <button type="button" className="dash-chip dash-logout" onClick={() => void logout()}>
            {t.common.logout}
          </button>
        )}
      </header>

      <main>
        {activeChild?.birthday && <p className="dash-birthday">{more.birthday(activeChild.name)}</p>}
        <section className="dash-hero dash-wrap">
          <div className="dash-hero-copy">
            <span className="dash-eyebrow">{m.count(available.length)}</span>
            <h1>
              <span className="dash-hl">{m.hello(activeChild?.name ?? '')}</span> {m.title}
            </h1>
            {featured && <p className="dash-lead">{last ? m.last(gameTitle(last, locale)) : m.first(gameTitle(featured, locale))}</p>}
            <div className="dash-actions">
              {featured && (
                <button type="button" className="dash-btn dash-btn-primary" onClick={() => play(featured)}>
                  ▶ {last ? m.continue : m.startHere}
                </button>
              )}
              <a href="#mine" className="dash-btn dash-btn-ghost">{m.allMine}</a>
            </div>
          </div>
          {featured && <FeaturedPortal game={featured} label={last ? m.continue : m.startHere} onPlay={() => play(featured)} />}
        </section>

        <section className="dash-shelf dash-wrap" id="mine" aria-label={m.mine}>
          <div className="dash-shelf-head">
            <h2>{m.mine}</h2>
            <div className="dash-filters" role="group" aria-label={m.filter.label}>
              {FILTERS.map((f) => (
                <button key={f} type="button" aria-pressed={f === filter} onClick={() => setFilter(f)}>
                  {m.filter[f]}
                </button>
              ))}
            </div>
          </div>
          {shown.length === 0 && <p className="dash-empty">{m.empty}</p>}
          <div className="dash-grid" data-testid="menu-fits">
            {shown.map((game, i) => (
              <GamePortal key={game.id} game={game} delay={-i * 1.3} />
            ))}
          </div>
        </section>

        {others.length > 0 && (
          <section className="dash-shelf dash-mist dash-wrap" aria-label={m.others}>
            <div className="dash-shelf-head">
              <h2>{m.others}</h2>
              <p>{m.othersText}</p>
            </div>
            <div className="dash-grid" data-testid="menu-others">
              {others.map((game, i) => (
                <GamePortal key={game.id} game={game} delay={-i * 1.7} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
