import type { GameSdk } from '@ig/sdk';
import { TOY_KINDS, type ToyKind } from '../game/toys';

// Успехи песочницы (sdk.progress): наклейки за первую игрушку, за десять игрушек и за все виды.
// Навык «пространство» — раз в пять брошенных игрушек, чтобы не засыпать сервер событиями.

export function createRewards(sdk: GameSdk) {
  let drops = 0;
  const kinds = new Set<ToyKind>();
  return (kind: ToyKind) => {
    drops++;
    kinds.add(kind);
    if (drops === 1) sdk.progress.sticker('first-toy');
    if (drops === 10) sdk.progress.sticker('ten-toys');
    if (kinds.size === TOY_KINDS.length) sdk.progress.sticker('all-toys');
    if (drops % 5 === 0) sdk.progress.skill('space', true);
  };
}
