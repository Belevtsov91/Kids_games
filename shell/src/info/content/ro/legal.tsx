import { Link } from 'react-router';
import { Fill } from '../../components/Fill';
import { SITE } from '../../site';
import type { InfoContent } from '../../types';

export const privacy: InfoContent = {
  label: 'Politica de confidențialitate',
  title: 'Politica de confidențialitate',
  eyebrow: 'Document',
  color: '#7ef09a',
  icon: '🔒',
  dated: true,
  summary:
    'Păstrăm doar ce e nevoie pentru autentificare, regulile de timp și salvări: emailul părintelui, numele sau porecla copilului, vârsta, setările și reușitele din jocuri. Fără reclame, fără trackere, fără vânzare de date.',
  body: (
    <>
      <h2>Cine răspunde de date</h2>
      <p>
        <Fill value={SITE.owner} />, <Fill value={SITE.country} />. E-mail pentru întrebări despre date: <Fill value={SITE.email} />.
      </p>
      <h2>Ce păstrăm</h2>
      <ul>
        <li><b>Despre adult:</b> email, nume pentru salut, parola și PIN-ul contului (ambele doar ca hash), fusul orar și, dacă o încarci tu, o fotografie mică 256×256.</li>
        <li><b>Despre copil:</b> nume sau poreclă, vârstă, avatar, opțional luna nașterii (pentru felicitare) și o fotografie 256×256, limba și setările de confort.</li>
        <li><b>Reguli și timp:</b> limite, ore de liniște, pauze, jocuri închise, minutele de joc pe zile și cererile de timp suplimentar.</li>
        <li><b>Reușite:</b> salvările jocurilor, desene și melodii, niveluri trecute, abțibilduri și răspunsuri pe abilități (corect sau nu) pentru pagina „Ce a învățat”.</li>
        <li><b>Ajutoare:</b> numele și, dacă îl dai, emailul bunicii, bonei sau altui adult căruia i-ai permis să răspundă la cereri.</li>
        <li><b>Sesiunea de autentificare:</b> o înregistrare tehnică ca să nu introduci parola de fiecare dată. Durează 7 zile.</li>
      </ul>
      <p>Salutul vocal înregistrat de adult rămâne doar pe acest dispozitiv și nu este trimis la server.</p>
      <h2>Ce nu colectăm</h2>
      <p>Numele de familie, localizarea, contactele, școala, identificatorii de publicitate. În jocuri nu există chat și nici mesaje între oameni.</p>
      <h2>De ce</h2>
      <p>Ca părintele să se poată autentifica și seta timpul, copilul să-și aleagă profilul, iar jocurile să țină minte progresul pe toate dispozitivele. Fără reclame, fără analiză terță, fără profilare.</p>
      <h2>Unde se păstrează datele și cine le vede</h2>
      <p>
        Baza de date este Supabase (Postgres), regiunea <Fill value={SITE.dbRegion} />. Site-ul e găzduit pe Vercel, serverul pe Render, iar emailurile le trimite Brevo.
        Aceste companii prelucrează datele doar la cererea noastră. Nu transmitem și nu vindem datele nimănui altcuiva.
      </p>
      <h2>Cât timp le păstrăm</h2>
      <p>
        Cât timp există contul. Sesiunile se șterg după 7 zile, linkurile de resetare a parolei după expirare, iar răspunsurile detaliate pe abilități după
        180 de zile. După ștergerea contului datele dispar imediat, iar copiile de rezervă ale găzduirii se suprascriu în <Fill value={SITE.backupDays} />.
      </p>
      <h2>Drepturile tale</h2>
      <p>
        Poți vedea, corecta sau șterge datele tale și ale copiilor tăi, precum și retrage consimțământul. Cum ștergi totul este descris pe pagina{' '}
        <Link to="/delete-account">„Șterge contul și datele”</Link>. Dacă crezi că ți-am încălcat drepturile, poți depune o plângere la autoritatea de
        supraveghere din țara ta.
      </p>
      <h2>Modificări</h2>
      <p>Dacă politica se schimbă, îi vom scrie părintelui pe e-mail înainte ca modificările să intre în vigoare.</p>
    </>
  ),
};

export const terms: InfoContent = {
  label: 'Termeni de utilizare',
  title: 'Termeni de utilizare',
  eyebrow: 'Document',
  color: '#ffd25a',
  icon: '📜',
  dated: true,
  summary: 'Contul îl creează un adult, care răspunde de parolă și de ce se joacă copilul. Jocurile sunt gratuite și sunt oferite așa cum sunt.',
  body: (
    <>
      <h2>Cine poate folosi site-ul</h2>
      <p>Se poate înregistra doar un adult de peste 18 ani: părinte, tutore sau profesor. Copilul se joacă în profilul lui din contul adultului.</p>
      <h2>Contul</h2>
      <p>Păstrează parola secretă și nu da contul altor familii. Dacă cineva a intrat fără știrea ta, scrie-ne: <Fill value={SITE.email} />.</p>
      <h2>Jocurile</h2>
      <p>
        Jocurile sunt gratuite. Putem adăuga, schimba și elimina jocuri și încercăm să păstrăm progresul la actualizări, dar nu promitem că site-ul va
        funcționa fără întreruperi.
      </p>
      <h2>Ce nu este permis</h2>
      <ul>
        <li>Spargerea site-ului, ghicirea parolelor altora, supraîncărcarea serverului cu boți.</li>
        <li>Copierea și publicarea jocurilor, a codului și a graficii în alt loc.</li>
      </ul>
      <h2>Drepturi de autor</h2>
      <p>
        Codul, textele și designul aparțin <Fill value={SITE.owner} />. O parte din modelele 3D au fost create de Quaternius și Kenney și sunt distribuite
        sub licența CC0 1.0, detalii pe pagina <Link to="/credits">„Autorii modelelor 3D”</Link>.
      </p>
      <h2>Răspundere</h2>
      <p>
        Site-ul este oferit „ca atare”. Nu răspundem pentru întreruperi și pierderea salvărilor din motive independente de noi. Urmărește cât timp petrece
        copilul în fața ecranului.
      </p>
      <h2>Încetare</h2>
      <p>Poți șterge contul oricând. Putem închide un cont dacă este folosit pentru atacuri sau pentru a face rău altora.</p>
      <h2>Legea aplicabilă</h2>
      <p>
        Legile: <Fill value={SITE.country} />. Întrebări: <Fill value={SITE.email} />.
      </p>
    </>
  ),
};
