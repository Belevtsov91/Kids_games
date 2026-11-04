import { afterAll, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env, parseTrustProxy } from '../src/config/env';
import { derivedSecret } from '../src/config/keys';
import { gameTables } from '../src/games/loader';

describe('TRUST_PROXY', () => {
  it('число прокси, true/false и мусор', () => {
    expect(parseTrustProxy('2')).toBe(2);
    expect(parseTrustProxy('0')).toBe(0);
    expect(parseTrustProxy('true')).toBe(true);
    expect(parseTrustProxy('false')).toBe(false);
    expect(parseTrustProxy('-1')).toBe(false);
    expect(parseTrustProxy('abc')).toBe(false);
  });
});

describe('derivedSecret', () => {
  it('без ключа — пусто, с ключом — разные ключи под разные задачи', () => {
    const saved = env.sessionEncryptionKey;
    (env as { sessionEncryptionKey?: string }).sessionEncryptionKey = undefined;
    expect(derivedSecret('gate')).toBe('');
    (env as { sessionEncryptionKey?: string }).sessionEncryptionKey = 'a'.repeat(64);
    const gate = derivedSecret('gate');
    expect(gate).toMatch(/^[0-9a-f]{64}$/);
    expect(derivedSecret('answer')).not.toBe(gate);
    expect(derivedSecret('gate')).toBe(gate);
    (env as { sessionEncryptionKey?: string }).sessionEncryptionKey = saved;
  });
});

describe('gameTables', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ig-tables-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('находит таблицы игры в её миграциях', () => {
    mkdirSync(join(dir, 'demo', 'server', 'migrations'), { recursive: true });
    writeFileSync(
      join(dir, 'demo', 'server', 'migrations', '001.sql'),
      'create table if not exists public.ig_game_demo_saves (id int);\nCREATE TABLE IF NOT EXISTS ig_game_demo_Extra (id int);\n',
    );
    expect(gameTables(dir, 'demo').sort()).toEqual(['ig_game_demo_extra', 'ig_game_demo_saves']);
    expect(gameTables(dir, 'missing')).toEqual([]);
  });
});
