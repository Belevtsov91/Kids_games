// Texts: English.
import type { Texts } from './ru';

export const en: Texts = {
  title: 'Secret Post',
  intro: (name) =>
    name ? `${name}, secret letters have arrived on the island! Will you help Tyopa read them?` : 'Secret letters have arrived on the island! Will you help Tyopa read them?',
  exit: 'Leave the game',
  toMenu: 'To the post office',
  bag: (n) => `Bag ${n}`,
  best: (stars) => (stars ? '⭐'.repeat(stars) : 'not opened yet'),
  modes: {
    wheel: { name: 'Caesar wheel', about: 'Every letter is shifted along the alphabet. Turn the wheel and the letter will speak.' },
    lighthouse: { name: 'Lighthouse signals', about: 'The lighthouse blinks in Morse code: a short flash is a dot, a long one is a dash.' },
    riddle: { name: 'Riddle letters', about: 'Each envelope holds a tricky question. Think like a detective and pick the answer.' },
  },
  letterOf: (n, of) => `Letter ${n} of ${of}`,
  wheel: {
    known: (key) => `The envelope says the key is ${key}. Turn the wheel by ${key} and read the letter.`,
    unknown: 'The key is lost! Turn the wheel until the code becomes a real word.',
    cipher: 'Code',
    plain: 'Reads as',
    shift: (key) => `Shift: ${key}`,
    left: 'Turn the wheel back',
    right: 'Turn the wheel forward',
    check: 'Read the letter',
    wrongKnown: (key) => `Not yet. The key on the envelope is ${key}, check the wheel.`,
    wrongUnknown: 'That is still gibberish. Try another shift.',
    hint: 'The outer ring shows code letters, the inner ring shows real letters.',
  },
  lighthouse: {
    prompt: 'The lighthouse blinks one letter. Which one is it?',
    legend: '• short flash, — long flash',
    replay: 'Repeat the signal',
    book: 'Code book',
    letter: (n, of) => `Letter ${n} of ${of}`,
    wrong: 'That is a different letter. Compare the signal with the code book.',
  },
  riddle: {
    prompt: 'Riddle letter',
    wrong: 'Hmm, not quite. Read the question again carefully.',
  },
  solved: 'Letter decoded!',
  doneTitle: (stars) => (stars === 3 ? 'Perfect post!' : stars === 2 ? 'Great job!' : 'Bag sorted!'),
  doneText: (mistakes) => (mistakes ? `Mistakes: ${mistakes}. Tyopa is happy!` : 'Not a single mistake. Tyopa is thrilled!'),
  again: '↻ Another bag',
  next: 'Next →',
  bear: 'Tyopa',
  praise: ['Correct!', 'Keep it up!', 'Code cracked!', 'Excellent!', 'Great!'],
};
