// Свободный сад: ребёнок переключает время года и погоду, нажимает на зверей и слушает, как они живут.
import type { Sound } from '../audio/Sound';
import { sceneOf, SEASONS, WEATHERS, weatherOk, type Season, type Weather } from '../game/seasons';
import { tr } from '../i18n';
import { button, el } from '../ui/dom';
import { GardenView } from '../ui/gardenView';

const SEASON_EMOJI: Record<Season, string> = { spring: '🌸', summer: '☀️', autumn: '🍁', winter: '❄️' };
const WEATHER_EMOJI: Record<Weather, string> = { sun: '☀️', rain: '🌧️', snow: '🌨️', wind: '💨' };

export interface GardenDeps {
  stage: HTMLElement;
  sound: Sound;
  /** Ребёнок открыл сезон (для наклейки «Четыре сезона»). */
  onSeason: (s: Season) => void;
}

export class Garden {
  private season: Season;
  private weather: Weather = 'sun';
  private readonly view: GardenView;
  private readonly seasonBtns = new Map<Season, HTMLButtonElement>();
  private readonly weatherBtns = new Map<Weather, HTMLButtonElement>();

  constructor(private readonly d: GardenDeps, start: Season) {
    this.season = start;
    this.view = new GardenView((a) => {
      this.view.wiggle(a);
      this.d.sound.pick();
      const state = sceneOf(this.season, this.weather).animals[a];
      this.d.sound.say(state === 'hidden' ? tr().hidden : tr().facts[a][this.season]);
    });
    const seasons = el('div', 'sg-bar');
    for (const s of SEASONS) {
      const b = button(`sg-chip sg-chip-${s}`, `${SEASON_EMOJI[s]} ${tr().seasons[s]}`, () => this.setSeason(s));
      this.seasonBtns.set(s, b);
      seasons.append(b);
    }
    const weathers = el('div', 'sg-bar');
    for (const w of WEATHERS) {
      const b = button('sg-chip sg-chip-weather', WEATHER_EMOJI[w], () => this.setWeather(w));
      b.setAttribute('aria-label', tr().weathers[w]);
      this.weatherBtns.set(w, b);
      weathers.append(b);
    }
    const wrap = el('section', 'sg-explore');
    wrap.append(seasons, this.view.node, weathers, el('p', 'sg-coach', tr().coach));
    d.stage.append(wrap);
    this.render();
    d.onSeason(start);
  }

  private setSeason(s: Season) {
    this.season = s;
    if (!weatherOk(s, this.weather)) this.weather = s === 'winter' ? 'snow' : 'sun';
    this.d.sound.correct();
    this.d.sound.say(tr().arrive[s]);
    this.d.onSeason(s);
    this.render();
  }

  private setWeather(w: Weather) {
    if (!weatherOk(this.season, w)) {
      this.d.sound.wrong();
      this.d.sound.say(w === 'snow' ? tr().noSnow : tr().noRain);
      return;
    }
    this.weather = w;
    this.d.sound.pick();
    this.d.sound.say(tr().weathers[w]);
    this.render();
  }

  private render() {
    this.view.show(sceneOf(this.season, this.weather));
    this.seasonBtns.forEach((b, s) => b.classList.toggle('is-on', s === this.season));
    this.weatherBtns.forEach((b, w) => {
      b.classList.toggle('is-on', w === this.weather);
      b.classList.toggle('is-off', !weatherOk(this.season, w));
    });
  }
}
