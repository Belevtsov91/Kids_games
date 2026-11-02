import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

/** На узком экране (телефон вертикально) отодвигаем камеру, чтобы остров влез целиком. */
export function CameraFit() {
  const { camera, size } = useThree();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const aspect = size.width / size.height;
    if (aspect < 1) camera.position.multiplyScalar(Math.min(1.7, 1 / aspect));
  }, [camera, size]);
  return null;
}
