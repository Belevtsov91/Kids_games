/** Плюшевая аватарка вместо эмодзи. Картинки нарисованы в Blender (tools/blender/build_avatars.py).
 *  В базе по-прежнему хранится эмодзи: для знакомого зверя показываем картинку, для остального — сам символ. */
import bear from './avatars/bear.webp';
import bunny from './avatars/bunny.webp';
import fox from './avatars/fox.webp';
import frog from './avatars/frog.webp';
import koala from './avatars/koala.webp';
import lion from './avatars/lion.webp';
import monkey from './avatars/monkey.webp';
import octopus from './avatars/octopus.webp';
import panda from './avatars/panda.webp';
import tiger from './avatars/tiger.webp';
import unicorn from './avatars/unicorn.webp';
import whale from './avatars/whale.webp';

const IMAGES: Record<string, string> = {
  '🐻': bear, '🐰': bunny, '🦊': fox, '🐼': panda, '🐸': frog, '🦁': lion,
  '🐯': tiger, '🐨': koala, '🐵': monkey, '🦄': unicorn, '🐙': octopus, '🐳': whale,
};

export function Plush({ value, className = '' }: { value: string; className?: string }) {
  const src = IMAGES[value];
  if (!src) return <>{value}</>;
  return <img className={`plush ${className}`} src={src} alt="" width={256} height={256} draggable={false} decoding="async" />;
}
