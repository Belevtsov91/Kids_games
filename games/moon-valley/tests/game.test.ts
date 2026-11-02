import { describe, expect, it } from 'vitest';
import { initialState, tendPlot } from '../src/game/valley';

describe('moon valley progression', () => {
  it('uses a seed to plant a first flower', () => expect(tendPlot(initialState(), 0).plots[0].stage).toBe(1));
});
