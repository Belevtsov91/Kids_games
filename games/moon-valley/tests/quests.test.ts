import { describe, expect, it } from 'vitest';
import { addXp, befriend, buildGreenhouse, calmBoss, cleanseSlime, collectCrystal, initialState, openChest, tendPlot, type ValleyState } from '../src/game/valley';
import { npcMarker, QUESTS, questView, talkTo } from '../src/game/quests';

const harvest = (state: ValleyState) => {
  let next = { ...state, seeds: state.seeds + 1, water: state.water + 2 };
  for (let i = 0; i < 4; i++) next = tendPlot(next, 0);
  return next;
};

describe('quest chain', () => {
  it('starts with an offer from granny', () => {
    const state = initialState();
    expect(questView(state)).toMatchObject({ status: 'offer', quest: { id: 'first-harvest' } });
    expect(npcMarker(state, 'granny')).toBe('!');
    expect(npcMarker(state, 'miller')).toBeNull();
  });

  it('other villagers send the hero to the quest giver', () => {
    const talk = talkTo(initialState(), 'ranger');
    expect(talk.event).toBe('chat');
    expect(talk.lines[0]).toContain('Бабушка Ива');
  });

  it('counts only harvests made after the quest was taken', () => {
    let state = harvest(initialState());
    state = talkTo(state, 'granny').state;
    expect(questView(state)).toMatchObject({ status: 'active', have: 0, need: 2 });
    state = harvest(harvest(state));
    expect(questView(state).status).toBe('ready');
    expect(npcMarker(state, 'granny')).toBe('?');
    const done = talkTo(state, 'granny');
    expect(done.event).toBe('completed');
    expect(done.state.quest).toEqual({ index: 1, active: false, base: 0 });
    expect(done.state.starlight).toBe(state.starlight + 10);
  });

  it('can be played to the end', () => {
    let state = initialState();
    const finish = (step: (s: ValleyState) => ValleyState) => {
      const quest = QUESTS[state.quest.index];
      state = talkTo(state, quest.giver).state;
      expect(questView(state).status).toBe('active');
      state = step(state);
      expect(questView(state).status, quest.id).toBe('ready');
      state = talkTo(state, quest.giver).state;
    };
    finish((s) => harvest(harvest(s)));
    finish((s) => befriend(befriend(befriend(s, 'fox'), 'fox'), 'fox'));
    finish((s) => Array.from({ length: 5 }).reduce<ValleyState>((acc) => collectCrystal(acc), s));
    finish((s) => buildGreenhouse({ ...s, starlight: s.starlight + 20 }));
    finish((s) => Array.from({ length: 6 }).reduce<ValleyState>((acc) => cleanseSlime(acc), s));
    state = addXp(state, 1000);
    finish(calmBoss);
    finish((s) => ['lake', 'stable', 'forest'].reduce(openChest, s));
    expect(questView(state).status).toBe('done');
  });

  it('the mushroom king waits for level 3', () => {
    const state: ValleyState = { ...initialState(), quest: { index: 5, active: false, base: 0 } };
    expect(talkTo(state, 'ranger').state.quest.active).toBe(false);
    expect(npcMarker(state, 'ranger')).toBeNull();
    const grown = { ...state, level: 3 };
    expect(talkTo(grown, 'ranger').state.quest.active).toBe(true);
  });
});
