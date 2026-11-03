// Интерфейс поверх 3D: герой и опыт, сердечки, ресурсы, трекер квеста, кнопки действий, джойстик, диалог, журнал.

import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useProgress } from '@react-three/drei';
import { PET_EMOJI, PET_UNLOCK, FRIEND_AFFECTION, xpForNext, type ValleyState } from '../game/valley';
import { NPC_NAMES, QUESTS, questView, rewardText, type NpcId } from '../game/quests';
import { MAX_HEARTS, type Runtime } from '../app/runtime';

export function TopBar({
  state,
  hearts,
  night,
  saveText,
  onNight,
  onLog,
}: {
  state: ValleyState;
  hearts: number;
  night: boolean;
  saveText: string;
  onNight(): void;
  onLog(): void;
}) {
  return (
    <header className="mv-top">
      <div className="mv-hero-card">
        <span className="mv-avatar">🧝</span>
        <div>
          <strong>Хранитель · ур. {state.level}</strong>
          <div className="mv-xp" title={`${state.xp} / ${xpForNext(state.level)}`}>
            <i style={{ width: `${Math.min(100, (state.xp / xpForNext(state.level)) * 100)}%` }} />
          </div>
          <div className="mv-hearts" aria-label={`Сердечки: ${hearts} из ${MAX_HEARTS}`}>
            {Array.from({ length: MAX_HEARTS }, (_, i) => (
              <span key={i} className={i < hearts ? '' : 'empty'}>
                ♥
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mv-res" title={saveText}>
        <span>✨ {state.starlight}</span>
        <span>🌱 {state.seeds}</span>
        <span>💧 {state.water}</span>
      </div>
      <button onClick={onLog} aria-label="Журнал заданий">
        📜
      </button>
      <button onClick={onNight} aria-label={night ? 'Сделать день' : 'Сделать ночь'}>
        {night ? '☀️' : '🌙'}
      </button>
    </header>
  );
}

export function QuestTracker({ state, onOpen }: { state: ValleyState; onOpen(): void }) {
  const view = questView(state);
  if (!view.quest)
    return (
      <button className="mv-tracker done" onClick={onOpen}>
        <b>Все задания выполнены!</b>
        <span>Ты главный Хранитель долины 🌙</span>
      </button>
    );
  const text =
    view.status === 'offer'
      ? `Поговори: ${NPC_NAMES[view.quest.giver]}`
      : view.status === 'ready'
        ? `Вернись к: ${NPC_NAMES[view.quest.giver]}`
        : `${view.quest.goal}: ${view.have}/${view.need}`;
  return (
    <button className={`mv-tracker ${view.status}`} onClick={onOpen}>
      <b>
        {view.status === 'offer' ? '❗' : view.status === 'ready' ? '❓' : '📜'} {view.quest.title}
      </b>
      <span>{text}</span>
      {view.status === 'active' && (
        <i className="mv-tracker-bar">
          <i style={{ width: `${(view.have / view.need) * 100}%` }} />
        </i>
      )}
    </button>
  );
}

export function Toasts({ items }: { items: { id: number; text: string }[] }) {
  return (
    <div className="mv-toasts" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className="mv-toast">
          {item.text}
        </div>
      ))}
    </div>
  );
}

export function Dialog({ npc, text, onClose }: { npc: NpcId | 'king'; text: string; onClose(): void }) {
  const name = npc === 'king' ? 'Грибной король' : NPC_NAMES[npc];
  const face = npc === 'granny' ? '👵' : npc === 'miller' ? '🧑‍🌾' : npc === 'ranger' ? '🏹' : '🍄';
  return (
    <div className="mv-dialog" role="dialog" aria-label={name}>
      <span className="mv-dialog-face">{face}</span>
      <div>
        <b>{name}</b>
        <p>{text}</p>
      </div>
      <button onClick={onClose} autoFocus>
        Хорошо
      </button>
    </div>
  );
}

