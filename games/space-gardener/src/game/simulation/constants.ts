// Размеры мира и настройки физики полива.

export const WORLD_SIZE = 800;
export const STEP_MS = 1000 / 60;
export const DROP_R = 7;
export const LINE_W = 12;
export const WALL_W = 20;
export const PLANK_W = 16;
export const SPINNER_W = 14;
export const POT_H = 80;
export const POT_WALL = 14;
/** Предел скорости капли: меньше суммы радиуса капли и полутолщины линии, чтобы капли не пролетали сквозь линии. */
export const MAX_SPEED = 10;
export const EMIT_EVERY_MS = 75;
/** Радиус притяжения чёрной дыры в её радиусах и радиус, внутри которого капля исчезает. */
export const HOLE_PULL = 3;
export const HOLE_SWALLOW = 0.55;
export const HOLE_FORCE = 0.00012;
/** Если капли замерли или долго не долетают, попытка заканчивается. */
export const IDLE_STEPS = 100;
export const AFTER_EMIT_LIMIT_MS = 20000;
