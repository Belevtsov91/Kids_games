import { Link } from 'react-router';
import { GamesByAge } from '../../components/GamesByAge';
import type { InfoContent } from '../../types';

export const parents: InfoContent = {
  label: 'Ages and benefits',
  title: 'For parents',
  eyebrow: 'For parents',
  color: '#ff7eb6',
  icon: '👨‍👩‍👧',
  summary: 'How the account works, what age each game is for and what it teaches.',
  body: (
    <>
      <h2>How the account works</h2>
      <ol>
        <li>A grown-up signs up with an email and password.</li>
        <li>They add a profile for each child: name or nickname, age and avatar.</li>
        <li>The child picks their profile and plays. Everyone has their own saves.</li>
      </ol>
      <p>
        More about protecting children: <Link to="/kids">Children’s privacy</Link>.
      </p>
      <h2>Games by age</h2>
      <GamesByAge />
      <h2>How long to play</h2>
      <p>
        For preschoolers the usual advice is up to an hour of screen time a day, for school kids as agreed, with breaks. The big worlds save progress, so a
        game can be paused calmly at any moment.
      </p>
    </>
  ),
};

export const help: InfoContent = {
  label: 'Help and FAQ',
  title: 'Help and frequently asked questions',
  eyebrow: 'For parents',
  color: '#ffd25a',
  icon: '💡',
  body: (
    <>
      <h2>Is it free?</h2>
      <p>Yes. There are no ads.</p>
      <h2>Does my child need their own email?</h2>
      <p>No. A grown-up creates the account, and the child picks their profile inside it.</p>
      <h2>Can we play on a phone?</h2>
      <p>Yes. Open the site in the phone’s browser and choose “Add to Home Screen”, then it opens like an app and works without internet.</p>
      <h2>Progress is gone</h2>
      <p>Check that the same child profile is selected. Each profile has its own saves. If that does not help, write to us.</p>
      <h2>A game does not start or is slow</h2>
      <p>3D games need a browser with WebGL support. Update the browser and close extra tabs. On old phones it is better to choose 2D games.</p>
      <h2>How do I delete the account?</h2>
      <p>
        See <Link to="/delete-account">“Delete account and data”</Link>.
      </p>
      <h2>Did not find an answer?</h2>
      <p>
        <Link to="/contact">Write to us</Link>.
      </p>
    </>
  ),
};
