// Интерфейс поверх 3D: герой и опыт, сердечки, ресурсы, трекер квеста, кнопки действий, джойстик, диалог, журнал.

import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useProgress } from '@react-three/drei';
import { PET_UNLOCK, FRIEND_AFFECTION, xpForNext, type ValleyState } from '../game/valley';
import { petArt, seed, water, star, moon } from './art';
import { NPC_NAMES, QUESTS, questView, rewardText, type NpcId } from '../game/quests';
import { MAX_HEARTS, type Runtime } from '../app/runtime';
import { keyParts, tr } from '../i18n';

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
  const h = tr().hud;
  return (
    <header className="mv-top">
      <div className="mv-hero-card">
        <span className="mv-avatar">🧝</span>
        <div>
          <strong>{h.hero(state.level)}</strong>
          <div className="mv-xp" title={`${state.xp} / ${xpForNext(state.level)}`}>
            <i style={{ width: `${Math.min(100, (state.xp / xpForNext(state.level)) * 100)}%` }} />
          </div>
          <div className="mv-hearts" aria-label={h.hearts(hearts, MAX_HEARTS)}>
            {Array.from({ length: MAX_HEARTS }, (_, i) => (
              <span key={i} className={i < hearts ? '' : 'empty'}>
                ♥
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mv-res" title={saveText}>
        <span aria-label={`${h.starlight}: ${state.starlight}`}><img className="mv-resource-art" src={star} alt="" /> {state.starlight}</span>
        <span aria-label={`${h.seeds}: ${state.seeds}`}><img className="mv-resource-art" src={seed} alt="" /> {state.seeds}</span>
        <span aria-label={`${h.water}: ${state.water}`}><img className="mv-resource-art" src={water} alt="" /> {state.water}</span>
      </div>
      <button onClick={onLog} aria-label={h.log}>
        📜
      </button>
      <button onClick={onNight} aria-label={night ? h.day : h.night}>
        {night ? '☀️' : <img className="mv-resource-art" src={moon} alt="" />}
      </button>
    </header>
  );
}

export function QuestTracker({ state, onOpen }: { state: ValleyState; onOpen(): void }) {
  const view = questView(state);
  const h = tr().hud;
  if (!view.quest)
    return (
      <button className="mv-tracker done" onClick={onOpen}>
        <b>{h.allDone}</b>
        <span>{h.allDoneSub}</span>
      </button>
    );
  const text =
    view.status === 'offer'
      ? `${h.talkTo}: ${NPC_NAMES[view.quest.giver]}`
      : view.status === 'ready'
        ? `${h.returnTo}: ${NPC_NAMES[view.quest.giver]}`
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
  const name = npc === 'king' ? tr().king : NPC_NAMES[npc];
  const face = npc === 'granny' ? '👵' : npc === 'miller' ? '🧑‍🌾' : npc === 'ranger' ? '🏹' : '🍄';
  return (
    <div className="mv-dialog" role="dialog" aria-label={name}>
      <span className="mv-dialog-face">{face}</span>
      <div>
        <b>{name}</b>
        <p>{text}</p>
      </div>
      <button onClick={onClose} autoFocus>
        {tr().hud.ok}
      </button>
    </div>
  );
}

export function QuestLog({ state, onClose }: { state: ValleyState; onClose(): void }) {
  const view = questView(state);
  const h = tr().hud;
  return (
    <div className="mv-modal" role="dialog" aria-label={h.journal} onClick={onClose}>
      <section onClick={(event) => event.stopPropagation()}>
        <header>
          <h2>{h.journalTitle}</h2>
          <button onClick={onClose} aria-label={h.close}>
            ✕
          </button>
        </header>
        <h3>{h.questsTitle}</h3>
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
                      ? `${h.talkTo}: ${NPC_NAMES[quest.giver]}${quest.minLevel && state.level < quest.minLevel ? h.needLevel(quest.minLevel) : ''}`
                      : view.status === 'ready'
                        ? `${h.ready} ${h.returnTo}: ${NPC_NAMES[quest.giver]}`
                        : `${quest.goal}: ${view.have}/${view.need}`}
                  </span>
                )}
                {(current || done) && <small>{h.reward}: {rewardText(quest.reward)}</small>}
              </li>
            );
          })}
        </ol>
        <h3>{h.petsTitle}</h3>
        <div className="mv-pets">
          {state.pets.map((pet) => (
            <div key={pet.id} className={pet.unlocked ? '' : 'locked'}>
              <span><img className="mv-pet-art" src={petArt[pet.id]} alt="" /></span>
              <b>{pet.unlocked ? tr().pets[pet.id] : h.petLocked(PET_UNLOCK[pet.id])}</b>
              {pet.unlocked && (
                <small>
                  {h.friendship} {pet.affection}/100 {pet.affection >= FRIEND_AFFECTION ? '💛' : ''}
                </small>
              )}
            </div>
          ))}
        </div>
        <h3>{h.howTo}</h3>
        <ul className="mv-help">
          {h.help.map((line) => (
            <li key={line}>{keyParts(line).map((part, i) => (i % 2 ? <kbd key={i}>{part}</kbd> : part))}</li>
          ))}
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
        <button className="mv-round jump" onClick={onJump} aria-label={tr().hud.jump}>
          ⤴
        </button>
        <button className="mv-round cast" onClick={onCast} aria-label={tr().hud.cast}>
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
      <p>{tr().hud.loading} {Math.round(progress)}%</p>
      <i>
        <i style={{ width: `${progress}%` }} />
      </i>
      {children}
    </div>
  );
}
