// Экраны: выбор маршрута, итог маршрута и карточка страны в атласе.
import cover from '../../assets/cover.webp';
import { COUNTRIES, REGIONS, type CountryId, type Region } from '../game/countries';
import { isOpen, type Progress } from '../game/progress';
import { capitalOf, nameOf, tr } from '../i18n';
import { button, el } from './dom';
import { flagSvg } from './flagSvg';
import { tepa } from './tepa';

const REGION_ICON: Record<Region, string> = { home: '🏡', europe: '🏰', world: '🌏' };

export const starsLine = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);

export const startScreen = (name: string | undefined, p: Progress, onRoute: (r: Region) => void, onAtlas: () => void) => {
  const node = el('section', 'at-start');
  const hero = el('div', 'at-hero');
  const img = el('img', 'at-hero-img');
  img.src = cover;
  img.alt = '';
  const bear = tepa(tr().tepaHello);
  hero.append(img, bear.node);
  const lead = el('h2', 'at-lead', tr().lead(name));
  const routes = el('div', 'at-routes');
  for (const region of REGIONS) {
    const open = isOpen(region, p);
    const card = button(`at-route is-${region}`, '', () => open && onRoute(region));
    card.disabled = !open;
    card.append(
      el('span', 'at-route-icon', open ? REGION_ICON[region] : '🔒'),
      el('span', 'at-route-name', tr().regions[region]),
      el('span', 'at-route-hint', open ? tr().regionHints[region] : tr().locked),
      el('span', 'at-route-stars', starsLine(p.stars[region])),
    );
    routes.append(card);
  }
  const foot = el('div', 'at-start-foot');
  foot.append(button('at-btn at-atlas-btn', tr().atlas, onAtlas), el('span', 'at-visited', tr().visited(p.visited.length, COUNTRIES.length)));
  node.append(hero, lead, routes, foot);
  return node;
};

export const resultScreen = (stars: number, correct: number, total: number, onAgain: () => void, onMap: () => void) => {
  const overlay = el('div', 'at-overlay');
  const card = el('div', 'at-result');
  card.setAttribute('role', 'dialog');
  const again = button('at-btn', tr().again, onAgain);
  const actions = el('div', 'at-actions');
  actions.append(again, button('at-btn at-btn-main', tr().toMap, onMap));
  card.append(
    el('div', 'at-result-balloon', '🎈'),
    el('h2', 'at-result-title', tr().resultTitle(stars)),
    el('div', 'at-result-stars', starsLine(stars)),
    el('p', 'at-result-text', tr().result(correct, total)),
    actions,
  );
  overlay.append(card);
  return { overlay, focus: () => again.focus({ preventScroll: true }) };
};

/** Карточка страны в атласе: флаг, название и столица. */
export const countryCard = () => {
  const node = el('div', 'at-card');
  node.setAttribute('aria-live', 'polite');
  const hint = el('p', 'at-card-hint', tr().atlasHint);
  node.append(hint);
  return {
    node,
    show(id: CountryId) {
      const flag = el('div', 'at-card-flag');
      flag.innerHTML = flagSvg(id);
      const body = el('div', 'at-card-body');
      body.append(el('strong', 'at-card-name', nameOf(id)), el('span', 'at-card-cap', `${tr().capital}: ${capitalOf(id)}`));
      node.replaceChildren(flag, body, hint);
    },
  };
};
