"""Copy approved SVGs and prepare light, game-owned illustration assets."""
from pathlib import Path
import json
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'visual-lab'
sys.path.insert(0, str(LAB / '.tools/python'))
from PIL import Image

def copy(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)

def webp(source, target, width=1200):
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as im:
        im.thumbnail((width, width))
        im.convert('RGB').save(target, 'WEBP', quality=88, method=6)

assets = json.loads((LAB / 'manifest-vectors-v3.json').read_text(encoding='utf-8'))['assets']
for asset in assets:
    game, category = asset['game'], asset['category']
    source = LAB / asset['path']
    if category == 'coloring-pages' and source.with_name(source.name.replace('-v3', '-v4')).exists():
        source = source.with_name(source.name.replace('-v3', '-v4'))
    dest = ROOT / 'games' / game / 'assets'
    if category in ('characters', 'icons', 'textures', 'coloring-pages'):
        copy(source, dest / category / source.name.replace('-v2', '').replace('-v3', '').replace('-v4', ''))
        if category == 'coloring-pages':
            target_preview = dest / category / (source.stem.replace('-v3', '').replace('-v4', '') + '.webp')
            if '-v4' not in source.stem or not target_preview.exists():
                webp(LAB / asset['preview'], target_preview, 600)
    elif category == 'covers':
        cover = ROOT / 'games/moon-valley/assets/moon-valley-cover.png' if game == 'moon-valley' else LAB / game / 'covers/cover-v2.png'
        webp(cover, dest / 'cover.webp', 960)
    elif category == 'habitats':
        webp(LAB / asset['source'], dest / 'habitats' / (source.stem.replace('-v3', '') + '.webp'))

# Each game owns its copies; no runtime imports across game boundaries.
for src_game, name, dest_name in [('animal-orchestra','cat','cat'),('animal-orchestra','dog','dog'),('animal-orchestra','elephant','elephant'),('counting','bunny','rabbit'),('counting','squirrel','squirrel'),('counting','dolphin','dolphin'),('moon-valley','owl','owl')]:
    copy(LAB / src_game / 'characters' / (name + '-v2.svg'), ROOT / 'games/who-lives-where/assets/characters' / (dest_name + '.svg'))
copy(LAB / 'counting/icons/fish-v2.svg', ROOT / 'games/who-lives-where/assets/characters/fish.svg')
for game, title in [('puzzles','turtle-bakery'),('moon-valley','moon-garden'),('animal-orchestra','forest-concert'),('space-gardener','comet-greenhouse')]:
    source = LAB / game / 'covers/cover-v2.png'
    webp(source, ROOT / 'games/puzzles/assets' / (title + '.webp'), 1536)

words = {'КОТ':('animal-orchestra','characters/cat'),'СОВА':('moon-valley','characters/owl'),'ЛИСА':('moon-valley','characters/fox'),'СЛОН':('animal-orchestra','characters/elephant'),'ЗАЯЦ':('counting','characters/bunny'),'ДЕЛЬФИН':('counting','characters/dolphin'),'ПИНГВИН':('who-lives-where','characters/penguin'),'ЧЕРЕПАХА':('who-lives-where','characters/turtle'),'МОРКОВЬ':('counting','icons/carrot'),'РЫБА':('counting','icons/fish'),'ЛУНА':('moon-valley','icons/moon')}
for word, (game, name) in words.items():
    copy(LAB / game / (name + '-v2.svg'), ROOT / 'games/letter-eater/assets/words' / (word + '.svg'))
print('Prepared game-owned illustrations, SVGs and coloring pages.')
