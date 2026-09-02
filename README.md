# Cadru

Website builder / CMS minimal, fără backend și fără build. Deschizi `index.html` și construiești un site cu mai multe pagini, apoi exporți un singur fișier HTML gata de publicat.

## Ce face

- **Pagini** – adaugi, redenumești, reordonezi, ștergi; meniul și subsolul se generează singure.
- **21 de blocuri** – hero (text, imagine laterală sau imagine fundal), titlu, text, text + imagine, două coloane, listă, citat, buton, imagine, galerie, video / hartă, caracteristici, cifre, testimoniale, prețuri, întrebări frecvente, echipă, logo-uri, îndemn, formular de contact, linie, spațiu.
- **Per bloc** – fundal (simplu, nuanțat, închis, accent), spațiere, aliniere, coloane, stil.
- **Aspect** – 6 teme rapide (Brut, Curat, Noapte, Editorial, Beton, Marin), culori pentru accent / fundal / text, fonturi separate pentru titluri și text, grosimea contururilor, umbre dure, lățimea conținutului.
- **Site** – nume, logo, buton în meniu, descriere, text și linkuri în subsol.
- **Imagini** – prin URL sau încărcate direct de pe calculator (se redimensionează automat).
- **Șabloane** – Studio, Restaurant, Portofoliu, sau pagină goală.
- **Previzualizare** desktop / mobil, și comutator mobil direct în editor.
- **Export** – un singur `index.html` cu toate paginile, navigare fără server, fonturi de la Google Fonts. Copiezi codul sau descarci fișierul.
- **Salvare automată** în browser (localStorage), undo (Ctrl+Z), drag & drop pentru reordonare.

## Cum rulezi

Deschide `index.html` în browser. Atât.

Pentru dezvoltare, orice server static merge:

```bash
python3 -m http.server 8000
```

## Publicare

Export HTML → salvează ca `index.html` → urcă pe Netlify Drop, GitHub Pages, Vercel sau orice hosting static.

Formularul de contact trimite pe email (mailto) implicit. Pentru a primi mesajele direct, pune în blocul Contact un endpoint de la [Formspree](https://formspree.io) sau [Basin](https://usebasin.com).

## Fișiere

- `index.html` – structura editorului
- `style.css` – stilul editorului
- `app.js` – blocuri, teme, randare, export

## Stack

HTML + CSS + JavaScript vanilla. Design fără colțuri rotunjite, cu contururi și umbre dure.
