import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';

interface Props {
  /** id игры; без него ссылка ведёт на список всех игр. */
  gameId?: string;
  className?: string;
  children: ReactNode;
}

/** Ссылка на игру: кто вошёл — сразу в игру (или в меню), гость — на регистрацию. */
export function GameLink({ gameId, className, children }: Props) {
  const { me } = useAuth();
  const to = me ? (gameId ? `/play/${gameId}` : '/dashboard') : '/register';
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}
