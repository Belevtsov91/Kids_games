/** Проверка «только для взрослых»: три примера, которые малыш не решит, а взрослый решит за минуту. */

export interface Problem {
  text: string;
  answer: number;
}

const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

/** Двузначное на однозначное: 17 × 6. */
function multiply(): Problem {
  const a = rnd(13, 29), b = rnd(6, 9);
  return { text: `${a} × ${b}`, answer: a * b };
}

/** Трёхзначное вычитание с переходом через десяток: 402 − 167. */
function subtract(): Problem {
  const a = rnd(300, 900);
  let b = rnd(120, a - 50);
  if (b % 10 <= a % 10) b += (a % 10) - (b % 10) + 1; // чтобы был заём в разряде единиц
  return { text: `${a} − ${b}`, answer: a - b };
}

/** Деление без остатка: 144 ÷ 12. */
function divide(): Problem {
  const b = rnd(11, 16), q = rnd(6, 14);
  return { text: `${b * q} ÷ ${b}`, answer: q };
}

export const makeProblems = (): Problem[] => [multiply(), subtract(), divide()];

/** Все ответы верны (пробелы вокруг числа не считаются ошибкой). */
export const allCorrect = (problems: Problem[], answers: string[]) =>
  problems.every((p, i) => answers[i]?.trim() !== '' && Number(answers[i]?.trim()) === p.answer);
