/** Лицо профиля: фото, если взрослый его загрузил, иначе эмодзи-аватар. */
export function Face({ photo, avatar, size = 48, className = '' }: { photo?: string | null; avatar: string; size?: number; className?: string }) {
  return (
    <span className={`face ${className}`} style={{ width: size, height: size, fontSize: size * 0.58 }} aria-hidden="true">
      {photo ? <img src={photo} alt="" width={size} height={size} /> : avatar}
    </span>
  );
}
