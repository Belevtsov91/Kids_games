import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QUICK_MS, resetWakeForTests, SHOW_AFTER_MS, waitForServer, wakeStore } from './serverStatus';

const ok = () => Promise.resolve(new Response('{}', { status: 200 }));
const down = () => Promise.resolve(new Response('', { status: 502 }));

describe('будильник сервера', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetWakeForTests();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('сервер ответил сразу — мишку не показываем', async () => {
    vi.stubGlobal('fetch', vi.fn(ok));
    await waitForServer('start');
    expect(wakeStore.get().phase).toBe('up');
  });

  it('сервер спит — мишка спит, пока сервер не ответит, потом встаёт', async () => {
    const fetch = vi.fn(down);
    vi.stubGlobal('fetch', fetch);
    const done = waitForServer('start');
    await vi.advanceTimersByTimeAsync(SHOW_AFTER_MS + 10);
    expect(wakeStore.get()).toMatchObject({ phase: 'asleep', reason: 'start' });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetch.mock.calls.length).toBeGreaterThan(2);
    fetch.mockImplementation(ok);
    await vi.advanceTimersByTimeAsync(6000);
    await done;
    expect(wakeStore.get().phase).toBe('awake');
    wakeStore.finish();
    expect(wakeStore.get().phase).toBe('up');
  });

  it('долгий ответ без ошибки — тоже показываем мишку', async () => {
    let answer: (r: Response) => void = () => undefined;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => (answer = r))));
    const done = waitForServer('start');
    await vi.advanceTimersByTimeAsync(SHOW_AFTER_MS + 10);
    expect(wakeStore.get().phase).toBe('asleep');
    await vi.advanceTimersByTimeAsync(QUICK_MS);
    answer(new Response('{}', { status: 200 }));
    await done;
    expect(wakeStore.get().phase).toBe('awake');
  });

  it('ответ вскоре после появления мишки — убираем экран сразу, без подъёма', async () => {
    let answer: (r: Response) => void = () => undefined;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => (answer = r))));
    const done = waitForServer('start');
    await vi.advanceTimersByTimeAsync(SHOW_AFTER_MS + 10);
    expect(wakeStore.get().phase).toBe('asleep');
    answer(new Response('{}', { status: 200 }));
    await done;
    expect(wakeStore.get().phase).toBe('up');
  });

  it('упал посреди игры: причина lost, одно ожидание на все запросы', async () => {
    vi.stubGlobal('fetch', vi.fn(ok));
    await waitForServer('start');
    const fetch = vi.fn((): Promise<Response> => Promise.reject(new TypeError('Failed to fetch')));
    vi.stubGlobal('fetch', fetch);
    const a = waitForServer('lost');
    const b = waitForServer('lost');
    expect(a).toBe(b);
    await vi.advanceTimersByTimeAsync(10);
    expect(wakeStore.get()).toMatchObject({ phase: 'asleep', reason: 'lost' });
    await vi.advanceTimersByTimeAsync(QUICK_MS);
    fetch.mockImplementation(ok);
    await vi.advanceTimersByTimeAsync(6000);
    await a;
    expect(wakeStore.get().phase).toBe('awake');
  });
});
