import { isPlaceholder } from '../site';

/** Значение из SITE; заглушка подсвечивается жёлтым, чтобы её было видно до публикации. */
export function Fill({ value }: { value: string }) {
  return isPlaceholder(value) ? <span className="info-fill">{value}</span> : <>{value}</>;
}
