import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameVoice } from '../src/audio';

class Utterance {
  voice: unknown = null;
  lang = '';
  rate = 1;
  pitch = 1;
  volume = 1;
  constructor(readonly text: string) {}
}

const played: string[] = [];
class FakeAudio {
  volume = 1;
  constructor(readonly src: string) {}
  play() {
    played.push(this.src);
    return Promise.resolve();
  }
  pause() {}
}

let voices: { lang: string; name: string }[] = [];
const speech = {
  getVoices: () => voices,
  speak: vi.fn(),
  cancel: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

beforeEach(() => {
  played.length = 0;
  speech.speak.mockClear();
  vi.stubGlobal('speechSynthesis', speech);
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
  vi.stubGlobal('Audio', FakeAudio);
});
afterEach(() => vi.unstubAllGlobals());

describe('GameVoice', () => {
  it('читает голосом браузера на языке игры', () => {
    voices = [{ lang: 'en-US', name: 'A' }, { lang: 'ru-RU', name: 'Milena' }];
    const voice = new GameVoice({ lang: 'ru' });
    expect(voice.say('Привет')).toBe(true);
    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect((speech.speak.mock.calls[0][0] as Utterance).lang).toBe('ru-RU');
  });

  it('без голоса на языке играет записанный клип по ключу или тексту', () => {
    voices = [{ lang: 'ru-RU', name: 'Milena' }];
    const voice = new GameVoice({ lang: 'uk', clips: { hello: '/hello-uk.mp3', 'Молодець!': '/well-done.mp3' } });
    expect(voice.hasVoice).toBe(false);
    expect(voice.say('Привіт', { clip: 'hello' })).toBe(true);
    expect(voice.say('Молодець!')).toBe(true);
    expect(played).toEqual(['/hello-uk.mp3', '/well-done.mp3']);
    expect(speech.speak).not.toHaveBeenCalled();
  });

  it('молчит без голоса и клипа, а также при выключенном звуке', () => {
    voices = [];
    const voice = new GameVoice({ lang: 'ro' });
    expect(voice.say('Bravo')).toBe(false);
    voices = [{ lang: 'ro-RO', name: 'Ioana' }];
    const muted = new GameVoice({ lang: 'ro', muted: true });
    expect(muted.say('Bravo')).toBe(false);
    muted.setMuted(false);
    expect(muted.say('Bravo')).toBe(true);
  });

  it('предпочитает голос по имени', () => {
    voices = [{ lang: 'en-US', name: 'Fred' }, { lang: 'en-GB', name: 'Samantha' }];
    const voice = new GameVoice({ lang: 'en', prefer: /samantha/i });
    voice.say('Hi');
    expect((speech.speak.mock.calls[0][0] as Utterance).lang).toBe('en-GB');
  });
});
