import bunny from '../../assets/characters/bunny.svg';
import squirrel from '../../assets/characters/squirrel.svg';
import dolphin from '../../assets/characters/dolphin.svg';
import carrot from '../../assets/icons/carrot.svg';
import nut from '../../assets/icons/nut.svg';
import fish from '../../assets/icons/fish.svg';
import star from '../../assets/icons/star.svg';

const images: Record<string, string> = { '🐰': bunny, '🐿️': squirrel, '🐬': dolphin, '🥕': carrot, '🌰': nut, '🐟': fish, '⭐': star };
export const art = (symbol: string) => images[symbol] ? `<img class="cg-art" src="${images[symbol]}" alt="" draggable="false">` : symbol;
