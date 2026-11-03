# Модели Лунной Долины

Все 3D-модели в `models/` — CC0 1.0 (общественное достояние, указывать авторов не обязательно, но мы указываем).
Текст лицензии: `CC0-1.0.txt`.

| Файлы | Автор и пак | Откуда взяты |
|---|---|---|
| `hero`, `fox`, `owl`, `frog`, `slime*`, `imp`, `mushroom-king`, `deer`, `npc-miller`, `npc-ranger` | Quaternius (https://quaternius.com): Ultimate Animated Characters, Ultimate Monsters, Animated Animals | npm `@netforge/asset-library-files@0.2.0` (оптимизированные копии с Poly Pizza, CC0) |
| `npc-granny` | Kenney (https://kenney.nl): Mini Characters | там же |
| `tree-*`, `rock-*`, `mushroom-red`, `flower-red`, `log`, `stump`, `crystal*`, `chest`, `campfire`, `obelisk` | Kenney Nature Kit и Quaternius | там же |
| `house-*`, `inn`, `mill`, `bell-tower`, `stable`, `well`, `bench-1`, `bonfire-lit`, `gazebo`, `marketstand-*`, `hay`, `cart`, `barrel`, `crate`, `fence`, `cauldron` | Quaternius: Medieval Village Pack | glTF-конвертация из репозитория A5308Y/COLCOM (assets/models/village, CC0) |
| `corn-*`, `beet-*`, `wheat-*`, `rice-*` | Quaternius: Nature Crops Pack | там же (assets/models/crops) |
| `bush-1`, `lilypad`, `grass` | Quaternius: Ultimate Nature Pack | там же (assets/models/nature) |

Все файлы пережаты в GLB с meshopt (glTF-Transform). Загрузчик drei `useGLTF` распаковывает meshopt сам.
