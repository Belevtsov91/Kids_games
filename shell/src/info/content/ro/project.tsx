import { Link } from 'react-router';
import { CopyEmail } from '../../components/CopyEmail';
import type { InfoContent } from '../../types';

export const about: InfoContent = {
  label: 'Despre noi',
  title: 'Despre proiect',
  eyebrow: 'Despre proiect',
  color: '#a99bff',
  icon: '🐻',
  summary: 'Interact Games înseamnă jocuri pentru copii de la 3 la 15 ani într-un singur loc: desenăm, construim, numărăm și salvăm Valea Lunii.',
  body: (
    <>
      <h2>De ce facem asta</h2>
      <p>
        Ne-am dorit ca cei mici să aibă un loc liniștit pentru joacă: fără reclame, fără chat cu străini și fără un flux nesfârșit. Adultul creează contul,
        copilul își alege profilul și se joacă.
      </p>
      <h2>Ce găsești aici</h2>
      <ul>
        <li>Pentru cei mai mici: Desenăm, Puzzle-uri, Orchestra animalelor, Cine unde locuiește.</li>
        <li>Litere și cifre: Mâncătorul de litere, Numără și joacă (în patru limbi).</li>
        <li>Lumi mari: Paznicii Văii Lunii, Insula-constructor, Cutia cu nisip 3D, Grădinarul spațial.</li>
      </ul>
      <h2>Unde te joci</h2>
      <p>În browser, pe calculator, tabletă și telefon. Site-ul poate fi pus pe ecranul telefonului ca aplicație, iar atunci jocurile se deschid și fără internet.</p>
      <p>
        Vârsta și folosul fiecărui joc: <Link to="/parents">Pentru părinți</Link>.
      </p>
    </>
  ),
};

export const credits: InfoContent = {
  label: 'Autorii modelelor 3D',
  title: 'Autorii modelelor 3D',
  eyebrow: 'Despre proiect',
  color: '#a99bff',
  icon: '🎨',
  summary: 'Mulțumim artiștilor care își împart lucrările gratuit.',
  body: (
    <>
      <h2>Quaternius</h2>
      <p>
        <a href="https://quaternius.com" target="_blank" rel="noreferrer">quaternius.com</a>: eroi, animale, monștri, un sat și plante. Pachetele Ultimate
        Animated Characters, Ultimate Monsters, Animated Animals, Medieval Village Pack, Nature Crops Pack, Ultimate Nature Pack.
      </p>
      <h2>Kenney</h2>
      <p>
        <a href="https://kenney.nl" target="_blank" rel="noreferrer">kenney.nl</a>: pachetele Mini Characters și Nature Kit.
      </p>
      <h2>Licență</h2>
      <p>Modelele sunt distribuite sub licența CC0 1.0 (domeniu public). Menționarea autorilor nu este obligatorie, dar ne face plăcere s-o facem.</p>
    </>
  ),
};

export const contact: InfoContent = {
  label: 'Contacte',
  title: 'Contacte',
  eyebrow: 'Despre proiect',
  color: '#7ee7ff',
  icon: '✉️',
  summary: 'O întrebare, o idee de joc nou sau s-a stricat ceva? Scrie-ne. Le răspundem adulților, profilurile copiilor nu pot scrie.',
  body: (
    <>
      <h2>E-mail</h2>
      <CopyEmail />
      <p>De obicei răspundem în 1–2 zile lucrătoare.</p>
      <h2>Ce să scrii dacă s-a stricat ceva</h2>
      <ul>
        <li>În ce joc și ce anume nu merge.</li>
        <li>Telefon, tabletă sau calculator și ce browser.</li>
        <li>Dacă poți, atașează o captură de ecran.</li>
      </ul>
      <h2>Întrebări despre date</h2>
      <p>
        Pe același e-mail. Cum ștergi contul este scris pe pagina <Link to="/delete-account">„Șterge contul și datele”</Link>.
      </p>
    </>
  ),
};
