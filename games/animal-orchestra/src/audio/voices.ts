import type { Voice } from '../game/animals';
import type { Synth } from './Synth';

// Голоса зверей: рычание, мычание, кваканье, лай, мяуканье, трубный слон и птичья трель.

export function playVoice(s: Synth, kind: Voice, t: number) {
  switch (kind) {
    case 'growl': {
      // «Р-р-р»: низкий хрип, дрожащий по громкости.
      const osc = s.osc('sawtooth', 90, t);
      osc.frequency.linearRampToValueAtTime(75, t + 0.7);
      const lp = s.filter('lowpass', 500, 4);
      const g = s.env(osc, t, 0.05, 0.6, 0.75, lp, 0.6);
      s.tremolo(g, t, 22, 0.35, 0.8);
      s.noiseBurst(t, 0.7, 0.08, 400, 'lowpass', 0.05);
      break;
    }
    case 'moo': {
      // «Му-у»: низкая нота, фильтр открывается и закрывается.
      const osc = s.osc('sawtooth', 120, t);
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(140, t + 0.25);
      osc.frequency.linearRampToValueAtTime(105, t + 1);
      const lp = s.filter('lowpass', 250, 6);
      lp.frequency.setValueAtTime(250, t);
      lp.frequency.linearRampToValueAtTime(900, t + 0.3);
      lp.frequency.linearRampToValueAtTime(350, t + 1);
      s.env(osc, t, 0.08, 0.7, 1.05, lp, 0.85);
      break;
    }
    case 'croak': {
      // «Ква-ква»: два коротких квакающих звука.
      for (const start of [t, t + 0.28]) {
        const osc = s.osc('square', 180, start);
        osc.frequency.setValueAtTime(180, start);
        osc.frequency.linearRampToValueAtTime(240, start + 0.08);
        osc.frequency.linearRampToValueAtTime(150, start + 0.2);
        const bp = s.filter('bandpass', 900, 3);
        const g = s.env(osc, start, 0.01, 0.45, 0.22, bp, 0.12);
        s.tremolo(g, start, 35, 0.5, 0.22);
      }
      break;
    }
    case 'woof': {
      // «Гав-гав».
      for (const start of [t, t + 0.25]) {
        const osc = s.osc('sawtooth', 320, start);
        osc.frequency.exponentialRampToValueAtTime(140, start + 0.14);
        const bp = s.filter('bandpass', 700, 1.5);
        s.env(osc, start, 0.005, 0.7, 0.17, bp);
        s.noiseBurst(start, 0.08, 0.25, 1200, 'bandpass');
      }
      break;
    }
    case 'meow': {
      // «Мя-у»: голос скользит вверх и вниз.
      const osc = s.osc('sawtooth', 480, t);
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.linearRampToValueAtTime(820, t + 0.22);
      osc.frequency.linearRampToValueAtTime(420, t + 0.6);
      const bp = s.filter('bandpass', 1100, 4);
      bp.frequency.setValueAtTime(900, t);
      bp.frequency.linearRampToValueAtTime(1600, t + 0.2);
      bp.frequency.linearRampToValueAtTime(900, t + 0.6);
      s.env(osc, t, 0.06, 0.9, 0.62, bp, 0.45);
      break;
    }
    case 'trumpet': {
      // Слоновий «ту-ру-ру».
      const osc = s.osc('sawtooth', 420, t);
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.linearRampToValueAtTime(700, t + 0.15);
      osc.frequency.linearRampToValueAtTime(560, t + 0.7);
      s.vibrato(osc, t, 9, 25, 0.1);
      const bp = s.filter('bandpass', 1400, 2);
      s.env(osc, t, 0.03, 0.75, 0.8, bp, 0.6);
      break;
    }
    case 'tweet': {
      // «Чик-чирик»: три быстрые трели.
      [0, 0.12, 0.24].forEach((d, i) => {
        const start = t + d;
        const osc = s.osc('sine', 2400 + i * 300, start);
        osc.frequency.setValueAtTime(2400 + i * 300, start);
        osc.frequency.exponentialRampToValueAtTime(3600 + i * 200, start + 0.05);
        osc.frequency.exponentialRampToValueAtTime(2600, start + 0.09);
        s.env(osc, start, 0.005, 0.35, 0.1);
      });
      break;
    }
  }
}
