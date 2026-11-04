import { useEffect, useState } from 'react';
import type { GameSdk } from '@ig/sdk';
import type { Tool } from '../game/blocks';
import { questState } from '../game/quests';
import type { BlockType, TreeKind } from '../game/world';
import { sound } from '../audio/sound';
import Scene from '../scene/Scene';
import { Dock } from '../ui/Dock';
import { LoadingScreen } from '../ui/LoadingScreen';
import { NewIslandDialog } from '../ui/NewIslandDialog';
import { Notifications } from '../ui/Notifications';
import { QuestsPanel } from '../ui/QuestsPanel';
import { TopBar } from '../ui/TopBar';
import { WelcomeDialog } from '../ui/WelcomeDialog';
import { useIslandActions } from './useIslandActions';
import { useIslandSave } from './useIslandSave';
import { useSceneObjects } from './useSceneObjects';
import { useHint, useQuestToasts } from './useTimedMessages';
import '../styles/index.css';
import { tr } from '../i18n';
import { reportQuests } from './rewards';

// Корень игры: связывает состояние острова, сцену и панели интерфейса.

export default function App({ sdk, paused }: { sdk: GameSdk; paused: boolean }) {
  const island = useIslandSave(sdk);
  const objects = useSceneObjects();
  const [tool, setTool] = useState<Tool>('build');
  const [material, setMaterial] = useState<BlockType>('grass');
  const [treeKind, setTreeKind] = useState<TreeKind>('round');
  const [showQuests, setShowQuests] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [hint, setHint] = useHint();
  const toasts = useQuestToasts(island, (done, total) => reportQuests(sdk, done, total));
  const actions = useIslandActions({ island, objects, tool, material, treeKind, showHint: setHint });

  // Браузер разрешает звук только после первого касания.
  useEffect(() => {
    const start = () => sound.startAmbience();
    window.addEventListener('pointerdown', start, { once: true });
    return () => window.removeEventListener('pointerdown', start);
  }, []);

  const pickTool = (id: Tool) => {
    setTool(id);
    setHint(tr().tools[id][1]);
    sound.click();
  };

  const quests = questState(island.world, island.stats, island.achieved);
  const { night } = island;

  return (
    <div className={`ib-root${night ? ' ib-night' : ''}`}>
      <Scene
        world={island.world}
        tool={tool}
        material={material}
        night={night}
        paused={paused}
        floaters={objects.floaters}
        effects={objects.effects}
        onTap={actions.handleTap}
        onFloaterGone={objects.removeFloater}
        onFloaterPush={() => sound.push()}
        onCrateLand={() => sound.thud()}
        onEffectDone={objects.removeEffect}
      />

      <TopBar
        status={island.status}
        night={night}
        canUndo={actions.canUndo}
        questsOpen={showQuests}
        questsDone={quests.filter((q) => q.done).length}
        onUndo={actions.undo}
        onToggleNight={actions.toggleNight}
        onToggleQuests={() => {
          setShowQuests((v) => !v);
          sound.click();
        }}
        onNewIsland={() => {
          setShowNew(true);
          sound.click();
        }}
      />

      {showQuests && <QuestsPanel quests={quests} />}
      <Notifications toasts={toasts} hint={hint} />
      <Dock tool={tool} material={material} treeKind={treeKind} onTool={pickTool} onMaterial={setMaterial} onTreeKind={setTreeKind} />

      {showNew && (
        <NewIslandDialog
          onPick={(kind) => {
            actions.newIsland(kind);
            setShowNew(false);
          }}
          onClose={() => setShowNew(false)}
        />
      )}
      {!island.ready && <LoadingScreen />}
      {island.isNew && (
        <WelcomeDialog
          onStart={() => {
            island.dismissNew();
            sound.quest();
            sound.startAmbience();
          }}
        />
      )}
    </div>
  );
}
