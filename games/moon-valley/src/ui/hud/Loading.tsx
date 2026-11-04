// Экран загрузки 3D-моделей с полоской прогресса.

import type { ReactNode } from 'react';
import { useProgress } from '@react-three/drei';
import { tr } from '../../i18n';

export function Loading({ children }: { children?: ReactNode }) {
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="mv-loading">
      <span className="mv-moon">☾</span>
      <p>{tr().hud.loading} {Math.round(progress)}%</p>
      <i>
        <i style={{ width: `${progress}%` }} />
      </i>
      {children}
    </div>
  );
}
