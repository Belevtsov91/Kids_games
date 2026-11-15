// Математика глобуса: ортографическая проекция (так выглядит шар издалека)
// и обрезка суши по краю видимой половины.

export interface View {
  /** Точка, которая смотрит прямо на нас. */
  lat: number;
  lon: number;
}

export interface Projected {
  /** Координаты на единичном круге: x вправо, y вверх. */
  x: number;
  y: number;
  /** Точка на видимой стороне шара. */
  front: boolean;
}

const R = Math.PI / 180;

export const project = (lat: number, lon: number, view: View): Projected => {
  const p = lat * R;
  const p0 = view.lat * R;
  const dl = (lon - view.lon) * R;
  const x = Math.cos(p) * Math.sin(dl);
  const y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(dl);
  const depth = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(dl);
  return { x, y, front: depth >= 0 };
};

/** Точку с обратной стороны прижимаем к краю шара: так контур суши обрезается по горизонту. */
export const clampToEdge = (pt: Projected): Projected => {
  if (pt.front) return pt;
  const len = Math.hypot(pt.x, pt.y) || 1;
  return { x: pt.x / len, y: pt.y / len, front: false };
};

/** Добавляет промежуточные точки, чтобы длинные рёбра ложились по шару, а не по хорде. */
export const densify = (ring: [number, number][], step = 3): [number, number][] => {
  const out: [number, number][] = [];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length];
    const parts = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / step));
    for (let k = 0; k < parts; k++) out.push([a[0] + ((b[0] - a[0]) * k) / parts, a[1] + ((b[1] - a[1]) * k) / parts]);
  });
  return out;
};

/** Контур суши в координатах SVG (центр cx, cy, радиус r); null — материк целиком за горизонтом. */
export const ringPath = (ring: [number, number][], view: View, cx: number, cy: number, r: number): string | null => {
  const pts = ring.map(([lat, lon]) => project(lat, lon, view));
  if (!pts.some((p) => p.front)) return null;
  return (
    pts
      .map(clampToEdge)
      .map((p, i) => `${i ? 'L' : 'M'}${(cx + p.x * r).toFixed(1)},${(cy - p.y * r).toFixed(1)}`)
      .join('') + 'Z'
  );
};

/** Разница долгот, приведённая к −180…180: глобус крутится коротким путём. */
export const lonDelta = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180;

/** Средняя точка нескольких мест — куда повернуть глобус, чтобы все были видны. */
export const centerOf = (points: { lat: number; lon: number }[]): View => {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of points) {
    x += Math.cos(p.lat * R) * Math.cos(p.lon * R);
    y += Math.cos(p.lat * R) * Math.sin(p.lon * R);
    z += Math.sin(p.lat * R);
  }
  return { lat: Math.atan2(z, Math.hypot(x, y)) / R, lon: Math.atan2(y, x) / R };
};

/** Насколько приблизить глобус на маршруте: дом крупно, Европа поближе, мир целиком. */
export const REGION_ZOOM = { home: 2.4, europe: 1.8, world: 1 } as const;

/** Увеличение, при котором все точки видны вокруг центра (с запасом у края). */
export const fitZoom = (center: View, points: { lat: number; lon: number }[]) => {
  const far = Math.max(0, ...points.map((p) => {
    const q = project(p.lat, p.lon, center);
    return q.front ? Math.asin(Math.min(1, Math.hypot(q.x, q.y))) / R : 90;
  }));
  return Math.max(1, Math.min(3, 0.85 / Math.sin(Math.min(far + 8, 90) * R)));
};
