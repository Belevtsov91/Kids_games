import { Link } from 'react-router';

const FACTS = [
  { title: 'Один аккаунт на семью', text: 'У каждого ребёнка свой профиль и свои сохранения.' },
  { title: 'Игры по возрасту', text: 'От 3 до 15 лет, возраст указан на каждой игре.' },
  { title: 'Прогресс не теряется', text: 'Остров, сад и квесты сохраняются между играми.' },
  { title: 'Телефон, планшет, компьютер', text: 'Можно поставить на экран телефона как приложение.' },
];

/** Короткий блок для взрослых внизу страницы. */
export function ParentsNote() {
  return (
    <section className="wl-block">
      <div className="wl-wrap">
        <div className="wl-parents">
          <div>
            <h2>Для родителей</h2>
            <p>Аккаунт заводит взрослый, а дети выбирают свой профиль и играют.</p>
            <Link to="/parents" className="wl-btn wl-btn-ghost wl-btn-sm wl-parents-more">Подробнее для родителей</Link>
          </div>
          <div className="wl-facts">
            {FACTS.map((f) => (
              <div key={f.title} className="wl-fact">
                <b>{f.title}</b>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
