// Тексты витрины игр: română.
import type { ShowcaseCopy, ShowcaseId } from '../showcase';

export const ro: Record<ShowcaseId, ShowcaseCopy> = {
  'moon-valley': {
    title: 'Paznicii Văii Lunii',
    short: 'Valea Lunii',
    text: 'O mare aventură 3D. Un sat, straturi și o seră, misiuni în jurnal, Regele Ciupercilor în poiana de nord și vulpița Luna, pe care o poți mângâia. Există zi și noapte.',
    card: 'Aventură 3D cu misiuni, un animăluț și alternanța zilei și nopții.',
    tags: ['Misiuni', 'Animăluț', 'Zi și noapte'],
    shotAlts: ['Satul din Valea Lunii', 'Valea Lunii noaptea'],
    benefit: 'Să citească sarcini, să planifice, să aibă grijă de animăluț și de grădină.',
  },
  'island-builder': {
    title: 'Insula-constructor',
    text: 'Construiește o insulă din blocuri: sapă un golf, plantează copaci, pune felinare, lansează bărci pe apă. Sarcini precum „Construiește un turn înalt de 11”.',
    card: 'Blocuri, copaci, bărci și felinare. Insula ta, cu sarcini.',
    tags: ['Blocuri', 'Bărci', 'Sarcini'],
    benefit: 'Gândire spațială, numărarea blocurilor, dusul sarcinilor până la capăt.',
  },
  playground3d: {
    title: 'Cutia cu nisip 3D',
    text: 'Jucării cu fizică adevărată: piramide, cuburi și mingi. Aruncă, construiește și dărâmă cât vrei.',
    card: 'Piramide, cuburi și mingi cu fizică adevărată.',
    tags: ['Fizică', 'Jucării', 'Fără reguli'],
    benefit: 'Cum cad și se rostogolesc obiectele: primele experimente de fizică.',
  },
  'space-gardener': {
    title: 'Grădinarul spațial',
    text: 'Desenează cu degetul o liană de la cometă la ghiveci și udă floarea. Găurile negre, asteroizii și gravitația slabă împiedică apa să ajungă.',
    card: 'Desenează o liană de la cometă la ghiveci și udă floarea.',
    tags: ['Puzzle', 'Desenează cu degetul', '3 stele'],
    benefit: 'Logică și traiectorii: cum duci apa ocolind obstacolele.',
  },
  drawing: { title: 'Desenăm', text: 'Desenează cu degetul sau cu mouse-ul: pensule, culori, ștampile.', tags: ['Creativitate'], benefit: 'Motricitate fină, culori, imaginație.' },
  puzzles: { title: 'Puzzle-uri', text: 'Compune imagini din bucăți, de la simple la grele.', tags: ['Logică'], benefit: 'Atenție, formă, răbdare.' },
  'letter-eater': { title: 'Mâncătorul de litere', text: 'Hrănește Mâncătorul cu literele potrivite și învață alfabetul.', tags: ['Litere'], benefit: 'Literele și primele cuvinte.' },
  'animal-orchestra': { title: 'Orchestra animalelor', text: 'Animalele cântă, iar tu dirijezi.', tags: ['Muzică'], benefit: 'Ritm, sunete și vocile animalelor.' },
  counting: {
    title: 'Numără și joacă',
    text: 'Numărat în patru limbi: română, rusă, ucraineană, engleză.',
    tags: ['Cifre', '4 limbi'],
    benefit: 'Numărat și cifre în română, rusă, ucraineană și engleză.',
  },
  'who-lives-where': { title: 'Cine unde locuiește', text: 'Ajută animăluțele să-și găsească căsuța.', tags: ['Animale'], benefit: 'Animalele și casele lor, clasificare.' },
};
