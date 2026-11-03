// Самопроверка таблиц игр в Supabase. Запуск из platform/server:
//   node --env-file=.env db-selftest.mjs
// Создаёт временного тестового родителя и ребёнка, пишет и читает каждую таблицу игр,
// затем удаляет тестового родителя (каскад чистит всё остальное). Файл можно удалить после проверки.
import { createClient } from '@supabase/supabase-js';
const env = process.env;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, opts);
const pub = env.SUPABASE_PUBLISHABLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, opts) : null;
const tables = ['ig_game_drawing_drawings', 'ig_game_animal_orchestra_melodies', 'ig_game_island_builder_islands', 'ig_game_letter_eater_progress', 'ig_game_space_gardener_levels', 'ig_game_who_lives_where_progress'];
const must = (r, what) => { if (r.error) throw new Error(`${what}: ${r.error.message}`); return r.data; };

for (const t of tables) {
  const r = await db.from(t).select('*', { count: 'exact', head: true });
  console.log(r.error ? `НЕТ  ${t}: ${r.error.message}` : `есть ${t} (строк: ${r.count})`);
  if (pub) {
    const p = await pub.from(t).select('*').limit(1);
    console.log(`     публичный ключ: ${p.error ? 'закрыто (' + (p.error.code ?? '') + ')' : 'видит ' + p.data.length + ' строк'}`);
  }
}

// Запись/чтение на временном тестовом родителе; в конце удаляется (каскад чистит всё).
const email = `ig-selftest-${Date.now()}@example.invalid`;
const parent = must(await db.from('ig_parents').insert({ email, password_hash: 'x', display_name: 'selftest' }).select('id').single(), 'parent');
try {
  const child = must(await db.from('ig_children').insert({ parent_id: parent.id, name: 'Тест', age: 7, avatar: 't' }).select('id').single(), 'child');
  const c = child.id;
  must(await db.from('ig_game_who_lives_where_progress').upsert({ child_id: c, level: 3, found: ['cow'] }), 'wlw');
  must(await db.from('ig_game_who_lives_where_progress').upsert({ child_id: c, level: 4, found: ['cow', 'fox'] }), 'wlw2');
  console.log('who-lives-where', must(await db.from('ig_game_who_lives_where_progress').select('level, found').eq('child_id', c).maybeSingle(), 'r'));
  must(await db.from('ig_game_letter_eater_progress').upsert({ child_id: c, stars: [2, 0, 0, 0, 0] }), 'le');
  console.log('letter-eater', must(await db.from('ig_game_letter_eater_progress').select('stars').eq('child_id', c).maybeSingle(), 'r'));
  must(await db.from('ig_game_space_gardener_levels').upsert({ child_id: c, level_id: 'sprout', stars: 2 }), 'sg');
  must(await db.from('ig_game_space_gardener_levels').upsert({ child_id: c, level_id: 'sprout', stars: 3 }), 'sg2');
  console.log('space-gardener', must(await db.from('ig_game_space_gardener_levels').select('level_id, stars').eq('child_id', c), 'r'));
  must(await db.from('ig_game_island_builder_islands').upsert({ child_id: c, island: { v: 1, blocks: [[1, 0, 1, 0]] } }), 'ib');
  console.log('island-builder', must(await db.from('ig_game_island_builder_islands').select('island').eq('child_id', c).maybeSingle(), 'r'));
  const d = must(await db.from('ig_game_drawing_drawings').insert({ child_id: c, title: 't', image: 'data:image/png;base64,AAAA' }).select('id, created_at').single(), 'dr');
  console.log('drawing', d, 'удалено:', must(await db.from('ig_game_drawing_drawings').delete().eq('id', d.id).eq('child_id', c).select('id'), 'del').length);
  const m = must(await db.from('ig_game_animal_orchestra_melodies').insert({ child_id: c, title: 'm', notes: [{ a: 'cat', t: 0, m: 'voice' }] }).select('id, notes').single(), 'ao');
  console.log('animal-orchestra', m.notes);
  const bad = await db.from('ig_game_space_gardener_levels').upsert({ child_id: c, level_id: 'x', stars: 9 });
  console.log('проверка ограничений (stars=9):', bad.error ? 'отклонено' : 'ПРИНЯТО — плохо');
  must(await db.from('ig_children').delete().eq('id', c), 'del child');
  for (const t of tables) {
    const r = await db.from(t).select('*', { count: 'exact', head: true }).eq('child_id', c);
    if (r.count) console.log('после удаления ребёнка остались строки в', t);
  }
  console.log('каскадное удаление: ok');
} finally {
  must(await db.from('ig_parents').delete().eq('id', parent.id), 'cleanup');
  console.log('тестовый профиль удалён');
}
