import { describe, expect, it } from 'vitest';
import { checkEmail, checkName, checkNewPassword, domainHint, passScore } from './validation';

describe('проверки входа и регистрации', () => {
  it('почта', () => {
    expect(checkEmail('').error).toBe('empty');
    expect(checkEmail('mama.example.com').error).toBe('noAt');
    expect(checkEmail('mama@example').error).toBe('format');
    expect(checkEmail('юзер@почта.рф').error).toBe('latin');
    expect(checkEmail(' mama@example.com ').error).toBeNull();
  });

  it('подсказка при опечатке в домене', () => {
    expect(domainHint('mama@gmial.com')).toBe('mama@gmail.com');
    expect(domainHint('mama@yandex.ru')).toBeNull();
    expect(domainHint('mama@school.example.org')).toBeNull();
  });

  it('имя', () => {
    expect(checkName('А')).toBe('short');
    expect(checkName('Анна-Мария')).toBeNull();
    expect(checkName('Anna123')).toBe('chars');
  });

  it('надёжность пароля', () => {
    expect(passScore('')).toBe(0);
    expect(passScore('Ab1!')).toBe(1);
    expect(passScore('moonvalley')).toBe(1);
    expect(passScore('Moon2026')).toBe(3);
    expect(passScore('Moon2026!')).toBe(4);
  });

  it('новый пароль', () => {
    expect(checkNewPassword('', 'a@b.co')).toBe('empty');
    expect(checkNewPassword('Ab1', 'a@b.co')).toBe('short');
    expect(checkNewPassword('moonvalley', 'a@b.co')).toBe('weak');
    expect(checkNewPassword('Anna2026!', 'anna@example.com')).toBe('likeEmail');
    expect(checkNewPassword('Moon2026!', 'anna@example.com')).toBeNull();
  });
});
