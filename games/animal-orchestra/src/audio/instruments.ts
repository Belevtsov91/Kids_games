import type { Instrument } from '../game/animals';
import type { Synth } from './Synth';

// Инструменты зверят: барабан, туба, маримба, пианино, скрипка, труба и флейта.

export function playInstrument(s: Synth, kind: Instrument, f: number, t: number) {
  switch (kind) {
    case 'drum': {
      const osc = s.osc('sine', f * 2.2, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.8, t + 0.25);
      s.env(osc, t, 0.003, 0.9, 0.45);
      s.noiseBurst(t, 0.06, 0.35, 1800, 'bandpass');
      break;
    }
    case 'tuba': {
      const osc = s.osc('sawtooth', f, t);
      const lp = s.filter('lowpass', 300, 2);
      lp.frequency.setValueAtTime(300, t);
      lp.frequency.linearRampToValueAtTime(900, t + 0.08);
      lp.frequency.exponentialRampToValueAtTime(350, t + 0.6);
      s.env(osc, t, 0.04, 0.55, 0.7, lp);
      break;
    }
    case 'marimba': {
      s.env(s.osc('sine', f, t), t, 0.002, 0.7, 0.6);
      s.env(s.osc('sine', f * 4, t), t, 0.002, 0.18, 0.12);
      break;
    }
    case 'piano': {
      s.env(s.osc('triangle', f, t), t, 0.004, 0.6, 1.3);
      s.env(s.osc('sine', f * 2, t), t, 0.004, 0.2, 0.6);
      s.env(s.osc('sine', f * 3, t), t, 0.004, 0.07, 0.3);
      break;
    }
    case 'violin': {
      const osc = s.osc('sawtooth', f, t);
      s.vibrato(osc, t, 5.5, f * 0.012, 0.15);
      const lp = s.filter('lowpass', 2600, 1);
      s.env(osc, t, 0.09, 0.32, 0.75, lp, 0.45);
      break;
    }
    case 'trumpet': {
      const osc = s.osc('sawtooth', f, t);
      s.vibrato(osc, t, 6, f * 0.008, 0.2);
      const lp = s.filter('lowpass', 700, 3);
      lp.frequency.setValueAtTime(700, t);
      lp.frequency.linearRampToValueAtTime(3200, t + 0.05);
      lp.frequency.exponentialRampToValueAtTime(1500, t + 0.4);
      s.env(osc, t, 0.03, 0.38, 0.6, lp, 0.35);
      break;
    }
    case 'flute': {
      const osc = s.osc('sine', f * 2, t);
      s.vibrato(osc, t, 5, f * 0.02, 0.18);
      s.env(osc, t, 0.07, 0.5, 0.7, undefined, 0.4);
      s.noiseBurst(t, 0.5, 0.06, f * 2, 'bandpass', 0.06);
      break;
    }
  }
}
