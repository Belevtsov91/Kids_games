import type { ParentTextD } from './ru4';

/** Parent area texts, part four: profile protection, trash, per-day limits, new profile, helpers. */
export const en4: ParentTextD = {
  guard: {
    title: 'Profile protection',
    lead: 'Who can enter this profile and who can leave it.',
    locked: 'Entering needs a grown-up',
    lockedLead: 'So younger children can’t play under this name. Choosing the profile will ask for the grown-up puzzle and PIN.',
    exit: 'Leaving needs a grown-up',
    exitLead: 'For a child’s own tablet: the profile can’t be switched without a grown-up, and the site doesn’t ask “who is playing?” after a break.',
    rulesNote: 'This profile has time rules, so only a grown-up can switch it anyway.',
  },
  trash: {
    title: 'Trash',
    lead: (days) => `Deleted profiles are kept for ${days} days and can be restored with all their saves. After that they are erased for good.`,
    until: (date) => `Erased on ${date}`,
    restore: 'Restore',
    restored: (name) => `${name}’s profile is back`,
    purge: 'Erase now',
    purgeSure: 'Really erase?',
    purged: (name) => `${name}’s profile erased for good`,
    tooMany: 'Delete one of the profiles first: there can’t be more than ten.',
  },
  delExport: 'Download this child’s data',
  dayLimits: {
    title: 'A limit for each day',
    lead: 'For example, less on school days and more on Saturday.',
    free: 'no limit',
  },
  newKid: {
    birth: 'Birth month (optional)',
    birthLead: 'Then the age and the games for that age grow by themselves.',
    rules: 'Time rules for this age',
    rulesLead: 'A daily limit, quiet hours and breaks. You can change them under “Time”.',
  },
  helperKids: {
    label: 'For whom',
    all: 'All children',
    only: (names) => `Only: ${names}`,
  },
  gatePassword: 'There is no PIN and your child is already 7, so they can solve the puzzle. Enter the account password. To get in faster, turn on a PIN under “Account”.',
  creativity: {
    title: 'Creations',
    lead: 'Everything your child made in the games: drawings, tunes, beats. Beats from “Beat Studio” show up only if your child tapped “Show my parents”.',
    empty: (name) => `${name} hasn’t saved anything yet. Drawings, tunes and beats will appear here by themselves.`,
    partial: 'Some creations didn’t load. Refresh the page a little later.',
    filter: 'What to show',
    kinds: { all: 'All', picture: 'Drawings', music: 'Music', story: 'Stories', build: 'Builds' },
    remove: 'Delete',
    removed: 'Creation deleted',
    confirm: 'Delete this creation for good?',
  },
};
