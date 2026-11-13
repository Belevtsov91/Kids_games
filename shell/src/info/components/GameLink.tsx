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
  const target = gameId ? `/play/${gameId}` : '/dashboard';
  // Гость после регистрации вернётся к выбранной игре.
  return (
    <Link to={me ? target : '/register'} state={me ? undefined : { from: target }} className={className}>
      {children}
    </Link>
  );
}
