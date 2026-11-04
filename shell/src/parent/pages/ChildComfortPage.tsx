import { useEffect, useState } from 'react';
import { useFamilyText } from '@/family/text';
import { VoiceRecorder } from '@/family/VoiceRecorder';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { PageHead, Panel, ToggleRow } from '../ui/bits';
import { useChild } from './useChild';

type Mode = 'auto' | 'on' | 'off';
const modeOf = (v: boolean | null): Mode => (v === null ? 'auto' : v ? 'on' : 'off');
const valueOf = (m: Mode) => (m === 'auto' ? null : m === 'on');
const thisYear = new Date().getFullYear();

/** Удобство: режим малыша, громкость, меньше движения, крупные кнопки, месяц рождения. */
export function ChildComfortPage() {
  const p = useParentText();
  const c = p.comfort;
  const voice = useFamilyText().voice;
  const { toast } = useParent();
  const { id, child, save } = useChild();
  const [vol, setVol] = useState(child?.comfort);
  useEffect(() => setVol(child?.comfort), [child]);
  if (!child || !vol) return null;

  const slider = (key: 'musicVolume' | 'effectsVolume', label: string) => (
    <label className="pa-field">
      <span>{label}</span>
      <div className="pa-range">
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={vol[key]}
          aria-label={label}
          onChange={(e) => setVol({ ...vol, [key]: Number(e.target.value) })}
          onPointerUp={(e) => void save({ [key]: Number((e.target as HTMLInputElement).value) })}
          onKeyUp={(e) => void save({ [key]: Number((e.target as HTMLInputElement).value) })}
        />
        <output>{vol[key]}%</output>
      </div>
    </label>
  );

  return (
    <>
      <PageHead back={{ to: `/parent/kids/${id}`, label: child.name }} eyebrow={p.child.eyebrow} title={p.tiles3.comfort[0]} />
      <div className="pa-cols">
        <Panel title={c.toddler} lead={c.toddlerLead}>
          <div className="pa-seg pa-seg-wide" role="radiogroup" aria-label={c.toddler}>
            {(['auto', 'on', 'off'] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={modeOf(child.toddler) === m} onClick={() => void save({ toddler: valueOf(m) })}>
                {c.toddlerModes[m]}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title={c.sound} lead={c.soundLead}>
          {slider('musicVolume', c.music)}
          {slider('effectsVolume', c.effects)}
        </Panel>
        <Panel>
          <ToggleRow id="reduce-motion" label={c.motion} hint={c.motionLead} checked={child.comfort.reduceMotion} onChange={(v) => void save({ reduceMotion: v })} />
          <ToggleRow id="big-buttons" label={c.big} hint={c.bigLead} checked={child.comfort.bigButtons} onChange={(v) => void save({ bigButtons: v })} />
        </Panel>
        <Panel title={c.birth} lead={c.birthLead}>
          <label className="pa-field">
            <span>{c.birth}</span>
            <input
              type="month"
              min={`${thisYear - 16}-01`}
              max={`${thisYear - 2}-12`}
              value={child.birthMonth ?? ''}
              onChange={(e) => void save({ birthMonth: e.target.value || null })}
            />
          </label>
          {!child.birthMonth && <p className="pa-empty">{c.birthNone}</p>}
        </Panel>
        <Panel title={voice.title} lead={voice.lead}>
          <VoiceRecorder childId={id} toast={toast} />
        </Panel>
      </div>
    </>
  );
}