export function QuestLog({ state, onClose }: { state: ValleyState; onClose(): void }) {
  const view = questView(state);
  return (
    <div className="mv-modal" role="dialog" aria-label="Журнал" onClick={onClose}>
      <section onClick={(event) => event.stopPropagation()}>
        <header>
          <h2>📜 Журнал Хранителя</h2>
          <button onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>
        <h3>Задания</h3>
        <ol className="mv-log">
          {QUESTS.map((quest, index) => {
            const done = index < state.quest.index;
            const current = index === state.quest.index;
            return (
              <li key={quest.id} className={done ? 'done' : current ? 'current' : 'locked'}>
                <b>
                  {done ? '✅' : current ? '⭐' : '🔒'} {quest.title}
                </b>
                {current && (
                  <span>
                    {view.status === 'offer'
                      ? `Поговори: ${NPC_NAMES[quest.giver]}${quest.minLevel && state.level < quest.minLevel ? ` (нужен ${quest.minLevel} уровень)` : ''}`
                      : view.status === 'ready'
                        ? `Готово! Вернись к: ${NPC_NAMES[quest.giver]}`
                        : `${quest.goal}: ${view.have}/${view.need}`}
                  </span>
                )}
                {(current || done) && <small>Награда: {rewardText(quest.reward)}</small>}
              </li>
            );
          })}
        </ol>
        <h3>Питомцы</h3>
        <div className="mv-pets">
          {state.pets.map((pet) => (
            <div key={pet.id} className={pet.unlocked ? '' : 'locked'}>
              <span>{PET_EMOJI[pet.id]}</span>
              <b>{pet.unlocked ? pet.name : `Придёт на ур. ${PET_UNLOCK[pet.id]}`}</b>
              {pet.unlocked && (
                <small>
                  дружба {pet.affection}/100 {pet.affection >= FRIEND_AFFECTION ? '💛' : ''}
                </small>
              )}
            </div>
          ))}
        </div>
        <h3>Как играть</h3>
        <ul className="mv-help">
          <li>
            <kbd>WASD</kbd> или стрелки: идти, <kbd>Shift</kbd>: шагом, <kbd>Пробел</kbd>: прыжок
          </li>
          <li>
            <kbd>E</kbd>: действие рядом (грядка, житель, кристалл, сундук), <kbd>F</kbd>: волна света
          </li>
          <li>Тяни мышью по экрану, чтобы повернуть камеру, колесо: ближе и дальше</li>
          <li>На телефоне: джойстик слева, кнопки справа, камера пальцем</li>
        </ul>
      </section>
    </div>
  );
}

/** Экранный джойстик для пальца. */
export function Joystick({ runtime }: { runtime: Runtime }) {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const move = (event: ReactPointerEvent) => {
    const rect = base.current?.getBoundingClientRect();
    if (!rect) return;
    const radius = rect.width / 2;
    let dx = (event.clientX - (rect.left + radius)) / radius;
    let dy = (event.clientY - (rect.top + radius)) / radius;
    const length = Math.hypot(dx, dy);
    if (length > 1) {
      dx /= length;
      dy /= length;
    }
    runtime.input.moveX = dx;
    runtime.input.moveY = -dy;
    runtime.input.walk = false;
    if (knob.current) knob.current.style.transform = `translate(${dx * radius * 0.55}px, ${dy * radius * 0.55}px)`;
  };
  const release = () => {
    pointer.current = null;
    runtime.input.moveX = 0;
    runtime.input.moveY = 0;
    if (knob.current) knob.current.style.transform = '';
  };
  return (
    <div
      ref={base}
      className="mv-joystick"
      onPointerDown={(event) => {
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={(event) => pointer.current === event.pointerId && move(event)}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div ref={knob} />
    </div>
  );
}

export function ActionButtons({
  label,
  onAct,
  onCast,
  onJump,
}: {
  label: string | null;
  onAct(): void;
  onCast(): void;
  onJump(): void;
}) {
  return (
    <div className="mv-actions">
      {label && (
        <button className="mv-act" onClick={onAct}>
          <kbd>E</kbd> {label}
        </button>
      )}
      <div>
        <button className="mv-round jump" onClick={onJump} aria-label="Прыжок">
          ⤴
        </button>
        <button className="mv-round cast" onClick={onCast} aria-label="Волна света">
          ✨<small>F</small>
        </button>
      </div>
    </div>
  );
}

export function Loading({ children }: { children?: ReactNode }) {
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="mv-loading">
      <span className="mv-moon">☾</span>
      <p>Долина просыпается… {Math.round(progress)}%</p>
      <i>
        <i style={{ width: `${progress}%` }} />
      </i>
      {children}
    </div>
  );
}
