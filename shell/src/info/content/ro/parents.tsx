import { Link } from 'react-router';
import { GamesByAge } from '../../components/GamesByAge';
import type { InfoContent } from '../../types';

export const parents: InfoContent = {
  label: 'Vârsta și folosul jocurilor',
  title: 'Pentru părinți',
  eyebrow: 'Pentru părinți',
  color: '#ff7eb6',
  icon: '👨‍👩‍👧',
  summary: 'Cum funcționează contul, pentru ce vârstă e fiecare joc și ce te învață.',
  body: (
    <>
      <h2>Cum funcționează contul</h2>
      <ol>
        <li>Adultul se înregistrează cu e-mail și parolă.</li>
        <li>Adaugă un profil pentru fiecare copil: nume sau poreclă, vârstă și avatar.</li>
        <li>Copilul își alege profilul și se joacă. Fiecare are salvările lui.</li>
      </ol>
      <p>
        Mai multe despre protecția copiilor: <Link to="/kids">Confidențialitatea copiilor</Link>.
      </p>
      <h2>Jocuri pe vârste</h2>
      <GamesByAge />
      <h2>Cât să se joace</h2>
      <p>
        Pentru preșcolari se recomandă de obicei cel mult o oră pe zi în fața ecranului, pentru școlari — după înțelegere, cu pauze. Lumile mari păstrează
        progresul, așa că jocul poate fi întrerupt liniștit oricând.
      </p>
    </>
  ),
};

export const help: InfoContent = {
  label: 'Ajutor și întrebări',
  title: 'Ajutor și întrebări frecvente',
  eyebrow: 'Pentru părinți',
  color: '#ffd25a',
  icon: '💡',
  body: (
    <>
      <h2>Este gratuit?</h2>
      <p>Da. Nu există reclame.</p>
      <h2>Copilul are nevoie de propriul e-mail?</h2>
      <p>Nu. Contul îl creează un adult, iar copilul își alege profilul în interiorul lui.</p>
      <h2>Se poate juca de pe telefon?</h2>
      <p>Da. Deschide site-ul în browserul telefonului și alege „Adaugă pe ecranul principal”, atunci se va deschide ca o aplicație și va merge fără internet.</p>
      <h2>Progresul a dispărut</h2>
      <p>Verifică dacă este ales același profil de copil. Fiecare profil are salvările lui. Dacă nu ajută, scrie-ne.</p>
      <h2>Jocul nu pornește sau merge greu</h2>
      <p>Jocurile 3D au nevoie de un browser cu suport WebGL. Actualizează browserul și închide filele în plus. Pe telefoanele vechi e mai bine să alegi jocuri 2D.</p>
      <h2>Cum șterg contul?</h2>
      <p>
        Vezi <Link to="/delete-account">„Șterge contul și datele”</Link>.
      </p>
      <h2>Nu ai găsit răspunsul?</h2>
      <p>
        <Link to="/contact">Scrie-ne</Link>.
      </p>
    </>
  ),
};
