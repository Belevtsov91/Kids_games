import type { ParentTextD } from './ru4';

/** Textele contului, partea a patra: protecția profilului, coșul, limita pe zile, profil nou, ajutoare. */
export const ro4: ParentTextD = {
  guard: {
    title: 'Protecția profilului',
    lead: 'Cine poate intra în profil și cine poate ieși din el.',
    locked: 'Intrare doar cu un adult',
    lockedLead: 'Ca cei mici să nu se joace sub acest nume. La alegerea profilului va fi nevoie de problema pentru adulți și de PIN.',
    exit: 'Ieșire doar cu un adult',
    exitLead: 'Pentru tableta personală a copilului: profilul nu se poate schimba fără un adult, iar site-ul nu întreabă „cine se joacă?” după pauză.',
    rulesNote: 'Profilul are reguli de timp, așa că oricum doar un adult îl poate schimba.',
  },
  trash: {
    title: 'Coș',
    lead: (days) => `Profilurile șterse se păstrează ${days} zile: pot fi restaurate cu toate salvările. Apoi se șterg definitiv.`,
    until: (date) => `Se șterge pe ${date}`,
    restore: 'Restaurează',
    restored: (name) => `Profilul ${name} este din nou la loc`,
    purge: 'Șterge acum',
    purgeSure: 'Sigur ștergi?',
    purged: (name) => `Profilul ${name} a fost șters definitiv`,
    tooMany: 'Șterge mai întâi un profil: nu pot fi mai mult de zece.',
  },
  delExport: 'Descarcă datele copilului',
  dayLimits: {
    title: 'Limită proprie pentru fiecare zi',
    lead: 'De exemplu, mai puțin în zilele de școală și mai mult sâmbăta.',
    free: 'fără limită',
  },
  newKid: {
    birth: 'Luna nașterii (opțional)',
    birthLead: 'Atunci vârsta și jocurile după vârstă vor crește singure.',
    rules: 'Reguli de timp după vârstă',
    rulesLead: 'Limită pe zi, ore de liniște și pauze. Le poți schimba în secțiunea „Timp”.',
  },
  helperKids: {
    label: 'Pentru cine',
    all: 'Toți copiii',
    only: (names) => `Doar: ${names}`,
  },
  gatePassword: 'PIN-ul nu este setat, iar copilul are deja 7 ani: problema o poate rezolva singur. Introdu parola contului. Ca să intri mai repede, activează PIN-ul în secțiunea „Cont”.',
};
