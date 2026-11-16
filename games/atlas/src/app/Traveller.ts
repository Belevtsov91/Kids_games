import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import { COUNTRIES, country, inRegion, type CountryId, type Region } from '../game/countries';
import { REGION_ZOOM, centerOf, fitZoom } from '../game/globe';
import { readProgress, recordRound, stickersFor, type Progress } from '../game/progress';
import { buildRound, starsFor, type Question } from '../game/quiz';
import { nameOf, tr } from '../i18n';
import { applyComfort, button, el } from '../ui/dom';
import { Globe, type Marker } from '../ui/Globe';
import { QuestionView } from '../ui/QuestionView';
import { countryCard, resultScreen, startScreen } from '../ui/screens';
import { tepa } from '../ui/tepa';

interface Round {
  region: Region;
  questions: Question[];
  index: number;
  correct: number;
  flagsRight: number;
  visited: Set<CountryId>;
}

const mark = (id: CountryId, tone: Marker['tone'], label?: string): Marker => {
  const c = country(id);
  return { id, lat: c.lat, lon: c.lon, tone, label, title: nameOf(id) };
};

/** Вся игра: маршруты с вопросами про флаги и столицы и свободный атлас с глобусом. */
export class Traveller {
  private readonly root = el('div', 'at');
  private readonly stage = el('main', 'at-stage');
  private readonly sound: Sound;
  private readonly offMute: () => void;
  private readonly offEnding: () => void;
  private progress: Progress;
  private globe: Globe | null = null;
  private bear: ReturnType<typeof tepa> | null = null;
  private round: Round | null = null;
  private view: QuestionView | null = null;
  private answered = false;

  constructor(container: HTMLElement, private readonly sdk: GameSdk) {
    this.root.append(this.stage);
    container.appendChild(this.root);
    applyComfort(this.root, 'at', sdk.comfort);
    this.sound = new Sound(sdk.audio.muted);
    this.sound.setVolume(sdk.comfort.effectsVolume);
    this.offMute = sdk.audio.onMuteChange((m) => this.sound.setMuted(m));
    this.offEnding = sdk.time.onEnding(() => this.bear?.say(tr().ending));
    this.root.addEventListener('pointerdown', this.unlock, { capture: true });
    this.progress = readProgress(sdk.storage.load('progress'));
    this.showStart();
  }

  pause() {
    this.sound.pause();
  }

  resume() {
    this.sound.resume();
  }

  dispose() {
    this.clear();
    this.offMute();
    this.offEnding();
    this.sound.dispose();
    this.root.removeEventListener('pointerdown', this.unlock, { capture: true });
    this.root.remove();
  }

  private showStart() {
    this.clear();
    this.stage.append(startScreen(this.sdk.profile?.name, this.progress, (r) => this.startRound(r), () => this.showAtlas()));
  }

  private startRound(region: Region) {
    this.sound.tap();
    this.round = { region, questions: buildRound(region, Math.random), index: 0, correct: 0, flagsRight: 0, visited: new Set() };
    this.ask();
  }

  /** Экран вопроса: глобус с Тёпой слева (сверху на телефоне), панель вопроса справа. */
  private ask() {
    const round = this.round!;
    const q = round.questions[round.index];
    this.clear(false);
    this.answered = false;
    const play = el('section', 'at-play');
    const side = el('div', 'at-side');
    this.globe = new Globe(this.sdk.comfort.reduceMotion, (id) => q.kind === 'globe' && this.pick(q, id as CountryId));
    this.bear = tepa(round.index ? (this.bear?.node.textContent ?? '') : tr().lead(this.sdk.profile?.name));
    side.append(this.globe.node, this.bear.node);
    this.view = new QuestionView(q, round.index + 1, round.questions.length, (id) => this.pick(q, id), () => this.next());
    const back = button('at-btn at-back', tr().back, () => this.showStart());
    play.append(side, this.view.node, back);
    this.stage.append(play);
    if (q.kind === 'globe') {
      const places = q.options.map(country);
      const center = centerOf(places);
      this.globe.setZoom(fitZoom(center, places));
      this.globe.setMarkers(q.options.map((id, i) => mark(id, 'pick', String(i + 1))));
      this.globe.flyTo(center, 700);
    } else {
      const own = inRegion(round.region);
      this.globe.setZoom(REGION_ZOOM[round.region]);
      this.globe.setMarkers(own.map((c) => mark(c.id, 'idle')));
      this.globe.flyTo(centerOf(own), 0);
    }
    this.globe.showBalloon(q.kind !== 'globe');
  }

