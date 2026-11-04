// Всплывающие сообщения внизу экрана: не больше трёх сразу, каждое исчезает через 3,2 секунды.

import { useCallback, useRef, useState } from 'react';

export function useToasts() {
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const toastId = useRef(0);
  const toast = useCallback((text: string) => {
    const id = ++toastId.current;
    setToasts((items) => [...items.slice(-2), { id, text }]);
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3200);
  }, []);
  return { toasts, toast };
}
