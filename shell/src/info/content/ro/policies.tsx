import { Link } from 'react-router';
import { DeleteAccountAction } from '../../components/DeleteAccountAction';
import { Fill } from '../../components/Fill';
import { SITE } from '../../site';
import type { InfoContent } from '../../types';

export const cookies: InfoContent = {
  label: 'Fișiere cookie',
  title: 'Fișiere cookie',
  eyebrow: 'Document',
  color: '#7ee7ff',
  icon: '🍪',
  dated: true,
  summary: 'Avem un singur cookie și e necesar doar pentru intrare. Nu avem cookie-uri de publicitate sau analiză, de aceea nu afișăm un banner de consimțământ.',
  body: (
    <>
      <h2>Ce cookie și de ce</h2>
      <ul>
        <li>
          <b>ig_session</b> ține minte că ai intrat și ce profil de copil este ales. Apare doar după intrare, este criptat, durează 7 zile și se șterge
          la ieșire.
        </li>
      </ul>
      <h2>Ce nu avem</h2>
      <p>Google Analytics, pixeli de rețele sociale, rețele de publicitate și orice cookie-uri terțe.</p>
      <h2>Modul offline</h2>
      <p>
        Site-ul poate fi pus pe ecranul telefonului ca aplicație. Atunci browserul păstrează fișierele jocurilor, ca să se deschidă mai repede și fără
        internet. Acestea nu sunt cookie-uri și nici date personale, le poți șterge din setările browserului.
      </p>
      <h2>Cum le dezactivezi</h2>
      <p>Poți bloca cookie-urile în setările browserului, dar atunci nu vei putea intra în cont.</p>
    </>
  ),
};

export const kids: InfoContent = {
  label: 'Confidențialitatea copiilor',
  title: 'Confidențialitatea copiilor',
  eyebrow: 'Pentru părinți',
  color: '#ff7eb6',
  icon: '🛡️',
  dated: true,
  summary: 'Copilul nu are nevoie de e-mail și parolă. Contul îl creează un adult, iar copilul doar își alege profilul. În jocuri nu se poate vorbi cu străini.',
  body: (
    <>
      <h2>Cum îi protejăm pe copii</h2>
      <ul>
        <li><b>Contul îl are doar adultul.</b> Se înregistrează părintele sau tutorele, copilul intră prin contul lui.</li>
        <li><b>Date minime.</b> Despre copil știm numele sau porecla, vârsta și avatarul. Numele real nu este obligatoriu.</li>
        <li><b>Fără contact cu străinii.</b> În jocuri nu există chat, mesaje, prieteni, profiluri publice sau clasamente cu nume.</li>
        <li><b>Fără reclame.</b> Copilul nu va vedea bannere sau clipuri publicitare.</li>
        <li><b>Fără linkuri externe.</b> Din jocuri nu se poate ajunge din greșeală pe alt site.</li>
        <li><b>Părintele decide.</b> Adultul vede toate profilurile copiilor și poate șterge contul cu toate datele.</li>
      </ul>
      <h2>Legi</h2>
      <p>
        Încercăm să respectăm regulile pentru serviciile destinate copiilor: GDPR (în UE consimțământul pentru prelucrarea datelor copilului îl dă
        părintele) și COPPA (în SUA, pentru copiii sub 13 ani). Dacă crezi că un copil s-a înregistrat singur, scrie la <Fill value={SITE.email} /> și vom
        șterge contul.
      </p>
      <p>
        Mai multe despre date: <Link to="/privacy">Politica de confidențialitate</Link>.
      </p>
    </>
  ),
};

export const deleteAccount: InfoContent = {
  label: 'Șterge contul și datele',
  title: 'Șterge contul și datele',
  eyebrow: 'Pentru părinți',
  color: '#ffb4c8',
  icon: '🗑️',
  summary: 'Poți șterge contul singur într-un minut. Este ireversibil: odată cu contul dispar toate profilurile copiilor și toate salvările.',
  body: (
    <>
      <DeleteAccountAction />
      <h2>Cum ștergi</h2>
      <ol>
        <li>Intră în cont și deschide această pagină: linkul „Șterge contul și datele” se află jos pe orice pagină a site-ului.</li>
        <li>Apasă butonul roșu „Șterge singur” de mai sus.</li>
        <li>Rezolvă trei exerciții. Așa verificăm că ești adult, nu copil.</li>
        <li>Apasă „Șterge definitiv”.</li>
      </ol>
      <p>
        Nu poți intra? Scrie de pe e-mailul contului la <Fill value={SITE.email} /> și îl vom șterge în <Fill value={SITE.deleteBy} />.
      </p>
      <h2>Ce se șterge</h2>
      <ul>
        <li>E-mailul, numele și parola adultului.</li>
        <li>Toate profilurile copiilor.</li>
        <li>Toate salvările din toate jocurile.</li>
        <li>Toate sesiunile de intrare de pe toate dispozitivele.</li>
      </ul>
      <h2>Copii de rezervă</h2>
      <p>
        Copiile de rezervă ale găzduirii se suprascriu în <Fill value={SITE.backupDays} />. Un cont șters nu poate fi restaurat din ele.
      </p>
    </>
  ),
};
