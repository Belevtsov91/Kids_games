'use strict';
const worlds = [
  ['moon-valley','Лунная долина','Сад звёздного света','fantasy','Волшебство','Лунный свет, мягкая шерсть и сияющие лепестки.'],
  ['island-builder','Остров-конструктор','Бухта тёплых фонарей','create','Созидание','Прозрачная вода, тёплый камень и дерево, согретое солнцем.'],
  ['animal-orchestra','Звериный оркестр','Большой лесной концерт','nature','Музыка','Бархатный занавес, деревянные инструменты и маленькие музыканты.'],
  ['counting','Считай и играй','Маленькие открытия','nature','Открытия','Солнечный огород, любопытные друзья и пять морковок для счёта.'],
  ['drawing','Рисовалка','Мастерская воображения','create','Творчество','Фактура бумаги, густые краски и свет из окна мастерской.'],
  ['letter-eater','Буквоед','Печенья для монстрика','fantasy','Буквы','Пушистый монстрик и золотистые печенья в уютной кондитерской.'],
  ['playground3d','3D-песочница','Лаборатория игрушек','create','Эксперименты','Натуральное дерево, стеклянные шарики и игра равновесия.'],
  ['puzzles','Пазлы','Пекарня на спине черепахи','fantasy','Истории','Маленькая пекарня путешествует через цветущий сказочный луг.'],
  ['space-gardener','Космический садовник','Оранжерея среди комет','fantasy','Космос','Стекло, латунь и хрупкий цветок среди далёких планет.'],
  ['who-lives-where','Кто где живёт','У каждого есть дом','nature','Природа','Лесной дом, живой пруд и тёплый свет между ветвями.']
];
const grid = document.getElementById('world-grid');
const viewer = document.getElementById('viewer');
const reveal = document.getElementById('reveal');
for (const [id,title,subtitle,category,label] of worlds) {
  const article = document.createElement('article');
  article.className = 'world-card';
  article.dataset.category = category;
  article.innerHTML = `<button class="art-button" type="button" data-open="${id}" aria-label="Рассмотреть ${title}"><img src="${id}/covers/cover-v2.png" alt="${subtitle}" loading="lazy" decoding="async" width="1536" height="1024"></button><div class="card-meta"><div><h3>${title}</h3><p>${subtitle}</p></div><span>${label}</span></div>`;
  grid.append(article);
}
function updateReveal() {
  document.getElementById('compare').style.setProperty('--split', `${reveal.value}%`);
  reveal.setAttribute('aria-valuetext', `Предыдущая версия: ${reveal.value} процентов`);
}
function openWorld(id) {
  const world = worlds.find(item => item[0] === id);
  if (!world) return;
  const [,title,subtitle,,,description] = world;
  document.querySelector('.before-label').textContent = 'Первый эскиз';
  document.querySelector('.after-label').textContent = 'Новый мир';
  document.getElementById('compare').classList.remove('vector-compare');
  document.getElementById('compare').style.maxWidth = '';
  document.getElementById('compare').style.aspectRatio = '3 / 2';
  document.getElementById('original').textContent = 'Открыть PNG ↗';
  document.getElementById('viewer-title').textContent = title;
  document.getElementById('viewer-kicker').textContent = subtitle;
  document.getElementById('viewer-description').textContent = description;
  const after = document.getElementById('after');
  const before = document.getElementById('before');
  after.src = `${id}/covers/cover-v2.png`;
  after.alt = `${title} — новая иллюстрация`;
  before.src = `${id}/covers/cover.svg`;
  before.alt = `${title} — исходный SVG-эскиз`;
  document.getElementById('original').href = after.src;
  reveal.value = 35;
  updateReveal();
  viewer.showModal();
}
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-open]');
  if (trigger) openWorld(trigger.dataset.open);
});
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let visible = 0;
  for (const card of grid.children) {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
    if (!card.hidden) visible++;
  }
  document.getElementById('count').textContent = visible === 10 ? '10 миров' : `${visible} мира`;
}));
reveal.addEventListener('input', updateReveal);
viewer.querySelector('.close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => {
  if (event.target !== viewer) return;
  const bounds = viewer.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
});

const vectorGrid = document.getElementById('vector-grid');
const gameTitles = Object.fromEntries(worlds.map(world => [world[0], world[1]]));
function renderVectors(category) {
  vectorGrid.replaceChildren();
  const items = vectorAssets.filter(asset => asset.category === category);
  for (const asset of items) {
    const card = document.createElement('article');
    card.className = 'vector-card';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'vector-art';
    button.setAttribute('aria-label', `${asset.title} — ${gameTitles[asset.game]}: сравнить SVG`);
    const img = document.createElement('img');
    img.src = asset.preview || asset.path;
    img.alt = asset.title;
    img.width = asset.width;
    img.height = asset.height;
    img.loading = 'lazy';
    button.append(img);
    button.addEventListener('click', () => openVector(asset));
    const title = document.createElement('h3');
    title.textContent = asset.title;
    const detail = document.createElement('p');
    detail.textContent = gameTitles[asset.game];
    card.append(button, title, detail);
    vectorGrid.append(card);
  }
  vectorGrid.dataset.category = category;
  document.getElementById('vector-count').textContent = category === 'characters' ? '20 персонажей · 14 уникальных героев' : `${items.length} ресурсов · настоящий SVG`;
}
function openVector(asset) {
  document.getElementById('viewer-title').textContent = asset.title;
  document.getElementById('viewer-kicker').textContent = gameTitles[asset.game];
  document.querySelector('.before-label').textContent = asset.revision === 3 ? 'Предыдущий SVG' : 'Первый эскиз';
  document.querySelector('.after-label').textContent = 'Новый SVG';
  document.getElementById('viewer-description').textContent = asset.category === 'coloring-pages' ? 'Подробная сцена для раскрашивания: от главного героя до фона. Чёрные векторные контуры на белом листе.' : asset.revision === 3 ? 'Детальная векторизация: свет, фактура и глубина переданы цветными контурами. Без встроенной картинки.' : 'Настоящий SVG: редактируемые формы и градиенты. Без встроенных растровых изображений.';
  const compare = document.getElementById('compare');
  compare.classList.add('vector-compare');
  compare.style.aspectRatio = `${asset.width} / ${asset.height}`;
  compare.style.maxWidth = asset.width === asset.height ? '60svh' : '';
  document.getElementById('after').src = asset.path;
  document.getElementById('after').alt = `${asset.title} — новая векторная версия`;
  document.getElementById('before').src = asset.before;
  document.getElementById('before').alt = `${asset.title} — предыдущая версия`;
  const original = document.getElementById('original');
  original.href = asset.path;
  original.textContent = 'Открыть SVG ↗';
  reveal.value = 35;
  updateReveal();
  viewer.showModal();
}
document.querySelectorAll('[data-vector-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-vector-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  renderVectors(button.dataset.vectorFilter);
}));
const requestedCategory = new URLSearchParams(location.search).get('category');
const initialCategory = vectorAssets.some(asset => asset.category === requestedCategory) ? requestedCategory : 'habitats';
document.querySelectorAll('[data-vector-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.vectorFilter === initialCategory)));
renderVectors(initialCategory);
