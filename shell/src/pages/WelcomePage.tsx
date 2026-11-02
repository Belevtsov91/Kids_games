import type { CSSProperties } from 'react';
import { Link } from 'react-router';

const FLOATERS = ['🎨', '🧩', '🚀', '⭐', '🦄', '🎈'];

export function WelcomePage() {
  return (
    <main className="welcome">
      <div className="welcome-floaters" aria-hidden="true">
        {FLOATERS.map((emoji, i) => (
          <span key={emoji} style={{ '--i': i } as CSSProperties}>
            {emoji}
          </span>
        ))}
      </div>
      <div className="welcome-hero">
        <div className="welcome-mascot" aria-hidden="true">
          🐻
        </div>
        <h1>Привет! Давай играть!</h1>
        <p>Рисуем, строим и учимся. Игры для детей от 3 до 15 лет.</p>
        <div className="welcome-actions">
          <Link to="/register" className="btn btn-primary">
            Регистрация
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Войти
          </Link>
        </div>
        <p className="welcome-note">Аккаунт заводит взрослый, а дети выбирают свой профиль.</p>
      </div>
    </main>
  );
}
