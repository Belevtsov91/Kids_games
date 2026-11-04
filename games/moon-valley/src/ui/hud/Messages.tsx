// Сообщения: всплывающие подсказки внизу и диалог с жителем или Грибным королём.

import { NPC_NAMES, type NpcId } from '../../game/quests';
import { tr } from '../../i18n';

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
