import type { MailLang } from '../../mail/texts.js';

// Письмо «аккаунтом давно не пользовались» на четырёх языках.

interface Text {
  subject: string;
  line: (days: number) => string;
  open: string;
  footer: string;
}

export const INACTIVE_MAIL: Record<MailLang, Text> = {
  ru: {
    subject: 'Аккаунт Interact Games скоро будет удалён',
    line: (d) => `В аккаунт не входили почти два года. Мы не храним данные детей без срока: через ${d} дней аккаунт, профили детей и сохранения игр будут удалены. Чтобы всё осталось, просто войдите на сайт.`,
    open: 'Войти и сохранить аккаунт',
    footer: 'Interact Games · Это письмо о сроке хранения данных. Если аккаунт больше не нужен, ничего делать не надо.',
  },
  uk: {
    subject: 'Акаунт Interact Games скоро буде видалено',
    line: (d) => `В акаунт не входили майже два роки. Ми не зберігаємо дані дітей безстроково: через ${d} днів акаунт, профілі дітей і збереження ігор буде видалено. Щоб усе залишилося, просто увійдіть на сайт.`,
    open: 'Увійти і зберегти акаунт',
    footer: 'Interact Games · Це лист про строк зберігання даних. Якщо акаунт більше не потрібен, нічого робити не треба.',
  },
  ro: {
    subject: 'Contul Interact Games va fi șters în curând',
    line: (d) => `Nimeni nu a intrat în cont de aproape doi ani. Nu păstrăm datele copiilor pe termen nelimitat: peste ${d} zile contul, profilurile copiilor și salvările jocurilor vor fi șterse. Ca să rămână totul, intră pe site.`,
    open: 'Intră și păstrează contul',
    footer: 'Interact Games · Acest e-mail este despre termenul de păstrare a datelor. Dacă nu mai ai nevoie de cont, nu trebuie să faci nimic.',
  },
  en: {
    subject: 'Your Interact Games account will be deleted soon',
    line: (d) => `Nobody has signed in to this account for almost two years. We do not keep children’s data forever: in ${d} days the account, the child profiles and all game saves will be deleted. To keep everything, just sign in.`,
    open: 'Sign in and keep the account',
    footer: 'Interact Games · This email is about how long we keep data. If you no longer need the account, you don’t have to do anything.',
  },
};