  private pick(q: Question, id: CountryId) {
    if (this.answered || !this.round) return;
    this.answered = true;
    const round = this.round;
    const ok = id === q.answer;
    if (ok) {
      round.correct++;
      round.visited.add(q.answer);
      if (q.kind === 'flag' || q.kind === 'flagOf') round.flagsRight++;
      this.sound.correct();
      const lines = tr().tepaRight;
      this.bear?.say(lines[round.correct % lines.length], 'happy');
    } else {
      this.sound.wrong();
      this.bear?.say(tr().tepaWrong);
    }
    this.sdk.progress.skill(q.kind === 'globe' ? 'space' : 'memory', ok);
    this.view?.reveal(q, id);
    const marks = [mark(q.answer, 'right', q.kind === 'globe' ? String(q.options.indexOf(q.answer) + 1) : undefined)];
    if (!ok && q.kind === 'globe') marks.push(mark(id, 'wrong', String(q.options.indexOf(id) + 1)));
    this.globe?.setMarkers(marks);
    this.globe?.showBalloon(true);
    this.globe?.flyTo(country(q.answer));
    this.sound.whoosh();
  }

  private next() {
    const round = this.round!;
    round.index++;
    if (round.index < round.questions.length) return this.ask();
    this.finish(round);
  }

  private finish(round: Round) {
    const total = round.questions.length;
    const stars = starsFor(round.correct, total);
    const result = { region: round.region, correct: round.correct, total, stars, flagsRight: round.flagsRight, visited: [...round.visited] };
    this.progress = recordRound(this.progress, result);
    this.sdk.storage.save('progress', this.progress);
    if (stars > 0) this.sdk.progress.level(round.region);
    for (const id of stickersFor(this.progress, result)) this.sdk.progress.sticker(id);
    this.sound.win();
    const o = resultScreen(stars, round.correct, total, () => this.startRound(round.region), () => this.showStart());
    this.stage.append(o.overlay);
    o.focus();
  }

  /** Атлас: свободно крутим глобус, нажимаем на столицы и смотрим флаг. */
  private showAtlas() {
    this.clear();
    const play = el('section', 'at-play at-atlas');
    const side = el('div', 'at-side');
    const card = countryCard();
    const visited = new Set(this.progress.visited);
    const all = () => COUNTRIES.map((c) => mark(c.id, visited.has(c.id) ? 'home' : 'idle'));
    this.globe = new Globe(this.sdk.comfort.reduceMotion, (id) => {
      this.sound.tap();
      card.show(id as CountryId);
      this.globe?.setMarkers([...all().filter((m) => m.id !== id), mark(id as CountryId, 'right')]);
    });
    this.globe.setMarkers(all());
    this.globe.showBalloon(false);
    this.globe.setZoom(REGION_ZOOM.europe);
    this.globe.flyTo(country('md'), 0);
    const zoom = el('div', 'at-zoom');
    zoom.append(button('at-btn', '−', () => this.globe?.setZoom(this.globe.zoomLevel / 1.5)), button('at-btn', '+', () => this.globe?.setZoom(this.globe.zoomLevel * 1.5)));
    side.append(this.globe.node, zoom);
    const panel = el('div', 'at-panel');
    panel.append(el('h2', 'at-prompt', tr().atlas), card.node);
    play.append(side, panel, button('at-btn at-back', tr().back, () => this.showStart()));
    this.stage.append(play);
  }

  private clear(dropBear = true) {
    this.globe?.dispose();
    this.globe = null;
    this.view = null;
    if (dropBear) this.bear = null;
    this.stage.replaceChildren();
  }

  private unlock = () => this.sound.unlock();
}
