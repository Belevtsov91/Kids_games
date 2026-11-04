// Паровозик: локомотив и вагоны с пассажирами, туннель, который их прячет.
import { el } from './dom';

export class TrainView {
  readonly node = el('div', 'mt-rail');
  private readonly train = el('div', 'mt-train');
  private readonly seats: HTMLElement[] = [];
  private readonly wagons: HTMLElement[] = [];

  constructor(riders: readonly string[]) {
    this.train.append(el('span', 'mt-loco', '🚂'));
    riders.forEach((r, i) => {
      const wagon = el('div', 'mt-wagon');
      const seat = el('span', 'mt-seat', r);
      wagon.append(seat, el('small', 'mt-num', String(i + 1)));
      this.wagons.push(wagon);
      this.seats.push(seat);
      this.train.append(wagon);
    });
    const tunnel = el('div', 'mt-tunnel');
    tunnel.setAttribute('aria-hidden', 'true');
    this.node.append(this.train, tunnel);
  }

  arrive() {
    this.node.classList.remove('is-in-tunnel');
    this.node.classList.add('is-arriving');
  }

  enterTunnel() {
    this.node.classList.add('is-in-tunnel');
  }

  /** Выехал из туннеля: пассажиры спрятаны, кроме тех, кого надо показать. */
  leaveTunnel(hideAll: boolean, empty?: number) {
    this.node.classList.remove('is-in-tunnel', 'is-arriving');
    this.seats.forEach((s, i) => {
      s.classList.toggle('is-hidden', hideAll);
      s.classList.toggle('is-gone', i === empty);
    });
  }

  point(wagon: number | null) {
    this.wagons.forEach((w, i) => w.classList.toggle('is-asked', i === wagon));
  }

  reveal(i: number) {
    this.seats[i]?.classList.remove('is-hidden', 'is-gone');
  }

  revealAll() {
    this.seats.forEach((s) => s.classList.remove('is-hidden', 'is-gone'));
  }
}
