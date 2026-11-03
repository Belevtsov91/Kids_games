import { Link } from 'react-router';
import { CopyEmail } from '../../components/CopyEmail';
import type { InfoContent } from '../../types';

export const about: InfoContent = {
  label: 'About us',
  title: 'About the project',
  eyebrow: 'About',
  color: '#a99bff',
  icon: '🐻',
  summary: 'Interact Games is ten games for kids aged 3 to 15 in one place: we draw, build, count and save Moon Valley.',
  body: (
    <>
      <h2>Why we do this</h2>
      <p>
        We wanted kids to have one calm place to play: no ads, no chats with strangers and no endless feed. A grown-up creates the account, the child picks
        their profile and plays.
      </p>
      <h2>What is inside</h2>
      <ul>
        <li>For the youngest: Drawing, Puzzles, Animal Orchestra, Who Lives Where.</li>
        <li>Letters and numbers: Letter Eater, Count &amp; play (in four languages).</li>
        <li>Big worlds: Keepers of Moon Valley, Island Builder, 3D Sandbox, Space Gardener.</li>
      </ul>
      <h2>Where to play</h2>
      <p>In the browser on a computer, tablet or phone. The site can be added to your phone’s home screen as an app, then the games open even without internet.</p>
      <p>
        Ages and benefits of each game: <Link to="/parents">For parents</Link>.
      </p>
    </>
  ),
};

export const credits: InfoContent = {
  label: '3D model credits',
  title: '3D model credits',
  eyebrow: 'About',
  color: '#a99bff',
  icon: '🎨',
  summary: 'Thank you to the artists who share their work for free.',
  body: (
    <>
      <h2>Quaternius</h2>
      <p>
        <a href="https://quaternius.com" target="_blank" rel="noreferrer">quaternius.com</a>: heroes, animals, monsters, a village and plants. Packs Ultimate
        Animated Characters, Ultimate Monsters, Animated Animals, Medieval Village Pack, Nature Crops Pack, Ultimate Nature Pack.
      </p>
      <h2>Kenney</h2>
      <p>
        <a href="https://kenney.nl" target="_blank" rel="noreferrer">kenney.nl</a>: Mini Characters and Nature Kit packs.
      </p>
      <h2>License</h2>
      <p>The models are distributed under the CC0 1.0 license (public domain). Crediting the authors is optional, but we are happy to do it.</p>
    </>
  ),
};

export const contact: InfoContent = {
  label: 'Contact',
  title: 'Contact',
  eyebrow: 'About',
  color: '#7ee7ff',
  icon: '✉️',
  summary: 'A question, an idea for a new game, or something broke? Write to us. We reply to grown-ups; child profiles cannot send messages.',
  body: (
    <>
      <h2>Email</h2>
      <CopyEmail />
      <p>We usually reply within 1–2 business days.</p>
      <h2>What to write if something broke</h2>
      <ul>
        <li>Which game and what exactly does not work.</li>
        <li>Phone, tablet or computer, and which browser.</li>
        <li>If you can, attach a screenshot.</li>
      </ul>
      <h2>Data questions</h2>
      <p>
        To the same email. How to delete the account is described on the <Link to="/delete-account">“Delete account and data”</Link> page.
      </p>
    </>
  ),
};
