import { Link } from 'react-router';
import { Fill } from '../../components/Fill';
import { SITE } from '../../site';
import type { InfoContent } from '../../types';

export const privacy: InfoContent = {
  label: 'Privacy policy',
  title: 'Privacy policy',
  eyebrow: 'Document',
  color: '#7ef09a',
  icon: '🔒',
  dated: true,
  summary:
    'We keep only what is needed for logging in and saving: the parent’s email, the child’s name or nickname, their age and game progress. No ads, no trackers, no selling of data.',
  body: (
    <>
      <h2>Who is responsible for the data</h2>
      <p>
        <Fill value={SITE.owner} />, <Fill value={SITE.country} />. Email for data questions: <Fill value={SITE.email} />.
      </p>
      <h2>What we store</h2>
      <ul>
        <li><b>About the grown-up:</b> email, a name for greetings and a password. The password is stored only as a hash, we cannot see it.</li>
        <li><b>About the child:</b> name or nickname, age from 3 to 15 and the chosen avatar picture.</li>
        <li><b>Progress:</b> game saves, for example a built island, completed levels and quests.</li>
        <li><b>Login session:</b> a technical record so you do not have to type the password every time. It lasts 7 days.</li>
      </ul>
      <h2>What we do not collect</h2>
      <p>Surname, photos, voice, location, contacts, school, advertising IDs. The games have no chats or messaging.</p>
      <h2>Why</h2>
      <p>So the parent can log in, the child can pick their profile and the games remember progress. Nothing else: no ads, no analytics, no profiling.</p>
      <h2>Where the data is stored and who sees it</h2>
      <p>
        In a Supabase (Postgres) database, region <Fill value={SITE.dbRegion} />. The site is hosted on Vercel. These companies process data only on our
        behalf. We do not share or sell data to anyone else.
      </p>
      <h2>How long we keep it</h2>
      <p>
        As long as the account exists. Login sessions are deleted after 7 days. After the account is deleted the data is erased at once, and hosting backups
        are overwritten within <Fill value={SITE.backupDays} />.
      </p>
      <h2>Your rights</h2>
      <p>
        You can view, correct or delete your data and your children’s data, and withdraw consent. How to delete everything is described on the{' '}
        <Link to="/delete-account">“Delete account and data”</Link> page. If you believe we have violated your rights, you can complain to the supervisory
        authority in your country.
      </p>
      <h2>Changes</h2>
      <p>If the policy changes, we will email the parent before the changes take effect.</p>
    </>
  ),
};

export const terms: InfoContent = {
  label: 'Terms of use',
  title: 'Terms of use',
  eyebrow: 'Document',
  color: '#ffd25a',
  icon: '📜',
  dated: true,
  summary: 'The account is created by a grown-up, who is responsible for the password and for what the child plays. The games are free and provided as is.',
  body: (
    <>
      <h2>Who can use the site</h2>
      <p>Only a grown-up aged 18 or over can sign up: a parent, guardian or teacher. The child plays in their own profile inside the grown-up’s account.</p>
      <h2>Account</h2>
      <p>Keep your password secret and do not share the account with other families. If someone logged in without your knowledge, write to us: <Fill value={SITE.email} />.</p>
      <h2>Games</h2>
      <p>
        The games are free. We may add, change and remove games and we try to keep progress through updates, but we do not promise that the site will work
        without interruptions.
      </p>
      <h2>What is not allowed</h2>
      <ul>
        <li>Hacking the site, guessing other people’s passwords, overloading the server with bots.</li>
        <li>Copying and publishing the games, code and graphics elsewhere.</li>
      </ul>
      <h2>Copyright</h2>
      <p>
        The code, texts and design belong to <Fill value={SITE.owner} />. Some 3D models were made by Quaternius and Kenney and are distributed under the CC0
        1.0 license, see the <Link to="/credits">“3D model credits”</Link> page.
      </p>
      <h2>Liability</h2>
      <p>
        The site is provided “as is”. We are not responsible for downtime or lost saves for reasons beyond our control. Please keep an eye on how much time
        the child spends in front of a screen.
      </p>
      <h2>Termination</h2>
      <p>You can delete the account at any time. We may close an account if it is used for hacking or to harm others.</p>
      <h2>Governing law</h2>
      <p>
        Laws of: <Fill value={SITE.country} />. Questions: <Fill value={SITE.email} />.
      </p>
    </>
  ),
};
