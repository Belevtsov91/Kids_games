import { useRef, useState } from 'react';
import { Face } from './Face';

const SIZE = 256;

/** Квадрат 256×256 из середины картинки, JPEG ~20–40 КБ: столько и хранит сервер. */
async function squeeze(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  canvas.getContext('2d')!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}

interface Props {
  photo: string | null;
  avatar: string;
  onChange: (photo: string | null) => void;
  text: { pick: string; remove: string; bad: string; hint: string };
}

/** Загрузить фото профиля с устройства или убрать его (тогда снова виден эмодзи). */
export function PhotoPicker({ photo, avatar, onChange, text }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [bad, setBad] = useState(false);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      onChange(await squeeze(file));
      setBad(false);
    } catch {
      setBad(true);
    }
  };
  return (
    <div className="pa-photo">
      <Face photo={photo} avatar={avatar} size={96} />
      <div className="pa-photo-actions">
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
        <button type="button" className="pa-btn" onClick={() => input.current?.click()}>📷 {text.pick}</button>
        {photo && (
          <button type="button" className="pa-btn pa-btn-quiet" onClick={() => onChange(null)}>
            {text.remove}
          </button>
        )}
        <small>{bad ? text.bad : text.hint}</small>
      </div>
    </div>
  );
}
