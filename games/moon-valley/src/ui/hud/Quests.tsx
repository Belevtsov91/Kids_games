// Квесты на экране: трекер текущего квеста в углу и журнал (все квесты, питомцы, подсказки по управлению).

import { FRIEND_AFFECTION, PET_UNLOCK, type ValleyState } from '../../game/valley';
import { NPC_NAMES, QUESTS, questView, rewardText } from '../../game/quests';
import { keyParts, tr } from '../../i18n';
import { petArt } from './art';

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
