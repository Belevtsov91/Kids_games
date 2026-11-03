import { Link } from 'react-router';
import { DeleteAccountAction } from '../../components/DeleteAccountAction';
import { Fill } from '../../components/Fill';
import { SITE } from '../../site';
import type { InfoContent } from '../../types';

export const cookies: InfoContent = {
  label: 'Cookies',
  title: 'Cookies',
  eyebrow: 'Document',
  color: '#7ee7ff',
  icon: '🍪',
  dated: true,
  summary: 'We have one cookie and it is needed only for logging in. There are no advertising or analytics cookies, so we do not show a consent banner.',
  body: (
    <>
      <h2>Which cookie and why</h2>
      <ul>
        <li>
          <b>ig_session</b> remembers that you are logged in and which child profile is selected. It appears only after login, is encrypted, lasts 7 days
          and is deleted when you log out.
        </li>
      </ul>
      <h2>What we do not have</h2>
      <p>Google Analytics, social media pixels, ad networks or any third-party cookies.</p>
      <h2>Offline mode</h2>
      <p>
        The site can be added to your phone’s home screen as an app. Then the browser keeps the game files so they open faster and without internet. These
        are not cookies or personal data, and you can delete them in the browser settings.
      </p>
      <h2>How to turn it off</h2>
      <p>You can block cookies in the browser settings, but then you will not be able to log in.</p>
    </>
  ),
};

export const kids: InfoContent = {
  label: 'Children’s privacy',
  title: 'Children’s privacy',
  eyebrow: 'For parents',
  color: '#ff7eb6',
  icon: '🛡️',
  dated: true,
  summary: 'A child needs no email or password. A grown-up creates the account, and the child only picks their profile. Talking to strangers in the games is impossible.',
  body: (
    <>
      <h2>How we protect children</h2>
      <ul>
        <li><b>Only grown-ups have accounts.</b> A parent or guardian signs up, and the child plays through their account.</li>
        <li><b>Minimal data.</b> About the child we know a name or nickname, age and avatar. A real name is not required.</li>
        <li><b>No contact with strangers.</b> The games have no chats, messages, friends, public profiles or leaderboards with names.</li>
        <li><b>No ads.</b> The child will not see banners or video ads.</li>
        <li><b>No outside links.</b> You cannot accidentally leave the games for another site.</li>
        <li><b>The parent is in charge.</b> The grown-up sees all child profiles and can delete the account with all data.</li>
      </ul>
      <h2>Laws</h2>
      <p>
        We try to follow the rules for children’s services: GDPR (in the EU, consent for processing a child’s data is given by the parent) and COPPA (in
        the US, for children under 13). If you think a child signed up on their own, write to <Fill value={SITE.email} /> and we will delete the account.
      </p>
      <p>
        More about data: <Link to="/privacy">Privacy policy</Link>.
      </p>
    </>
  ),
};

export const deleteAccount: InfoContent = {
  label: 'Delete account and data',
  title: 'Delete account and data',
  eyebrow: 'For parents',
  color: '#ffb4c8',
  icon: '🗑️',
  summary: 'You can delete the account yourself in a minute. It cannot be undone: all child profiles and all saves disappear together with the account.',
  body: (
    <>
      <DeleteAccountAction />
      <h2>How to delete</h2>
      <ol>
        <li>Log in and open this page: the “Delete account and data” link is at the bottom of every page.</li>
        <li>Press the red “Delete it myself” button above.</li>
        <li>Solve three problems. This is how we check that you are a grown-up and not a child.</li>
        <li>Press “Delete forever”.</li>
      </ol>
      <p>
        Cannot log in? Write from the account email to <Fill value={SITE.email} /> and we will delete it within <Fill value={SITE.deleteBy} />.
      </p>
      <h2>What gets deleted</h2>
      <ul>
        <li>The grown-up’s email, name and password.</li>
        <li>All child profiles.</li>
        <li>All saves in every game.</li>
        <li>All login sessions on every device.</li>
      </ul>
      <h2>Backups</h2>
      <p>
        Hosting backups are overwritten within <Fill value={SITE.backupDays} />. A deleted account cannot be restored from them.
      </p>
    </>
  ),
};
