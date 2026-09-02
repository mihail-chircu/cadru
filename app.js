/* Cadru – website builder minimal. Vanilla JS, fără dependențe. */
(function () {
  'use strict';

  // =====================================================================
  // Helpers
  // =====================================================================
  const $ = (s, el = document) => el.querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'pagina';
  const paras = (t) => String(t ?? '').split(/\n{2,}/).filter(s => s.trim()).map(p => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('');
  const lines = (t) => String(t ?? '').split('\n').map(s => s.trim()).filter(Boolean);
  const rows = (t) => lines(t).map(l => l.split('|').map(s => s.trim()));
  const safeHref = (u) => { u = String(u || '#').trim(); return /^(https?:|mailto:|tel:|#|\/)/i.test(u) ? u : '#'; };
  const safeSrc = (u) => { u = String(u || '').trim(); return /^(https?:|data:image\/|\/)/i.test(u) ? u : ''; };
  const isDark = (hex) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return false; const n = parseInt(m[1], 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 1000 < 140; };
  const embedUrl = (u) => {
    u = String(u || '').trim();
    let m = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/.exec(u); if (m) return `https://www.youtube.com/embed/${m[1]}`;
    m = /vimeo\.com\/(\d+)/.exec(u); if (m) return `https://player.vimeo.com/video/${m[1]}`;
    m = /<iframe[^>]+src="([^"]+)"/i.exec(u); if (m) u = m[1];
    return /^https:\/\//i.test(u) ? u : '';
  };

  // =====================================================================
  // Fonts, presets, palettes
  // =====================================================================
  const FONTS = {
    archivo: { name: 'Archivo', css: "'Archivo', 'Helvetica Neue', Arial, sans-serif", gf: 'Archivo:wght@400;500;600;700;800;900' },
    syne: { name: 'Syne', css: "'Syne', 'Helvetica Neue', Arial, sans-serif", gf: 'Syne:wght@400;500;600;700;800' },
    dmsans: { name: 'DM Sans', css: "'DM Sans', 'Helvetica Neue', Arial, sans-serif", gf: 'DM+Sans:wght@400;500;600;700' },
    worksans: { name: 'Work Sans', css: "'Work Sans', 'Helvetica Neue', Arial, sans-serif", gf: 'Work+Sans:wght@400;500;600;700;800' },
    fraunces: { name: 'Fraunces', css: "'Fraunces', Georgia, serif", gf: 'Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900' },
    playfair: { name: 'Playfair Display', css: "'Playfair Display', Georgia, serif", gf: 'Playfair+Display:wght@400;600;700;800' },
    plexmono: { name: 'IBM Plex Mono', css: "'IBM Plex Mono', Menlo, monospace", gf: 'IBM+Plex+Mono:wght@400;500;600;700' },
    georgia: { name: 'Georgia (sistem)', css: "Georgia, 'Times New Roman', serif", gf: '' },
  };
  const fontLinkFor = (ids) => { const fam = [...new Set(ids)].map(i => FONTS[i]?.gf).filter(Boolean); return fam.length ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fam.map(f => 'family=' + f).join('&')}&display=swap">` : ''; };
  const loadedFonts = new Set(['archivo', 'plexmono']);
  function ensureFonts(ids) {
    ids.forEach(id => { const f = FONTS[id]; if (!f || !f.gf || loadedFonts.has(id)) return; loadedFonts.add(id); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?family=${f.gf}&display=swap`; document.head.appendChild(l); });
  }

  const PRESETS = {
    brut: { name: 'Brut', paper: '#FFFFFF', ink: '#121212', accent: '#2B49FF', line: '2', shadow: '1', fontH: 'archivo', fontB: 'archivo' },
    curat: { name: 'Curat', paper: '#FAFAF8', ink: '#1A1A1A', accent: '#0A7A3E', line: '1', shadow: '0', fontH: 'dmsans', fontB: 'dmsans' },
    noapte: { name: 'Noapte', paper: '#121212', ink: '#F2F2EE', accent: '#F5C400', line: '1', shadow: '0', fontH: 'syne', fontB: 'worksans' },
    editorial: { name: 'Editorial', paper: '#F4F2EC', ink: '#1B1A17', accent: '#B4321C', line: '1', shadow: '0', fontH: 'fraunces', fontB: 'worksans' },
    beton: { name: 'Beton', paper: '#E8E8E4', ink: '#0E0E0E', accent: '#0E0E0E', line: '2', shadow: '1', fontH: 'archivo', fontB: 'plexmono' },
    marin: { name: 'Marin', paper: '#0B1F3A', ink: '#EAF0F7', accent: '#5CD0FF', line: '1', shadow: '0', fontH: 'playfair', fontB: 'dmsans' },
  };
  const ACCENTS = ['#2B49FF', '#121212', '#D3341C', '#0A7A3E', '#E0A400', '#7A1FA2'];
  const WIDTHS = { narrow: 860, normal: 1100, wide: 1320 };

  // =====================================================================
  // Blocks
  // =====================================================================
  const COMMON = [
    { key: 'bg', label: 'Fundal', kind: 'seg', options: [['none', 'Simplu'], ['tint', 'Nuanțat'], ['dark', 'Închis'], ['accent', 'Accent']], adv: true },
    { key: 'pad', label: 'Spațiere', kind: 'seg', options: [['s', 'Mică'], ['m', 'Medie'], ['l', 'Mare']], adv: true },
  ];
  const ALIGN = { key: 'align', label: 'Aliniere', kind: 'seg', options: [['left', 'Stânga'], ['center', 'Centru']] };
  const COLS = (max = 4, def = 3) => ({ key: 'cols', label: 'Coloane', kind: 'seg', options: [['2', '2'], ['3', '3'], ['4', '4']].slice(0, max - 1) });

  const svg = (inner) => `<svg class="ico" viewBox="0 0 80 20">${inner}</svg>`;
  const sec = (b, inner, cls = '') => `<section class="sec ${cls} bg-${b.bg || 'none'} pad-${b.pad || 'm'}"><div class="wrap">${inner}</div></section>`;
  const btnHTML = (text, link, style = 'solid') => text ? `<a class="button ${style === 'outline' ? 'outline' : ''}" href="${esc(safeHref(link))}">${esc(text)}</a>` : '';
  const img = (src, alt, cls = '') => { const s = safeSrc(src); return s ? `<img class="${cls}" src="${esc(s)}" alt="${esc(alt)}" loading="lazy">` : `<div class="img-ph ${cls}"><span>Imagine</span></div>`; };
  const kicker = (t) => t ? `<div class="kicker">${esc(t)}</div>` : '';

  const BLOCKS = {
    hero: {
      name: 'Hero', group: 'Început',
      icon: svg('<rect x="1" y="1" width="78" height="18"/><rect class="fill" x="8" y="5" width="34" height="4"/><rect class="acc" x="8" y="12" width="16" height="4"/><rect x="50" y="5" width="22" height="10"/>'),
      defaults: { kicker: 'Studio de design și dezvoltare', title: 'Construim lucruri solide', subtitle: 'Site-uri, aplicații și identități vizuale care rezistă. Fără zgomot, fără colțuri rotunjite.', button: 'Vezi proiectele', link: '#proiecte', button2: 'Contact', link2: '#contact', layout: 'split', image: '', align: 'left', bg: 'none', pad: 'l' },
      fields: [
        { key: 'kicker', label: 'Supratitlu', kind: 'text' },
        { key: 'title', label: 'Titlu', kind: 'textarea', short: true },
        { key: 'subtitle', label: 'Subtitlu', kind: 'textarea' },
        { key: 'button', label: 'Buton principal', kind: 'text' }, { key: 'link', label: 'Link principal', kind: 'url' },
        { key: 'button2', label: 'Buton secundar', kind: 'text', hint: 'Lasă gol ca să-l ascunzi.' }, { key: 'link2', label: 'Link secundar', kind: 'url' },
        { key: 'layout', label: 'Așezare', kind: 'seg', options: [['text', 'Text'], ['split', 'Imagine lateral'], ['cover', 'Imagine fundal']] },
        { key: 'image', label: 'Imagine', kind: 'image' },
        ALIGN,
      ],
      render: (b) => {
        const text = `<div class="hero-text">${kicker(b.kicker)}<h1>${esc(b.title).replace(/\n/g, '<br>')}</h1>${b.subtitle ? `<p class="lead">${esc(b.subtitle)}</p>` : ''}<div class="btns">${btnHTML(b.button, b.link)}${btnHTML(b.button2, b.link2, 'outline')}</div></div>`;
        if (b.layout === 'cover') {
          const s = safeSrc(b.image);
          return `<section class="sec hero cover pad-${b.pad || 'l'} ${b.align === 'center' ? 'center' : ''}" style="${s ? `background-image:url('${esc(s)}')` : ''}"><div class="wrap">${text}</div></section>`;
        }
        if (b.layout === 'split') return sec(b, `<div class="hero-split ${b.align === 'center' ? 'center' : ''}">${text}<div class="hero-media">${img(b.image, b.title, 'hero-img')}</div></div>`, 'hero');
        return sec(b, `<div class="${b.align === 'center' ? 'center' : ''}">${text}</div>`, 'hero');
      },
    },
    heading: {
      name: 'Titlu', group: 'Conținut',
      icon: svg('<rect class="fill" x="1" y="4" width="50" height="10"/>'),
      defaults: { kicker: '', text: 'Un titlu de secțiune', sub: '', level: 'h2', align: 'left', bg: 'none', pad: 's' },
      fields: [
        { key: 'kicker', label: 'Supratitlu', kind: 'text' },
        { key: 'text', label: 'Titlu', kind: 'text' },
        { key: 'sub', label: 'Subtitlu', kind: 'textarea', short: true },
        { key: 'level', label: 'Mărime', kind: 'seg', options: [['h2', 'Mare'], ['h3', 'Mediu'], ['h4', 'Mic']] },
        ALIGN,
      ],
      render: (b) => { const l = ['h2', 'h3', 'h4'].includes(b.level) ? b.level : 'h2'; return sec(b, `<div class="head ${b.align === 'center' ? 'center' : ''}">${kicker(b.kicker)}<${l}>${esc(b.text)}</${l}>${b.sub ? `<p class="lead">${esc(b.sub)}</p>` : ''}</div>`); },
    },
    text: {
      name: 'Text', group: 'Conținut',
      icon: svg('<line x1="1" y1="3" x2="79" y2="3"/><line x1="1" y1="10" x2="79" y2="10"/><line x1="1" y1="17" x2="52" y2="17"/>'),
      defaults: { text: 'Scrie aici textul. Un rând gol între paragrafe creează un paragraf nou.', cols: '1', size: 'normal', align: 'left', bg: 'none', pad: 'm' },
      fields: [
        { key: 'text', label: 'Conținut', kind: 'textarea', hint: 'Rând gol = paragraf nou.' },
        { key: 'cols', label: 'Coloane', kind: 'seg', options: [['1', 'Una'], ['2', 'Două']] },
        { key: 'size', label: 'Mărime text', kind: 'seg', options: [['normal', 'Normal'], ['large', 'Mare']] },
        ALIGN,
      ],
      render: (b) => sec(b, `<div class="prose ${b.cols === '2' ? 'two' : ''} ${b.size === 'large' ? 'large' : ''} ${b.align === 'center' ? 'center' : ''}">${paras(b.text)}</div>`),
    },
    image: {
      name: 'Imagine', group: 'Media',
      icon: svg('<rect x="1" y="1" width="78" height="18"/><line x1="1" y1="19" x2="30" y2="6"/><line x1="30" y1="6" x2="50" y2="15"/><line x1="50" y1="15" x2="79" y2="4"/>'),
      defaults: { src: '', alt: 'Descrierea imaginii', caption: '', width: 'content', bg: 'none', pad: 'm' },
      fields: [
        { key: 'src', label: 'Imagine', kind: 'image' },
        { key: 'alt', label: 'Text alternativ', kind: 'text' },
        { key: 'caption', label: 'Legendă', kind: 'text' },
        { key: 'width', label: 'Lățime', kind: 'seg', options: [['narrow', 'Îngustă'], ['content', 'Conținut'], ['full', 'Toată']] },
      ],
      render: (b) => {
        const fig = `<figure class="fig w-${b.width || 'content'}">${img(b.src, b.alt)}${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`;
        return b.width === 'full' ? `<section class="sec bg-${b.bg || 'none'} pad-${b.pad || 'm'} full">${fig}</section>` : sec(b, fig);
      },
    },
    gallery: {
      name: 'Galerie', group: 'Media',
      icon: svg('<rect x="1" y="1" width="24" height="18"/><rect x="28" y="1" width="24" height="18"/><rect x="55" y="1" width="24" height="18"/>'),
      defaults: { items: '', cols: '3', bg: 'none', pad: 'm' },
      fields: [
        { key: 'items', label: 'Imagini', kind: 'images', hint: 'Un URL pe rând, sau încarcă de pe calculator.' },
        COLS(4, 3),
      ],
      render: (b) => { const it = lines(b.items); return sec(b, `<div class="grid cols-${b.cols || '3'} gallery">${(it.length ? it : ['', '', '']).map((u, i) => `<figure class="fig">${img(u, 'Imagine ' + (i + 1))}</figure>`).join('')}</div>`); },
    },
    features: {
      name: 'Caracteristici', group: 'Secțiuni',
      icon: svg('<rect x="1" y="1" width="24" height="18"/><rect class="acc" x="5" y="5" width="5" height="5"/><rect x="28" y="1" width="24" height="18"/><rect class="acc" x="32" y="5" width="5" height="5"/><rect x="55" y="1" width="24" height="18"/><rect class="acc" x="59" y="5" width="5" height="5"/>'),
      defaults: { kicker: 'Ce facem', title: 'Servicii care rezistă', items: 'Design de produs|Interfețe clare, gândite pentru oameni, nu pentru premii.\nDezvoltare web|Cod curat, rapid, fără dependențe inutile.\nBranding|Identități vizuale cu caracter, aplicate consecvent.', cols: '3', style: 'cards', bg: 'none', pad: 'm' },
      fields: [
        { key: 'kicker', label: 'Supratitlu', kind: 'text' }, { key: 'title', label: 'Titlu', kind: 'text' },
        { key: 'items', label: 'Elemente', kind: 'lines', hint: 'Un element pe rând: Titlu | Descriere' },
        COLS(4, 3),
        { key: 'style', label: 'Stil', kind: 'seg', options: [['cards', 'Carduri'], ['plain', 'Simplu'], ['numbered', 'Numerotat']] },
      ],
      render: (b) => sec(b, `${b.title || b.kicker ? `<div class="head">${kicker(b.kicker)}${b.title ? `<h2>${esc(b.title)}</h2>` : ''}</div>` : ''}<div class="grid cols-${b.cols || '3'} feats ${b.style}">${rows(b.items).map(([t, d], i) => `<div class="feat"><span class="mark">${b.style === 'numbered' ? String(i + 1).padStart(2, '0') : ''}</span><h3>${esc(t)}</h3>${d ? `<p>${esc(d)}</p>` : ''}</div>`).join('')}</div>`),
    },
    columns: {
      name: 'Două coloane', group: 'Conținut',
      icon: svg('<rect x="1" y="1" width="37" height="18"/><rect x="42" y="1" width="37" height="18"/>'),
      defaults: { leftTitle: 'Ce facem', left: 'Site-uri, aplicații și identități vizuale care rezistă în timp.', rightTitle: 'Cum lucrăm', right: 'Direct, fără ședințe inutile. Livrăm săptămânal.', bg: 'none', pad: 'm' },
      fields: [
        { key: 'leftTitle', label: 'Titlu stânga', kind: 'text' }, { key: 'left', label: 'Text stânga', kind: 'textarea' },
        { key: 'rightTitle', label: 'Titlu dreapta', kind: 'text' }, { key: 'right', label: 'Text dreapta', kind: 'textarea' },
      ],
      render: (b) => sec(b, `<div class="cols2"><div>${b.leftTitle ? `<h3>${esc(b.leftTitle)}</h3>` : ''}${paras(b.left)}</div><div>${b.rightTitle ? `<h3>${esc(b.rightTitle)}</h3>` : ''}${paras(b.right)}</div></div>`),
    },
    textimage: {
      name: 'Text + imagine', group: 'Conținut',
      icon: svg('<line x1="1" y1="4" x2="36" y2="4"/><line x1="1" y1="10" x2="36" y2="10"/><line x1="1" y1="16" x2="24" y2="16"/><rect x="44" y="1" width="35" height="18"/>'),
      defaults: { kicker: '', title: 'Despre noi', text: 'Suntem un studio mic din Chișinău. Lucrăm cu puțini clienți deodată, ca să putem face treaba bine.', button: '', link: '#', image: '', side: 'right', bg: 'none', pad: 'm' },
      fields: [
        { key: 'kicker', label: 'Supratitlu', kind: 'text' }, { key: 'title', label: 'Titlu', kind: 'text' },
        { key: 'text', label: 'Text', kind: 'textarea' },
        { key: 'button', label: 'Buton', kind: 'text' }, { key: 'link', label: 'Link', kind: 'url' },
        { key: 'image', label: 'Imagine', kind: 'image' },
        { key: 'side', label: 'Imaginea', kind: 'seg', options: [['left', 'Stânga'], ['right', 'Dreapta']] },
      ],
      render: (b) => sec(b, `<div class="ti ${b.side === 'left' ? 'img-left' : ''}"><div class="ti-text">${kicker(b.kicker)}${b.title ? `<h2>${esc(b.title)}</h2>` : ''}${paras(b.text)}${b.button ? `<div class="btns">${btnHTML(b.button, b.link)}</div>` : ''}</div><div class="ti-media">${img(b.image, b.title)}</div></div>`),
    },
    stats: {
      name: 'Cifre', group: 'Secțiuni',
      icon: svg('<text x="2" y="16" font-size="16" font-weight="800" fill="currentColor">12</text><text x="30" y="16" font-size="16" font-weight="800" fill="currentColor">98%</text>'),
      defaults: { items: '12 ani|de experiență\n140+|proiecte livrate\n98%|clienți care revin\n3|oameni în echipă', bg: 'dark', pad: 'm' },
      fields: [{ key: 'items', label: 'Cifre', kind: 'lines', hint: 'Un rând: Valoare | Etichetă' }],
      render: (b) => sec(b, `<div class="stats">${rows(b.items).map(([v, l]) => `<div class="stat"><strong>${esc(v)}</strong><span>${esc(l || '')}</span></div>`).join('')}</div>`),
    },
    list: {
      name: 'Listă', group: 'Conținut',
      icon: svg('<rect class="fill" x="1" y="2" width="5" height="5"/><line x1="11" y1="4.5" x2="70" y2="4.5"/><rect class="fill" x="1" y="9" width="5" height="5"/><line x1="11" y1="11.5" x2="60" y2="11.5"/><rect class="fill" x="1" y="16" width="5" height="4"/><line x1="11" y1="18" x2="66" y2="18"/>'),
      defaults: { title: 'Ce include', items: 'Analiză și strategie\nDesign de interfață\nDezvoltare și testare\nLansare și mentenanță', style: 'rules', bg: 'none', pad: 'm' },
      fields: [
        { key: 'title', label: 'Titlu', kind: 'text' },
        { key: 'items', label: 'Elemente', kind: 'lines', hint: 'Un element pe rând.' },
        { key: 'style', label: 'Stil', kind: 'seg', options: [['rules', 'Linii'], ['check', 'Bife'], ['numbers', 'Numere']] },
      ],
      render: (b) => sec(b, `${b.title ? `<h3>${esc(b.title)}</h3>` : ''}<ul class="list ${b.style || 'rules'}">${lines(b.items).map(i => `<li>${esc(i)}</li>`).join('')}</ul>`),
    },
    quote: {
      name: 'Citat', group: 'Conținut',
      icon: svg('<rect class="acc" x="1" y="1" width="4" height="18"/><line x1="12" y1="5" x2="70" y2="5"/><line x1="12" y1="12" x2="60" y2="12"/>'),
      defaults: { text: 'Au livrat exact ce am cerut, la timp, fără surprize.', author: 'Ana Popescu', role: 'Fondator, Atelier Nord', bg: 'none', pad: 'm' },
      fields: [{ key: 'text', label: 'Citat', kind: 'textarea' }, { key: 'author', label: 'Autor', kind: 'text' }, { key: 'role', label: 'Funcție', kind: 'text' }],
      render: (b) => sec(b, `<blockquote class="big"><p>${esc(b.text)}</p>${b.author ? `<cite>${esc(b.author)}${b.role ? `<span>${esc(b.role)}</span>` : ''}</cite>` : ''}</blockquote>`),
    },
    testimonials: {
      name: 'Testimoniale', group: 'Secțiuni',
      icon: svg('<rect x="1" y="1" width="37" height="18"/><rect class="acc" x="5" y="5" width="3" height="10"/><rect x="42" y="1" width="37" height="18"/><rect class="acc" x="46" y="5" width="3" height="10"/>'),
      defaults: { kicker: 'Ce spun clienții', title: '', items: 'Rapizi, direcți și foarte atenți la detalii. Recomand.|Mihai Rusu|CEO, Ferma Verde\nAu înțeles din prima ce vrem. Site-ul aduce clienți de la lansare.|Irina Dima|Manager, Casa Maria\nColaborare fără bătăi de cap. Livrare la termen, de fiecare dată.|Radu Ilie|Fondator, Bricolaj Pro', cols: '3', bg: 'tint', pad: 'm' },
      fields: [
        { key: 'kicker', label: 'Supratitlu', kind: 'text' }, { key: 'title', label: 'Titlu', kind: 'text' },
        { key: 'items', label: 'Testimoniale', kind: 'lines', hint: 'Un rând: Citat | Nume | Funcție' },
        COLS(3, 3),
      ],
      render: (b) => sec(b, `${b.title || b.kicker ? `<div class="head">${kicker(b.kicker)}${b.title ? `<h2>${esc(b.title)}</h2>` : ''}</div>` : ''}<div class="grid cols-${b.cols || '3'} tms">${rows(b.items).map(([q, n, r]) => `<blockquote class="tm"><p>${esc(q)}</p><cite>${esc(n || '')}${r ? `<span>${esc(r)}</span>` : ''}</cite></blockquote>`).join('')}</div>`),
    },
    pricing: {
      name: 'Prețuri', group: 'Secțiuni',
      icon: svg('<rect x="1" y="3" width="24" height="16"/><rect class="acc" x="28" y="1" width="24" height="18"/><rect x="55" y="3" width="24" height="16"/>'),
      defaults: { kicker: 'Prețuri', title: 'Simplu și transparent', items: 'Start|490 €|o singură dată|Site de prezentare, 3 pagini;Design responsive;Livrare în 2 săptămâni|Alege\n*Business|1 200 €|o singură dată|Până la 8 pagini;Blog sau portofoliu;Optimizare SEO de bază;Suport 3 luni|Alege\nCustom|de la 3 000 €|proiect|Aplicație web;Integrări;Echipă dedicată|Hai să vorbim', link: '#contact', bg: 'none', pad: 'm' },
      fields: [
        { key: 'kicker', label: 'Supratitlu', kind: 'text' }, { key: 'title', label: 'Titlu', kind: 'text' },
        { key: 'items', label: 'Pachete', kind: 'lines', hint: 'Un rând: Nume | Preț | Perioadă | Funcție;Funcție;Funcție | Text buton. Pune * în fața numelui ca să-l evidențiezi.' },
        { key: 'link', label: 'Link butoane', kind: 'url' },
      ],
      render: (b) => sec(b, `${b.title || b.kicker ? `<div class="head center">${kicker(b.kicker)}${b.title ? `<h2>${esc(b.title)}</h2>` : ''}</div>` : ''}<div class="grid cols-${Math.min(4, Math.max(2, rows(b.items).length))} plans">${rows(b.items).map(([n, p, per, f, bt]) => { const hot = n.startsWith('*'); n = n.replace(/^\*/, ''); return `<div class="plan ${hot ? 'hot' : ''}"><div class="plan-name">${esc(n)}</div><div class="price">${esc(p || '')}${per ? `<span>${esc(per)}</span>` : ''}</div><ul>${(f || '').split(';').map(s => s.trim()).filter(Boolean).map(s => `<li>${esc(s)}</li>`).join('')}</ul>${btnHTML(bt || 'Alege', b.link, hot ? 'solid' : 'outline')}</div>`; }).join('')}</div>`),
    },
    faq: {
      name: 'Întrebări', group: 'Secțiuni',
      icon: svg('<line x1="1" y1="4" x2="60" y2="4"/><line x1="72" y1="1" x2="72" y2="7"/><line x1="69" y1="4" x2="75" y2="4"/><line x1="1" y1="16" x2="55" y2="16"/><line x1="69" y1="16" x2="75" y2="16"/>'),
      defaults: { title: 'Întrebări frecvente', items: 'Cât durează un proiect?|Un site de prezentare, 2–3 săptămâni. O aplicație, în funcție de complexitate, 2–4 luni.\nLucrați cu clienți din afara țării?|Da. Jumătate din proiectele noastre sunt pentru clienți din UE.\nCe se întâmplă după lansare?|Oferim mentenanță lunară sau te învățăm să administrezi singur site-ul.', bg: 'none', pad: 'm' },
      fields: [{ key: 'title', label: 'Titlu', kind: 'text' }, { key: 'items', label: 'Întrebări', kind: 'lines', hint: 'Un rând: Întrebare | Răspuns' }],
      render: (b) => sec(b, `<div class="faq-wrap">${b.title ? `<h2>${esc(b.title)}</h2>` : ''}<div class="faq">${rows(b.items).map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${esc(a || '')}</div></details>`).join('')}</div></div>`),
    },
    team: {
      name: 'Echipă', group: 'Secțiuni',
      icon: svg('<rect x="1" y="1" width="18" height="18"/><circle cx="10" cy="8" r="3"/><rect x="24" y="1" width="18" height="18"/><circle cx="33" cy="8" r="3"/><rect x="47" y="1" width="18" height="18"/><circle cx="56" cy="8" r="3"/>'),
      defaults: { kicker: 'Echipa', title: 'Oamenii din spatele proiectelor', items: 'Mihail Chircu|Design & produs|\nNicu Ionescu|Dezvoltare|\nAna Rusu|Strategie|', cols: '3', bg: 'none', pad: 'm' },
      fields: [
        { key: 'kicker', label: 'Supratitlu', kind: 'text' }, { key: 'title', label: 'Titlu', kind: 'text' },
        { key: 'items', label: 'Membri', kind: 'lines', hint: 'Un rând: Nume | Rol | URL imagine (opțional)' },
        COLS(4, 3),
      ],
      render: (b) => sec(b, `${b.title || b.kicker ? `<div class="head">${kicker(b.kicker)}${b.title ? `<h2>${esc(b.title)}</h2>` : ''}</div>` : ''}<div class="grid cols-${b.cols || '3'} team">${rows(b.items).map(([n, r, u]) => `<div class="member">${img(u, n, 'avatar')}<strong>${esc(n)}</strong>${r ? `<span>${esc(r)}</span>` : ''}</div>`).join('')}</div>`),
    },
    logos: {
      name: 'Logo-uri', group: 'Secțiuni',
      icon: svg('<rect x="1" y="5" width="16" height="10"/><rect x="22" y="5" width="16" height="10"/><rect x="43" y="5" width="16" height="10"/><rect x="64" y="5" width="15" height="10"/>'),
      defaults: { title: 'Au lucrat cu noi', items: 'Ferma Verde\nCasa Maria\nBricolaj Pro\nAtelier Nord\nStudio 9', bg: 'tint', pad: 's' },
      fields: [{ key: 'title', label: 'Titlu', kind: 'text' }, { key: 'items', label: 'Logo-uri', kind: 'lines', hint: 'Un nume sau un URL de imagine pe rând.' }],
      render: (b) => sec(b, `${b.title ? `<div class="kicker center">${esc(b.title)}</div>` : ''}<div class="logos">${lines(b.items).map(l => /^https?:|^data:/.test(l) ? `<div class="logo">${img(l, 'Logo')}</div>` : `<div class="logo"><span>${esc(l)}</span></div>`).join('')}</div>`),
    },
    cta: {
      name: 'Îndemn', group: 'Secțiuni',
      icon: svg('<rect class="acc" x="1" y="1" width="78" height="18"/><rect x="8" y="6" width="34" height="3" fill="#fff" stroke="none"/><rect x="56" y="5" width="16" height="9" fill="#fff" stroke="none"/>'),
      defaults: { title: 'Hai să construim ceva împreună', text: 'Spune-ne ce ai nevoie și revenim cu o ofertă în 24 de ore.', button: 'Cere o ofertă', link: '#contact', align: 'left', bg: 'accent', pad: 'l' },
      fields: [
        { key: 'title', label: 'Titlu', kind: 'text' }, { key: 'text', label: 'Text', kind: 'textarea', short: true },
        { key: 'button', label: 'Buton', kind: 'text' }, { key: 'link', label: 'Link', kind: 'url' }, ALIGN,
      ],
      render: (b) => sec(b, `<div class="cta ${b.align === 'center' ? 'center' : ''}"><div><h2>${esc(b.title)}</h2>${b.text ? `<p class="lead">${esc(b.text)}</p>` : ''}</div><div class="btns">${btnHTML(b.button, b.link)}</div></div>`),
    },
    contact: {
      name: 'Contact', group: 'Secțiuni',
      icon: svg('<rect x="1" y="1" width="44" height="6"/><rect x="1" y="10" width="44" height="9"/><rect class="acc" x="52" y="12" width="27" height="7"/><line x1="52" y1="3" x2="79" y2="3"/><line x1="52" y1="7" x2="72" y2="7"/>'),
      defaults: { title: 'Scrie-ne', text: 'Răspundem în aceeași zi lucrătoare.', email: 'salut@exemplu.ro', phone: '+373 60 000 000', address: 'str. Exemplu 12, Chișinău', action: '', button: 'Trimite mesajul', phoneField: '1', bg: 'none', pad: 'm' },
      fields: [
        { key: 'title', label: 'Titlu', kind: 'text' }, { key: 'text', label: 'Text', kind: 'textarea', short: true },
        { key: 'email', label: 'Email afișat', kind: 'text' }, { key: 'phone', label: 'Telefon afișat', kind: 'text' }, { key: 'address', label: 'Adresă', kind: 'text' },
        { key: 'action', label: 'Unde ajung mesajele', kind: 'url', hint: 'Lasă gol ca să deschidă aplicația de email. Sau pune un URL de la Formspree / Basin ca să primești mesajele direct.' },
        { key: 'button', label: 'Text buton', kind: 'text' },
        { key: 'phoneField', label: 'Câmp telefon', kind: 'seg', options: [['1', 'Da'], ['0', 'Nu']] },
      ],
      render: (b) => {
        const action = /^https:\/\//i.test(b.action || '') ? b.action : `mailto:${b.email || ''}`;
        const mail = action.startsWith('mailto:');
        return sec(b, `<div class="contact"><div class="contact-info">${b.title ? `<h2>${esc(b.title)}</h2>` : ''}${b.text ? `<p class="lead">${esc(b.text)}</p>` : ''}<dl>${b.email ? `<div><dt>Email</dt><dd><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></dd></div>` : ''}${b.phone ? `<div><dt>Telefon</dt><dd><a href="tel:${esc(b.phone.replace(/\s/g, ''))}">${esc(b.phone)}</a></dd></div>` : ''}${b.address ? `<div><dt>Adresă</dt><dd>${esc(b.address)}</dd></div>` : ''}</dl></div><form class="form" method="post" action="${esc(action)}" ${mail ? 'enctype="text/plain"' : ''}><label>Nume<input type="text" name="nume" required></label><label>Email<input type="email" name="email" required></label>${b.phoneField === '1' ? '<label>Telefon<input type="tel" name="telefon"></label>' : ''}<label>Mesaj<textarea name="mesaj" rows="5" required></textarea></label><button class="button" type="submit">${esc(b.button || 'Trimite')}</button></form></div>`);
      },
    },
    embed: {
      name: 'Video / Hartă', group: 'Media',
      icon: svg('<rect x="1" y="1" width="78" height="18"/><polygon points="34,5 34,15 46,10" fill="currentColor"/>'),
      defaults: { url: '', ratio: '16-9', title: '', bg: 'none', pad: 'm' },
      fields: [
        { key: 'url', label: 'Link YouTube, Vimeo sau Google Maps', kind: 'url', hint: 'Pentru Google Maps: Distribuie → Încorporează o hartă → copiază codul sau adresa din src.' },
        { key: 'ratio', label: 'Proporție', kind: 'seg', options: [['16-9', '16:9'], ['4-3', '4:3'], ['1-1', '1:1']] },
      ],
      render: (b) => { const u = embedUrl(b.url); return sec(b, `<div class="embed r-${b.ratio || '16-9'}">${u ? `<iframe src="${esc(u)}" loading="lazy" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" title="${esc(b.title || 'Conținut încorporat')}"></iframe>` : '<div class="img-ph"><span>Video sau hartă – adaugă un link</span></div>'}</div>`); },
    },
    button: {
      name: 'Buton', group: 'Conținut',
      icon: svg('<rect class="acc" x="18" y="3" width="44" height="14"/>'),
      defaults: { text: 'Contactează-ne', link: '#contact', style: 'solid', align: 'left', bg: 'none', pad: 's' },
      fields: [
        { key: 'text', label: 'Text', kind: 'text' },
        { key: 'link', label: 'Link', kind: 'url', hint: 'Poate fi mailto:, tel:, #pagina sau un URL.' },
        { key: 'style', label: 'Stil', kind: 'seg', options: [['solid', 'Plin'], ['outline', 'Contur']] }, ALIGN,
      ],
      render: (b) => sec(b, `<div class="btns ${b.align === 'center' ? 'center' : ''}">${btnHTML(b.text, b.link, b.style)}</div>`),
    },
    divider: {
      name: 'Linie', group: 'Structură',
      icon: svg('<line x1="1" y1="10" x2="79" y2="10"/>'),
      defaults: { bg: 'none', pad: 's' }, fields: [],
      render: (b) => sec(b, `<hr>`),
    },
    spacer: {
      name: 'Spațiu', group: 'Structură',
      icon: svg('<line x1="1" y1="2" x2="79" y2="2"/><line x1="1" y1="18" x2="79" y2="18"/><line x1="40" y1="5" x2="40" y2="15"/>'),
      defaults: { size: 'm' }, fields: [{ key: 'size', label: 'Mărime', kind: 'seg', options: [['s', 'Mic'], ['m', 'Mediu'], ['l', 'Mare']] }],
      render: (b) => `<div class="spacer-${['s', 'm', 'l'].includes(b.size) ? b.size : 'm'}"></div>`,
      noCommon: true,
    },
  };
  const GROUPS = ['Început', 'Conținut', 'Media', 'Secțiuni', 'Structură'];

  // =====================================================================
  // Site CSS (canvas, preview, export share it)
  // =====================================================================
  function siteCSS(s) {
    const H = FONTS[s.fontH]?.css || FONTS.archivo.css, B = FONTS[s.fontB]?.css || FONTS.archivo.css;
    const lw = s.line === '0' ? 0 : s.line === '1' ? 1 : 2;
    const sh = s.shadow === '1' ? `${lw ? lw * 2 + 2 : 4}px ${lw ? lw * 2 + 2 : 4}px 0 var(--ink)` : 'none';
    const accInk = isDark(s.accent) ? '#FFFFFF' : '#121212';
    const w = WIDTHS[s.width] || WIDTHS.normal;
    return `
.site{--acc:${s.accent};--acc-ink:${accInk};--paper:${s.paper};--ink:${s.ink};--muted:color-mix(in srgb,var(--ink) 58%,var(--paper));--tint:color-mix(in srgb,var(--ink) 5%,var(--paper));--edge:color-mix(in srgb,var(--ink) 18%,var(--paper));--lw:${lw}px;--w:${w}px;--fh:${H};--fb:${B};--sh:${sh};
font-family:var(--fb);color:var(--ink);background:var(--paper);line-height:1.55;font-size:17px;container-type:inline-size;margin:0;-webkit-font-smoothing:antialiased}
.site *{box-sizing:border-box;border-radius:0}
.site a{color:inherit}
.site .wrap{max-width:var(--w);margin:0 auto;padding-left:40px;padding-right:40px}
.site .sec{padding:64px 0}
.site .pad-s{padding:24px 0}.site .pad-l{padding:110px 0}
.site .sec.full{padding-left:0;padding-right:0}
.site .bg-tint{background:var(--tint)}
.site .bg-dark{--paper:${s.ink};--ink:${s.paper};background:var(--paper);color:var(--ink)}
.site .bg-accent{--paper:${s.accent};--ink:${accInk};--acc:${accInk};--acc-ink:${s.accent};background:var(--paper);color:var(--ink)}
.site h1,.site h2,.site h3,.site h4{font-family:var(--fh);margin:0 0 14px;line-height:1.05;letter-spacing:-0.025em;text-wrap:balance;font-weight:800}
.site h1{font-size:clamp(40px,6.5cqw,76px)}
.site h2{font-size:clamp(30px,4cqw,46px)}
.site h3{font-size:22px;line-height:1.2}
.site h4{font-size:16px;text-transform:uppercase;letter-spacing:.08em}
.site p{margin:0 0 14px;max-width:65ch}
.site p:last-child{margin-bottom:0}
.site .lead{font-size:20px;line-height:1.45;max-width:50ch}
.site .center{text-align:center}
.site .center p,.site .center .lead,.site .center .kicker{margin-left:auto;margin-right:auto}
.site .center .btns{justify-content:center}
.site .kicker{font-family:var(--fb);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:var(--acc);margin-bottom:14px;display:flex;align-items:center;gap:10px}
.site .kicker::before{content:"";width:18px;height:3px;background:var(--acc);flex:none}
.site .kicker.center{justify-content:center}
.site .bg-accent .kicker{color:var(--ink)}.site .bg-accent .kicker::before{background:var(--ink)}
.site .head{margin-bottom:36px}
.site .head .lead{margin-top:6px}
.site .btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
.site .button{display:inline-block;padding:14px 26px;background:var(--acc);color:var(--acc-ink);font-weight:700;text-decoration:none;border:var(--lw) solid var(--ink);box-shadow:var(--sh);font-family:var(--fb);line-height:1;cursor:pointer;font-size:16px;transition:transform 80ms,box-shadow 80ms}
.site .button.outline{background:transparent;color:var(--ink)}
.site .button:hover{transform:translate(-2px,-2px);box-shadow:${s.shadow === '1' ? `${(lw ? lw * 2 + 2 : 4) + 2}px ${(lw ? lw * 2 + 2 : 4) + 2}px 0 var(--ink)` : 'none'};${s.shadow === '1' ? '' : 'opacity:.85'}}
.site .button:active{transform:none}
.site .lines-0 .button.outline{border-color:var(--ink);border-width:2px}
/* hero */
.site .hero-text .lead{margin-top:8px;margin-bottom:28px}
.site .hero-split{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center}
.site .hero-media img,.site .hero-media .img-ph{width:100%;aspect-ratio:4/3;object-fit:cover;border:var(--lw) solid var(--ink);box-shadow:var(--sh)}
.site .hero.cover{position:relative;background:var(--ink) center/cover no-repeat;--paper:${s.ink};--ink:#fff;color:#fff;min-height:70cqw;max-height:720px;display:flex;align-items:flex-end}
.site .hero.cover::before{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.72),rgba(0,0,0,.15));pointer-events:none}
.site .hero.cover .wrap{position:relative;width:100%}
.site .hero.cover .kicker{color:var(--acc)}.site .hero.cover .kicker::before{background:var(--acc)}
.site .hero.cover .button.outline{color:#fff;border-color:#fff;box-shadow:none}
/* prose */
.site .prose.two{columns:2;column-gap:40px}
.site .prose.two p{break-inside:avoid;max-width:none}
.site .prose.large{font-size:21px;line-height:1.5}
.site .cols2{display:grid;grid-template-columns:1fr 1fr;gap:40px}
.site .cols2>div{border-left:4px solid var(--acc);padding-left:22px}
.site .ti{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.site .ti.img-left .ti-text{order:2}
.site .ti-media img,.site .ti-media .img-ph{width:100%;aspect-ratio:4/3;object-fit:cover;border:var(--lw) solid var(--ink);box-shadow:var(--sh)}
/* grids */
.site .grid{display:grid;gap:20px}
.site .cols-2{grid-template-columns:repeat(2,1fr)}.site .cols-3{grid-template-columns:repeat(3,1fr)}.site .cols-4{grid-template-columns:repeat(4,1fr)}
.site .feat{padding:26px;border:var(--lw) solid var(--ink);background:var(--paper);display:flex;flex-direction:column;gap:6px}
.site .feats.cards .feat{box-shadow:var(--sh)}
.site .feats.plain .feat{border:0;padding:0 0 0 0;border-top:var(--lw) solid var(--ink);padding-top:18px}
.site .feat .mark{width:14px;height:14px;background:var(--acc);display:block;margin-bottom:12px}
.site .feats.numbered .feat .mark{width:auto;height:auto;background:none;font-family:var(--fb);font-weight:700;font-size:13px;color:var(--acc);letter-spacing:.1em}
.site .feat h3{margin-bottom:4px;font-size:20px}
.site .feat p{font-size:16px;color:var(--muted)}
.site .lines-0 .feat{background:var(--tint)}
.site .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:24px}
.site .stat{border-left:4px solid var(--acc);padding-left:18px}
.site .stat strong{display:block;font-family:var(--fh);font-size:clamp(36px,4.5cqw,60px);line-height:1;letter-spacing:-0.03em;font-variant-numeric:tabular-nums}
.site .stat span{display:block;margin-top:8px;font-size:15px;color:var(--muted)}
.site .list{list-style:none;padding:0;margin:0;max-width:65ch}
.site .list li{padding:14px 0;border-top:var(--lw) solid var(--ink);display:flex;gap:14px;align-items:baseline}
.site .list li:last-child{border-bottom:var(--lw) solid var(--ink)}
.site .lines-0 .list li{border-color:var(--edge)}
.site .list.check li::before{content:"";width:12px;height:12px;background:var(--acc);flex:none;position:relative;top:1px}
.site .list.numbers{counter-reset:n}.site .list.numbers li::before{counter-increment:n;content:counter(n,decimal-leading-zero);font-weight:700;color:var(--acc);font-size:13px;letter-spacing:.1em;min-width:26px}
.site blockquote{margin:0}
.site blockquote.big{padding:8px 0 8px 26px;border-left:8px solid var(--acc);font-family:var(--fh);font-size:clamp(24px,3cqw,34px);font-weight:600;line-height:1.25;max-width:32ch;letter-spacing:-0.01em}
.site blockquote cite{display:block;margin-top:16px;font-family:var(--fb);font-size:14px;font-style:normal;font-weight:700;letter-spacing:0;line-height:1.3}
.site blockquote cite span{display:block;font-weight:400;color:var(--muted);font-size:13px;margin-top:2px}
.site .tm{padding:26px;border:var(--lw) solid var(--ink);background:var(--paper);display:flex;flex-direction:column;justify-content:space-between;gap:18px;font-size:17px}
.site .tm p{max-width:none}
.site .lines-0 .tm{border-color:var(--edge)}
.site .plan{padding:28px;border:var(--lw) solid var(--ink);display:flex;flex-direction:column;gap:14px;background:var(--paper)}
.site .plan.hot{background:var(--ink);color:var(--paper);--muted:color-mix(in srgb,var(--paper) 70%,var(--ink));box-shadow:var(--sh)}
.site .plan.hot .button{background:var(--acc);color:var(--acc-ink);border-color:var(--paper)}
.site .plan-name{font-weight:700;text-transform:uppercase;letter-spacing:.1em;font-size:13px}
.site .price{font-family:var(--fh);font-size:38px;font-weight:800;line-height:1;letter-spacing:-0.03em}
.site .price span{display:block;font-family:var(--fb);font-size:13px;font-weight:400;color:var(--muted);margin-top:6px;letter-spacing:0}
.site .plan ul{list-style:none;padding:0;margin:4px 0 8px;flex:1;display:flex;flex-direction:column;gap:8px;font-size:15px}
.site .plan li{padding-left:20px;position:relative}.site .plan li::before{content:"";position:absolute;left:0;top:8px;width:9px;height:9px;background:var(--acc)}
.site .plan .button{text-align:center}
.site .faq-wrap{max-width:760px}
.site .faq details{border-top:var(--lw) solid var(--ink)}
.site .faq details:last-child{border-bottom:var(--lw) solid var(--ink)}
.site .lines-0 .faq details{border-color:var(--edge)}
.site .faq summary{cursor:pointer;padding:18px 40px 18px 0;font-weight:700;font-size:18px;list-style:none;position:relative}
.site .faq summary::-webkit-details-marker{display:none}
.site .faq summary::after{content:"+";position:absolute;right:0;top:12px;font-size:26px;font-weight:400;color:var(--acc);line-height:1}
.site .faq details[open] summary::after{content:"–"}
.site .faq details>div{padding:0 0 20px;color:var(--muted);max-width:65ch}
.site .team .member{display:flex;flex-direction:column;gap:4px}
.site .team .avatar,.site .team .img-ph.avatar{width:100%;aspect-ratio:1;object-fit:cover;border:var(--lw) solid var(--ink);margin-bottom:10px;filter:grayscale(1);transition:filter 200ms}
.site .team .member:hover .avatar{filter:none}
.site .team strong{font-size:18px}.site .team span{color:var(--muted);font-size:14px}
.site .logos{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:18px}
.site .logo{border:var(--lw) solid var(--ink);padding:16px 26px;font-family:var(--fh);font-weight:800;font-size:18px;letter-spacing:-0.01em;display:flex;align-items:center;justify-content:center;min-height:64px;opacity:.85}
.site .logo img{height:32px;width:auto;max-width:160px;object-fit:contain;filter:grayscale(1)}
.site .lines-0 .logo{border-color:var(--edge)}
.site .cta{display:flex;justify-content:space-between;align-items:center;gap:40px}
.site .cta h2{margin-bottom:8px}
.site .cta .lead{margin:0}
.site .cta.center{flex-direction:column;text-align:center}
.site .bg-accent .button{background:var(--ink);color:var(--paper);border-color:var(--ink);box-shadow:none}
.site .contact{display:grid;grid-template-columns:1fr 1.1fr;gap:56px;align-items:start}
.site .contact dl{margin:24px 0 0;display:flex;flex-direction:column;gap:14px}
.site .contact dl>div{border-top:var(--lw) solid var(--ink);padding-top:12px}
.site .lines-0 .contact dl>div{border-color:var(--edge)}
.site .contact dt{font-size:12px;text-transform:uppercase;letter-spacing:.12em;font-weight:700;color:var(--muted)}
.site .contact dd{margin:2px 0 0;font-size:18px;font-weight:600}
.site .form{display:flex;flex-direction:column;gap:14px;padding:28px;border:var(--lw) solid var(--ink);background:var(--paper);box-shadow:var(--sh)}
.site .lines-0 .form{background:var(--tint)}
.site .form label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.site .form input,.site .form textarea{font:inherit;font-size:16px;text-transform:none;letter-spacing:0;font-weight:400;padding:12px 14px;border:var(--lw) solid var(--ink);background:var(--paper);color:var(--ink);width:100%}
.site .lines-0 .form input,.site .lines-0 .form textarea{border:1px solid var(--edge)}
.site .form input:focus,.site .form textarea:focus{outline:3px solid var(--acc);outline-offset:0;border-color:var(--acc)}
.site .form .button{align-self:flex-start;margin-top:4px}
.site .embed{position:relative;border:var(--lw) solid var(--ink);background:var(--tint);overflow:hidden}
.site .embed.r-16-9{aspect-ratio:16/9}.site .embed.r-4-3{aspect-ratio:4/3}.site .embed.r-1-1{aspect-ratio:1/1}
.site .embed iframe,.site .embed .img-ph{position:absolute;inset:0;width:100%;height:100%;border:0}
.site .fig{margin:0}
.site .fig img{display:block;width:100%;border:var(--lw) solid var(--ink)}
.site .full .fig img{border-left:0;border-right:0}
.site .fig.w-narrow{max-width:640px;margin:0 auto}
.site figcaption{margin-top:10px;font-size:13px;color:var(--muted)}
.site .gallery .fig img,.site .gallery .img-ph{aspect-ratio:4/3;object-fit:cover}
.site .img-ph{min-height:200px;border:var(--lw) dashed var(--ink);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:13px;background:repeating-linear-gradient(45deg,var(--paper) 0 12px,var(--tint) 12px 24px)}
.site .img-ph.avatar{min-height:0}
.site hr{border:0;border-top:var(--lw) solid var(--ink);margin:0}
.site .lines-0 hr{border-top:1px solid var(--edge)}
.site .spacer-s{height:16px}.site .spacer-m{height:48px}.site .spacer-l{height:112px}
/* nav + footer */
.site nav{position:sticky;top:0;z-index:20;background:var(--paper);border-bottom:var(--lw) solid var(--ink)}
.site .lines-0 nav{border-bottom:1px solid var(--edge)}
.site nav .wrap{display:flex;align-items:center;gap:4px;min-height:68px;flex-wrap:wrap;padding-top:10px;padding-bottom:10px}
.site nav .brand{font-family:var(--fh);font-weight:800;font-size:20px;margin-right:auto;letter-spacing:-0.02em;display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink)}
.site nav .brand i{width:14px;height:14px;background:var(--acc);display:inline-block}
.site nav .brand img{height:32px;width:auto}
.site nav a.link{padding:8px 12px;text-decoration:none;color:var(--ink);font-weight:600;border-bottom:3px solid transparent;font-size:15px}
.site nav a.link.on{border-bottom-color:var(--acc)}
.site nav a.link:hover{border-bottom-color:var(--ink)}
.site nav .button{padding:10px 18px;font-size:14px;margin-left:12px}
.site footer{border-top:var(--lw) solid var(--ink);padding:48px 0 28px;background:var(--paper)}
.site .lines-0 footer{border-top:1px solid var(--edge)}
.site footer .wrap{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:40px}
.site footer .fbrand{font-family:var(--fh);font-weight:800;font-size:22px;letter-spacing:-0.02em;display:flex;align-items:center;gap:10px;margin-bottom:10px}
.site footer .fbrand i{width:12px;height:12px;background:var(--acc);display:inline-block}
.site footer p{font-size:15px;color:var(--muted);max-width:36ch}
.site footer h4{margin-bottom:12px;font-size:12px}
.site footer ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
.site footer a{text-decoration:none;color:var(--ink);font-weight:500}
.site footer a:hover{color:var(--acc)}
.site footer .legal{grid-column:1/-1;border-top:1px solid var(--edge);padding-top:18px;margin-top:8px;font-size:13px;color:var(--muted);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
@container (max-width:800px){
.site .hero-split,.site .ti,.site .contact,.site .cols2{grid-template-columns:1fr;gap:32px}
.site .ti.img-left .ti-text{order:0}
.site .cols-3,.site .cols-4{grid-template-columns:repeat(2,1fr)}
.site footer .wrap{grid-template-columns:1fr 1fr}
.site .cta{flex-direction:column;align-items:flex-start}
}
@container (max-width:560px){
.site .wrap{padding-left:20px;padding-right:20px}
.site .sec{padding:44px 0}.site .pad-l{padding:64px 0}.site .pad-s{padding:20px 0}
.site .cols-2,.site .cols-3,.site .cols-4,.site .plans{grid-template-columns:1fr}
.site .gallery.cols-3,.site .gallery.cols-4,.site .gallery.cols-2{grid-template-columns:1fr 1fr}
.site .prose.two{columns:1}
.site .lead{font-size:18px}
.site nav .wrap{min-height:60px}
.site nav a.link{padding:6px 8px;font-size:14px}
.site nav .button{margin-left:0;width:100%;text-align:center;margin-top:6px}
.site footer .wrap{grid-template-columns:1fr}
.site .hero.cover{min-height:480px}
}
`;
  }

  function renderNav(site, pages, activeIdx, hrefFn) {
    const brand = site.logo ? `<img src="${esc(safeSrc(site.logo))}" alt="${esc(site.name)}">` : `<i></i>${esc(site.name)}`;
    return `<nav><div class="wrap"><a class="brand" href="${hrefFn(0)}">${brand}</a>${pages.map((p, i) => `<a class="link ${i === activeIdx ? 'on' : ''}" href="${hrefFn(i)}">${esc(p.title)}</a>`).join('')}${site.navButton ? btnHTML(site.navButton, site.navLink) : ''}</div></nav>`;
  }
  function renderFooter(site, pages, hrefFn) {
    const links = rows(site.footerLinks || '').filter(r => r[0]);
    return `<footer><div class="wrap"><div><div class="fbrand"><i></i>${esc(site.name)}</div>${site.tagline ? `<p>${esc(site.tagline)}</p>` : ''}</div><div><h4>Pagini</h4><ul>${pages.map((p, i) => `<li><a href="${hrefFn(i)}">${esc(p.title)}</a></li>`).join('')}</ul></div><div>${links.length ? `<h4>Linkuri</h4><ul>${links.map(([l, u]) => `<li><a href="${esc(safeHref(u || '#'))}" ${/^https?:/.test(u || '') ? 'target="_blank" rel="noopener"' : ''}>${esc(l)}</a></li>`).join('')}</ul>` : ''}</div><div class="legal"><span>${esc(site.footer)}</span><span>Făcut cu Cadru</span></div></div></footer>`;
  }
  const renderBlocks = (blocks) => blocks.map(b => BLOCKS[b.type] ? BLOCKS[b.type].render(b) : '').join('');

  // =====================================================================
  // Templates & state
  // =====================================================================
  const mk = (type, over = {}) => Object.assign({ id: uid(), type }, structuredClone(BLOCKS[type].defaults), over);
  const pg = (title, blocks) => ({ id: uid(), title, blocks });
  const defaultSite = () => ({ name: 'Studioul meu', tagline: '', logo: '', preset: 'brut', paper: '#FFFFFF', ink: '#121212', accent: '#2B49FF', line: '2', shadow: '1', fontH: 'archivo', fontB: 'archivo', width: 'normal', navButton: '', navLink: '#contact', footer: '© 2026 Studioul meu. Toate drepturile rezervate.', footerLinks: '' });

  const TEMPLATES = {
    studio: {
      name: 'Studio', desc: 'Agenție sau freelancer', preset: 'brut',
      build: () => ({
        site: Object.assign(defaultSite(), { name: 'Atelier Nord', tagline: 'Studio de design și dezvoltare din Chișinău.', navButton: 'Cere ofertă', navLink: '#contact', footer: '© 2026 Atelier Nord. Toate drepturile rezervate.', footerLinks: 'Instagram|https://instagram.com\nLinkedIn|https://linkedin.com' }),
        pages: [
          pg('Acasă', [mk('hero'), mk('logos'), mk('features'), mk('stats'), mk('testimonials'), mk('cta')]),
          pg('Servicii', [mk('heading', { kicker: 'Servicii', text: 'Ce facem, concret', sub: 'Trei lucruri, făcute bine.', pad: 'm' }), mk('features', { kicker: '', title: '', style: 'numbered' }), mk('pricing'), mk('faq')]),
          pg('Proiecte', [mk('heading', { kicker: 'Portofoliu', text: 'Lucrări recente', pad: 'm' }), mk('gallery'), mk('quote')]),
          pg('Despre', [mk('textimage'), mk('team'), mk('list', { title: 'Cum lucrăm' })]),
          pg('Contact', [mk('contact')]),
        ],
      }),
    },
    restaurant: {
      name: 'Restaurant', desc: 'Local, cafenea, bar', preset: 'editorial',
      build: () => ({
        site: Object.assign(defaultSite(), PRESETS.editorial, { preset: 'editorial', name: 'Casa Maria', tagline: 'Bucătărie de casă, ingrediente de la producători locali.', navButton: 'Rezervă o masă', navLink: '#rezervari', footer: '© 2026 Casa Maria. Str. Veche 8, Chișinău.', footerLinks: 'Instagram|https://instagram.com\nFacebook|https://facebook.com' }),
        pages: [
          pg('Acasă', [
            mk('hero', { kicker: 'Restaurant · din 2009', title: 'Mâncare\ncum făcea bunica', subtitle: 'Rețete de familie, produse de sezon și un loc unde nimeni nu se grăbește.', button: 'Vezi meniul', link: '#meniu', button2: 'Rezervă', link2: '#rezervari', layout: 'cover', align: 'left' }),
            mk('features', { kicker: 'De ce Casa Maria', title: '', items: 'Ingrediente locale|Legume din grădinile din jurul orașului, carne de la fermieri pe care îi știm pe nume.\nMeniu de sezon|Se schimbă de patru ori pe an. Ce nu e în sezon, nu e în farfurie.\nFără grabă|Mesele sunt ale voastre toată seara. Nu vă grăbim.', style: 'plain' }),
            mk('quote', { text: 'Sarmalele de aici sunt singurele pe care le-aș pune lângă ale mamei.', author: 'Dorin V.', role: 'client fidel', bg: 'tint' }),
            mk('cta', { title: 'Rezervă o masă pentru diseară', text: 'Sunăm înapoi în câteva minute ca să confirmăm.', button: 'Rezervă acum', link: '#rezervari' }),
          ]),
          pg('Meniu', [
            mk('heading', { kicker: 'Meniu de toamnă', text: 'Ce gătim acum', pad: 'm' }),
            mk('list', { title: 'Aperitive', items: 'Zacuscă de casă cu pâine caldă — 45 lei\nPlăcinte cu brânză și verdeață — 55 lei\nSalată de vinete cu ceapă roșie — 48 lei', style: 'rules' }),
            mk('list', { title: 'Feluri principale', items: 'Sarmale în foi de viță cu mămăligă — 110 lei\nTochitură moldovenească — 135 lei\nPăstrăv la grătar cu legume — 150 lei', style: 'rules' }),
            mk('list', { title: 'Desert', items: 'Papanași cu dulceață de vișine — 65 lei\nPlăcintă cu mere și înghețată — 58 lei', style: 'rules' }),
          ]),
          pg('Galerie', [mk('gallery', { cols: '3' })]),
          pg('Rezervări', [mk('contact', { title: 'Rezervă o masă', text: 'Spune-ne câți sunteți și când veniți.', email: 'rezervari@casamaria.md', phone: '+373 22 000 000', address: 'Str. Veche 8, Chișinău', button: 'Trimite rezervarea' }), mk('embed', { url: '' })]),
        ],
      }),
    },
    portofoliu: {
      name: 'Portofoliu', desc: 'Fotograf, designer, artist', preset: 'noapte',
      build: () => ({
        site: Object.assign(defaultSite(), PRESETS.noapte, { preset: 'noapte', name: 'Ilie Radu', tagline: 'Fotograf documentar. Chișinău / București.', navButton: '', footer: '© 2026 Ilie Radu.', footerLinks: 'Instagram|https://instagram.com\nBehance|https://behance.net', width: 'wide' }),
        pages: [
          pg('Lucrări', [
            mk('hero', { kicker: 'Fotograf documentar', title: 'Oameni, locuri,\nlumină naturală', subtitle: 'Fotografiez ce se întâmplă, nu ce se pozează. Disponibil pentru proiecte editoriale și comerciale.', button: 'Vezi seriile', link: '#lucrari', button2: '', layout: 'text', pad: 'l' }),
            mk('gallery', { cols: '3' }),
            mk('stats', { items: '9 ani|de fotografie\n24|publicații\n6|expoziții', bg: 'none' }),
          ]),
          pg('Despre', [mk('textimage', { kicker: 'Despre', title: 'Cine sunt', text: 'Am început cu un aparat pe film împrumutat de la tata. Astăzi lucrez pentru reviste și ONG-uri, dar seriile personale sunt cele care mă țin în mișcare.\n\nLucrez încet, fără blitz, fără regie.', side: 'left' }), mk('logos', { title: 'Publicat în', items: 'Diez\nZiarul de Gardă\nDoR\nLibertatea\nScena9' })]),
          pg('Contact', [mk('contact', { title: 'Hai să vorbim', text: 'Pentru proiecte, expoziții sau printuri.', email: 'ilie@exemplu.md', phone: '', address: '', phoneField: '0', button: 'Trimite' })]),
        ],
      }),
    },
  };

  const STORE_KEY = 'cadru.site.v2';
  let state, history = [], selectedId = null, currentPage = 0, mobileView = false;

  function migrate(s) {
    s.site = Object.assign(defaultSite(), s.site || {});
    s.pages = (s.pages || []).map(p => ({ id: p.id || uid(), title: p.title || 'Pagină', blocks: (p.blocks || []).filter(b => BLOCKS[b.type]).map(b => Object.assign({ id: uid() }, structuredClone(BLOCKS[b.type].defaults), b)) }));
    if (!s.pages.length) s.pages.push(pg('Acasă', [mk('hero')]));
    return s;
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem('cadru.site.v1');
      if (raw) { const s = JSON.parse(raw); if (s && s.pages) return migrate(s); }
    } catch (e) { /* ignore */ }
    return null;
  }
  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    const st = $('#status'); st.textContent = 'Se salvează…'; st.classList.remove('warn');
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); st.textContent = 'Salvat local'; }
      catch (e) { st.textContent = 'Prea multe imagini pentru salvarea locală'; st.classList.add('warn'); }
    }, 250);
  }
  function snapshot() { history.push(JSON.stringify(state)); if (history.length > 60) history.shift(); $('#btn-undo').disabled = false; }
  function commit() { save(); render(); }
  function undo() {
    if (!history.length) return;
    state = JSON.parse(history.pop());
    $('#btn-undo').disabled = history.length === 0;
    if (currentPage >= state.pages.length) currentPage = state.pages.length - 1;
    if (!page().blocks.find(b => b.id === selectedId)) selectedId = null;
    save(); render(); toast('Anulat');
  }
  const page = () => state.pages[currentPage];
  const selected = () => page().blocks.find(b => b.id === selectedId) || null;

  let editTimer = null;
  function softSnapshot() { if (!editTimer) snapshot(); clearTimeout(editTimer); editTimer = setTimeout(() => { editTimer = null; }, 800); }

  // =====================================================================
  // Editor rendering
  // =====================================================================
  function render() { renderPages(); renderCanvas(); renderInspector(); $('#site-name').value = state.site.name; }

  function renderPages() {
    const list = $('#page-list'); list.innerHTML = '';
    state.pages.forEach((p, i) => {
      const el = document.createElement('div');
      el.className = 'page-item' + (i === currentPage ? ' active' : '');
      el.innerHTML = `<span class="dot"></span><span class="name">${esc(p.title)}</span><span class="count">${p.blocks.length}</span>`;
      el.onclick = () => { currentPage = i; selectedId = null; render(); $('#canvas-wrap').scrollTop = 0; };
      list.appendChild(el);
    });
  }

  let dragId = null;
  function renderCanvas() {
    const p = page(), s = state.site;
    ensureFonts([s.fontH, s.fontB]);
    $('#canvas-title').textContent = `${s.name} / ${p.title} · ${p.blocks.length} ${p.blocks.length === 1 ? 'bloc' : 'blocuri'}`;
    let styleEl = $('#site-style'); if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'site-style'; document.head.appendChild(styleEl); }
    styleEl.textContent = siteCSS(s);
    const c = $('#canvas'); c.classList.toggle('mobile', mobileView);
    c.innerHTML = `<div class="site lines-${s.line}">${renderNav(s, state.pages, currentPage, () => 'javascript:void(0)')}<div id="blocks"></div>${renderFooter(s, state.pages, () => 'javascript:void(0)')}</div>`;
    c.querySelectorAll('nav a, footer a').forEach((a) => { a.onclick = (e) => { e.preventDefault(); const idx = state.pages.findIndex(x => x.title === a.textContent.trim()); if (idx >= 0) { currentPage = idx; selectedId = null; render(); } }; });
    const host = $('#blocks');
    if (!p.blocks.length) { host.innerHTML = `<div class="canvas-empty"><b>Pagina e goală</b>Alege un bloc din stânga ca să începi.</div>`; fitCanvas(); return; }
    p.blocks.forEach((b, idx) => {
      const def = BLOCKS[b.type]; if (!def) return;
      const w = document.createElement('div');
      w.className = 'blk' + (b.id === selectedId ? ' selected' : ''); w.dataset.id = b.id; w.draggable = true;
      w.innerHTML = `<div class="blk-tools"><span class="tag">${esc(def.name)}</span>
        <button data-act="up" ${idx === 0 ? 'disabled' : ''} title="Mută sus">↑</button>
        <button data-act="down" ${idx === p.blocks.length - 1 ? 'disabled' : ''} title="Mută jos">↓</button>
        <button data-act="dup" title="Duplică">Dublează</button>
        <button data-act="del" title="Șterge">Șterge</button></div>` + def.render(b);
      w.onclick = (e) => {
        const act = e.target.closest('[data-act]');
        if (act) { e.stopPropagation(); doAction(act.dataset.act, b.id); return; }
        if (e.target.closest('a, button, summary')) { if (!e.target.closest('summary')) e.preventDefault(); }
        if (selectedId !== b.id) { selectedId = b.id; renderCanvas(); renderInspector(); }
      };
      w.addEventListener('submit', e => { e.preventDefault(); toast('În site-ul publicat, formularul trimite mesajul'); });
      w.ondragstart = (e) => { dragId = b.id; w.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', b.id); };
      w.ondragend = () => { dragId = null; clearDrop(); };
      w.ondragover = (e) => { if (!dragId || dragId === b.id) return; e.preventDefault(); const r = w.getBoundingClientRect(); const after = e.clientY > r.top + r.height / 2; clearDrop(); w.classList.add(after ? 'drop-after' : 'drop-before'); };
      w.ondrop = (e) => { e.preventDefault(); if (!dragId || dragId === b.id) return; const r = w.getBoundingClientRect(); moveBlock(dragId, b.id, e.clientY > r.top + r.height / 2); };
      host.appendChild(w);
    });
    fitCanvas();
  }
  function fitCanvas() {
    const wrap = $('#canvas-wrap'), c = $('#canvas'); if (!wrap || !c) return;
    if (mobileView) { c.style.width = ''; c.style.zoom = ''; return; }
    const W = 1100, avail = wrap.clientWidth - 66;
    if (avail < W && avail > 320) { c.style.width = W + 'px'; c.style.zoom = String(avail / W); } else { c.style.width = ''; c.style.zoom = ''; }
  }
  window.addEventListener('resize', fitCanvas);
  function clearDrop() { document.querySelectorAll('.blk.drop-before,.blk.drop-after').forEach(el => el.classList.remove('drop-before', 'drop-after')); }
  function moveBlock(id, targetId, after) {
    const bl = page().blocks; const from = bl.findIndex(b => b.id === id); if (from < 0) return;
    snapshot(); const [item] = bl.splice(from, 1);
    let to = bl.findIndex(b => b.id === targetId); if (after) to += 1;
    bl.splice(to, 0, item); selectedId = id; commit();
  }
  function doAction(act, id) {
    const bl = page().blocks; const i = bl.findIndex(b => b.id === id); if (i < 0) return;
    snapshot();
    if (act === 'up' && i > 0) [bl[i - 1], bl[i]] = [bl[i], bl[i - 1]];
    else if (act === 'down' && i < bl.length - 1) [bl[i + 1], bl[i]] = [bl[i], bl[i + 1]];
    else if (act === 'dup') { const copy = structuredClone(bl[i]); copy.id = uid(); bl.splice(i + 1, 0, copy); selectedId = copy.id; }
    else if (act === 'del') { bl.splice(i, 1); selectedId = null; toast('Bloc șters'); }
    commit();
  }
  function addBlock(type) {
    snapshot();
    const bl = page().blocks; const b = mk(type);
    const i = bl.findIndex(x => x.id === selectedId);
    if (i >= 0) bl.splice(i + 1, 0, b); else bl.push(b);
    selectedId = b.id; commit();
    const el = document.querySelector(`.blk[data-id="${b.id}"]`); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  // ---------- Images ----------
  function readImage(file, cb) {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file); const im = new Image();
    im.onload = () => {
      const max = 1600; let w = im.width, h = im.height; if (w > max) { h = Math.round(h * max / w); w = max; }
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
      const png = file.type === 'image/png' || file.type === 'image/svg+xml';
      cb(c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.85)); URL.revokeObjectURL(url);
    };
    im.src = url;
  }

  // ---------- Inspector fields ----------
  function field(f, value, onChange) {
    const wrap = document.createElement('div'); wrap.className = 'field';
    const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = f.label; wrap.appendChild(lab);
    const hint = () => { if (f.hint) { const h = document.createElement('span'); h.className = 'hint'; h.textContent = f.hint; wrap.appendChild(h); } };
    if (f.kind === 'textarea' || f.kind === 'lines') {
      const t = document.createElement('textarea'); t.value = value ?? ''; if (f.kind === 'lines') t.className = 'lines'; if (f.short) t.style.minHeight = '56px'; t.oninput = () => onChange(t.value); wrap.appendChild(t); hint();
    } else if (f.kind === 'seg') {
      const s = document.createElement('div'); s.className = 'seg';
      f.options.forEach(([v, l]) => { const b = document.createElement('button'); b.textContent = l; b.className = value === v ? 'on' : ''; b.onclick = () => { onChange(v); s.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }; s.appendChild(b); });
      wrap.appendChild(s); hint();
    } else if (f.kind === 'select') {
      const s = document.createElement('select'); f.options.forEach(([v, l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; o.selected = v === value; s.appendChild(o); }); s.onchange = () => onChange(s.value); wrap.appendChild(s); hint();
    } else if (f.kind === 'image') {
      const prev = document.createElement('img'); prev.className = 'img-preview'; prev.alt = ''; prev.hidden = !safeSrc(value); if (!prev.hidden) prev.src = safeSrc(value); wrap.appendChild(prev);
      const row = document.createElement('div'); row.className = 'row';
      const i = document.createElement('input'); i.type = 'text'; i.placeholder = 'https://… sau încarcă'; i.value = (value || '').startsWith('data:') ? '' : (value || '');
      i.oninput = () => { onChange(i.value); const s = safeSrc(i.value); prev.hidden = !s; if (s) prev.src = s; };
      const fb = document.createElement('label'); fb.className = 'btn small file-btn'; fb.textContent = 'Încarcă';
      const fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*';
      fi.onchange = () => readImage(fi.files[0], d => { onChange(d); i.value = ''; prev.hidden = false; prev.src = d; toast('Imagine adăugată'); });
      fb.appendChild(fi); row.append(i, fb); wrap.appendChild(row);
      if (safeSrc(value)) { const rm = document.createElement('button'); rm.className = 'btn small ghost'; rm.textContent = 'Elimină imaginea'; rm.onclick = () => { onChange(''); i.value = ''; prev.hidden = true; rm.remove(); }; wrap.appendChild(rm); }
      hint();
    } else if (f.kind === 'images') {
      const t = document.createElement('textarea'); t.className = 'lines'; t.value = lines(value).filter(l => !l.startsWith('data:')).join('\n'); t.placeholder = 'https://…';
      const dataUrls = () => lines(value).filter(l => l.startsWith('data:'));
      let uploaded = dataUrls();
      const compose = () => [...lines(t.value), ...uploaded].join('\n');
      t.oninput = () => onChange(compose());
      wrap.appendChild(t);
      const info = document.createElement('span'); info.className = 'hint'; const upd = () => { info.textContent = uploaded.length ? `${uploaded.length} imagini încărcate de pe calculator` : ''; }; upd();
      const row = document.createElement('div'); row.className = 'row';
      const fb = document.createElement('label'); fb.className = 'btn small file-btn'; fb.textContent = 'Încarcă imagini';
      const fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.multiple = true;
      fi.onchange = () => { [...fi.files].forEach(file => readImage(file, d => { uploaded.push(d); onChange(compose()); upd(); })); toast('Imagini adăugate'); };
      fb.appendChild(fi);
      const clr = document.createElement('button'); clr.className = 'btn small ghost'; clr.textContent = 'Șterge încărcate'; clr.onclick = () => { uploaded = []; onChange(compose()); upd(); };
      row.append(fb, clr); wrap.append(row, info); hint();
    } else if (f.kind === 'color') {
      const cr = document.createElement('div'); cr.className = 'color-row';
      const ci = document.createElement('input'); ci.type = 'color'; ci.value = /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';
      const ct = document.createElement('input'); ct.type = 'text'; ct.value = value || '';
      ci.oninput = () => { ct.value = ci.value.toUpperCase(); onChange(ci.value.toUpperCase()); };
      ct.oninput = () => { if (/^#[0-9a-f]{6}$/i.test(ct.value)) { ci.value = ct.value; onChange(ct.value.toUpperCase()); } };
      cr.append(ci, ct); wrap.appendChild(cr); hint();
    } else {
      const i = document.createElement('input'); i.type = 'text'; i.value = value ?? ''; i.oninput = () => onChange(i.value); wrap.appendChild(i); hint();
    }
    return wrap;
  }
  function section(title, extra) {
    const s = document.createElement('div'); s.className = 'section';
    const h = document.createElement('div'); h.className = 'section-head'; h.innerHTML = `<span class="label">${esc(title)}</span>`; if (extra) h.appendChild(extra); s.appendChild(h);
    return s;
  }
  function editBlock(b, key, v) { softSnapshot(); b[key] = v; save(); renderCanvas(); }
  function editSite(key, v) { softSnapshot(); state.site[key] = v; save(); renderCanvas(); if (key === 'name') $('#site-name').value = v; }

  function renderInspector() {
    const ins = $('#inspector'); ins.innerHTML = '';
    const b = selected();
    if (b) {
      const def = BLOCKS[b.type];
      const s = section('Bloc: ' + def.name);
      if (!def.fields.length && def.noCommon) { const p = document.createElement('p'); p.className = 'inspector-empty'; p.textContent = 'Acest bloc nu are setări.'; s.appendChild(p); }
      def.fields.forEach(f => s.appendChild(field(f, b[f.key], v => editBlock(b, f.key, v))));
      if (!def.noCommon) {
        const d = document.createElement('details'); d.className = 'adv'; d.open = def.fields.length < 3; d.innerHTML = `<summary>Fundal și spațiere</summary>`;
        const body = document.createElement('div'); body.className = 'body';
        COMMON.forEach(f => body.appendChild(field(f, b[f.key], v => editBlock(b, f.key, v))));
        d.appendChild(body); s.appendChild(d);
      }
      ins.appendChild(s);
      const a = section('Acțiuni');
      const row = document.createElement('div'); row.className = 'actions-row';
      row.innerHTML = `<button class="btn small" data-act="up">↑ Sus</button><button class="btn small" data-act="down">↓ Jos</button><button class="btn small" data-act="dup">Dublează</button><button class="btn small danger" data-act="del">Șterge</button>`;
      row.querySelectorAll('button').forEach(x => x.onclick = () => doAction(x.dataset.act, b.id));
      a.appendChild(row);
      const hint = document.createElement('p'); hint.className = 'inspector-empty'; hint.style.marginTop = '12px';
      hint.innerHTML = `Trage blocul în canvas ca să-l reordonezi. <span class="kbd">Delete</span> îl șterge, <span class="kbd">Esc</span> deselectează.`;
      a.appendChild(hint); ins.appendChild(a);
      return;
    }

    // ---- Page ----
    const p = page();
    const del = document.createElement('button'); del.className = 'btn small danger'; del.textContent = 'Șterge pagina'; del.disabled = state.pages.length <= 1;
    del.onclick = () => { if (!confirm(`Ștergi pagina „${p.title}” cu tot conținutul ei?`)) return; snapshot(); state.pages.splice(currentPage, 1); currentPage = Math.max(0, currentPage - 1); selectedId = null; commit(); toast('Pagină ștearsă'); };
    const ps = section('Pagina', del);
    ps.appendChild(field({ key: 'title', label: 'Nume pagină', kind: 'text', hint: 'Apare în meniu. Adresa: #' + slugify(p.title) }, p.title, v => { softSnapshot(); p.title = v || 'Pagină'; save(); renderPages(); renderCanvas(); ps.querySelector('.hint').textContent = 'Apare în meniu. Adresa: #' + slugify(p.title); }));
    const mv = document.createElement('div'); mv.className = 'actions-row';
    mv.innerHTML = `<button class="btn small" ${currentPage === 0 ? 'disabled' : ''}>← Mută înainte</button><button class="btn small" ${currentPage === state.pages.length - 1 ? 'disabled' : ''}>Mută după →</button>`;
    const [l, r] = mv.querySelectorAll('button');
    l.onclick = () => { snapshot(); const a = state.pages; [a[currentPage - 1], a[currentPage]] = [a[currentPage], a[currentPage - 1]]; currentPage--; commit(); };
    r.onclick = () => { snapshot(); const a = state.pages; [a[currentPage + 1], a[currentPage]] = [a[currentPage], a[currentPage + 1]]; currentPage++; commit(); };
    ps.appendChild(mv); ins.appendChild(ps);

    // ---- Theme ----
    const th = section('Aspect');
    const pr = document.createElement('div'); pr.className = 'presets';
    Object.entries(PRESETS).forEach(([id, t]) => {
      const b2 = document.createElement('button'); b2.className = 'preset';
      b2.innerHTML = `<span class="chip"><i style="background:${t.paper}"></i><i style="background:${t.ink}"></i><i style="background:${t.accent}"></i></span><span>${t.name}</span>`;
      b2.title = `${FONTS[t.fontH].name} + ${FONTS[t.fontB].name}`;
      b2.onclick = () => { snapshot(); Object.assign(state.site, { preset: id, paper: t.paper, ink: t.ink, accent: t.accent, line: t.line, shadow: t.shadow, fontH: t.fontH, fontB: t.fontB }); commit(); toast('Temă aplicată: ' + t.name); };
      pr.appendChild(b2);
    });
    const pl = document.createElement('span'); pl.className = 'sub-label'; pl.style.marginTop = '0'; pl.textContent = 'Teme rapide';
    th.append(pl, pr);
    const cl = document.createElement('span'); cl.className = 'sub-label'; cl.textContent = 'Culori'; th.appendChild(cl);
    const cf = document.createElement('div'); cf.className = 'field'; cf.innerHTML = `<span class="label">Accent</span>`;
    const sw = document.createElement('div'); sw.className = 'swatches';
    ACCENTS.forEach(c => { const d = document.createElement('button'); d.className = 'sw' + (state.site.accent.toLowerCase() === c.toLowerCase() ? ' on' : ''); d.style.background = c; d.title = c; d.setAttribute('aria-label', 'Accent ' + c); d.onclick = () => { editSite('accent', c); renderInspector(); }; sw.appendChild(d); });
    cf.appendChild(sw); th.appendChild(cf);
    th.appendChild(field({ key: 'accent', label: 'Accent personalizat', kind: 'color' }, state.site.accent, v => { editSite('accent', v); sw.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x.title.toLowerCase() === v.toLowerCase())); }));
    th.appendChild(field({ key: 'paper', label: 'Fundal', kind: 'color' }, state.site.paper, v => editSite('paper', v)));
    th.appendChild(field({ key: 'ink', label: 'Text', kind: 'color' }, state.site.ink, v => editSite('ink', v)));
    const fl = document.createElement('span'); fl.className = 'sub-label'; fl.textContent = 'Fonturi'; th.appendChild(fl);
    const fontOpts = Object.entries(FONTS).map(([k, f]) => [k, f.name]);
    th.appendChild(field({ key: 'fontH', label: 'Titluri', kind: 'select', options: fontOpts }, state.site.fontH, v => editSite('fontH', v)));
    th.appendChild(field({ key: 'fontB', label: 'Text', kind: 'select', options: fontOpts }, state.site.fontB, v => editSite('fontB', v)));
    const sl = document.createElement('span'); sl.className = 'sub-label'; sl.textContent = 'Formă'; th.appendChild(sl);
    th.appendChild(field({ key: 'line', label: 'Contururi', kind: 'seg', options: [['2', 'Groase'], ['1', 'Subțiri'], ['0', 'Fără']] }, state.site.line, v => editSite('line', v)));
    th.appendChild(field({ key: 'shadow', label: 'Umbre dure', kind: 'seg', options: [['1', 'Da'], ['0', 'Nu']] }, state.site.shadow, v => editSite('shadow', v)));
    th.appendChild(field({ key: 'width', label: 'Lățime conținut', kind: 'seg', options: [['narrow', 'Îngust'], ['normal', 'Normal'], ['wide', 'Lat']] }, state.site.width, v => editSite('width', v)));
    ins.appendChild(th);

    // ---- Site ----
    const ss = section('Site');
    ss.appendChild(field({ key: 'name', label: 'Nume site', kind: 'text' }, state.site.name, v => editSite('name', v)));
    ss.appendChild(field({ key: 'tagline', label: 'Descriere scurtă', kind: 'text', hint: 'Apare în subsol.' }, state.site.tagline, v => editSite('tagline', v)));
    ss.appendChild(field({ key: 'logo', label: 'Logo (opțional)', kind: 'image', hint: 'Înlocuiește numele din meniu.' }, state.site.logo, v => editSite('logo', v)));
    ss.appendChild(field({ key: 'navButton', label: 'Buton în meniu', kind: 'text', hint: 'Lasă gol ca să nu apară.' }, state.site.navButton, v => editSite('navButton', v)));
    ss.appendChild(field({ key: 'navLink', label: 'Link buton meniu', kind: 'text' }, state.site.navLink, v => editSite('navLink', v)));
    ss.appendChild(field({ key: 'footer', label: 'Text subsol', kind: 'text' }, state.site.footer, v => editSite('footer', v)));
    ss.appendChild(field({ key: 'footerLinks', label: 'Linkuri subsol', kind: 'lines', hint: 'Un rând: Etichetă | URL (Instagram, Facebook…)' }, state.site.footerLinks, v => editSite('footerLinks', v)));
    ins.appendChild(ss);

    // ---- Data ----
    const dt = section('Date');
    const row = document.createElement('div'); row.className = 'actions-row';
    const tb = document.createElement('button'); tb.className = 'btn small'; tb.textContent = 'Pornește de la un șablon'; tb.onclick = () => openTemplates(false);
    const rb = document.createElement('button'); rb.className = 'btn small danger'; rb.textContent = 'Golește tot';
    rb.onclick = () => { if (!confirm('Ștergi tot site-ul? Nu se poate anula.')) return; history = []; $('#btn-undo').disabled = true; state = migrate({ site: defaultSite(), pages: [pg('Acasă', [])] }); currentPage = 0; selectedId = null; commit(); toast('Site gol'); };
    row.append(tb, rb); dt.appendChild(row);
    const note = document.createElement('p'); note.className = 'inspector-empty'; note.style.marginTop = '10px'; note.textContent = 'Totul se salvează automat în acest browser. Exportă HTML-ul ca să publici sau să faci o copie.';
    dt.appendChild(note); ins.appendChild(dt);
  }

  // ---------- Palette ----------
  function renderPalette() {
    const pal = $('#palette'); pal.innerHTML = '';
    GROUPS.forEach(g => {
      const wrap = document.createElement('div'); wrap.className = 'palette-group';
      wrap.innerHTML = `<span class="label">${esc(g)}</span>`;
      const grid = document.createElement('div'); grid.className = 'palette';
      Object.entries(BLOCKS).filter(([, d]) => d.group === g).forEach(([t, d]) => { const b = document.createElement('button'); b.className = 'pal'; b.innerHTML = d.icon + `<span>${esc(d.name)}</span>`; b.title = 'Adaugă ' + d.name; b.onclick = () => addBlock(t); grid.appendChild(b); });
      wrap.appendChild(grid); pal.appendChild(wrap);
    });
    const note = document.createElement('p'); note.className = 'inspector-empty'; note.style.margin = '4px 0 0'; note.textContent = 'Blocul apare sub cel selectat sau la finalul paginii.'; pal.appendChild(note);
  }

  // ---------- Templates ----------
  function openTemplates(firstRun) {
    const grid = $('#tpl-grid'); grid.innerHTML = '';
    Object.entries(TEMPLATES).forEach(([id, t]) => {
      const pr = PRESETS[t.preset];
      const b = document.createElement('button'); b.className = 'tpl';
      b.innerHTML = `<div class="art" style="background:${pr.paper};color:${pr.ink}"><div class="bar"></div><div class="hero"><i></i><i></i><b style="background:${pr.accent}"></b></div></div><div class="meta"><strong>${esc(t.name)}</strong><small>${esc(t.desc)}</small></div>`;
      b.onclick = () => { if (!firstRun && !confirm('Înlocuiești site-ul curent cu acest șablon?')) return; snapshot(); state = migrate(t.build()); currentPage = 0; selectedId = null; commit(); $('#tpl-modal').classList.remove('open'); toast('Șablon aplicat: ' + t.name); };
      grid.appendChild(b);
    });
    const blank = document.createElement('button'); blank.className = 'tpl';
    blank.innerHTML = `<div class="art" style="background:#fff;color:#121212"><div class="bar"></div><div class="hero"></div></div><div class="meta"><strong>Gol</strong><small>Pornește de la zero</small></div>`;
    blank.onclick = () => { if (!firstRun && !confirm('Înlocuiești site-ul curent cu unul gol?')) return; snapshot(); state = migrate({ site: defaultSite(), pages: [pg('Acasă', [mk('hero')])] }); currentPage = 0; selectedId = null; commit(); $('#tpl-modal').classList.remove('open'); };
    grid.appendChild(blank);
    $('#tpl-cancel').hidden = firstRun;
    $('#tpl-modal').classList.add('open');
  }

  // ---------- Export / preview ----------
  function buildSiteHTML(startPage = 0) {
    const site = state.site;
    const slugs = state.pages.map(p => slugify(p.title));
    const pagesHTML = state.pages.map((p, i) => `<div class="page" id="${slugs[i]}" ${i === 0 ? '' : 'hidden'}>${renderNav(site, state.pages, i, j => '#' + slugs[j])}<main>${renderBlocks(p.blocks)}</main>${renderFooter(site, state.pages, j => '#' + slugs[j])}</div>`).join('\n');
    return `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(site.name)}</title>
<meta name="description" content="${esc(site.tagline || site.name)}">
${fontLinkFor([site.fontH, site.fontB])}
<style>
html,body{margin:0;padding:0}
${siteCSS(site).trim()}
.page[hidden]{display:none}
</style>
</head>
<body class="site lines-${site.line}">
${pagesHTML}
<script>
(function(){
  var ids=${JSON.stringify(slugs)};
  function show(){
    var h=location.hash.replace('#','');
    var id=ids.indexOf(h)>=0?h:ids[0];
    var isPage=ids.indexOf(h)>=0||!h;
    ids.forEach(function(i){var el=document.getElementById(i);if(el){el.hidden=i!==id;}});
    if(isPage){window.scrollTo(0,0);}
  }
  window.addEventListener('hashchange',show);
  ${startPage ? `if(!location.hash){location.hash='#${slugs[startPage]}';}` : ''}
  show();
})();
<\/script>
</body>
</html>`;
  }
  function openPreview() {
    $('#preview-frame').srcdoc = buildSiteHTML(currentPage);
    $('#preview-url').textContent = slugify(state.site.name) + '.md/#' + slugify(page().title);
    $('#preview-overlay').classList.add('open');
  }
  function openExport() { $('#export-code').value = buildSiteHTML(0); $('#export-overlay').classList.add('open'); }

  let toastTimer;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800); }

  // =====================================================================
  // Boot
  // =====================================================================
  const loaded = load();
  state = loaded || migrate(TEMPLATES.studio.build());
  renderPalette(); render();
  $('#btn-undo').disabled = true;
  if (!loaded) openTemplates(true);

  $('#site-name').oninput = (e) => editSite('name', e.target.value);
  $('#btn-add-page').onclick = () => { snapshot(); const n = state.pages.length + 1; state.pages.push(pg('Pagină ' + n, [mk('heading', { text: 'Pagină nouă', pad: 'l' }), mk('text')])); currentPage = state.pages.length - 1; selectedId = null; commit(); const f = $('#inspector input'); if (f) { f.focus(); f.select(); } };
  $('#btn-undo').onclick = undo;
  $('#btn-preview').onclick = openPreview;
  $('#btn-close-preview').onclick = () => $('#preview-overlay').classList.remove('open');
  $('#btn-export').onclick = openExport;
  $('#btn-close-export').onclick = () => $('#export-overlay').classList.remove('open');
  $('#tpl-cancel').onclick = () => $('#tpl-modal').classList.remove('open');
  $('#tpl-modal').onclick = (e) => { if (e.target.id === 'tpl-modal' && !$('#tpl-cancel').hidden) $('#tpl-modal').classList.remove('open'); };
  $('#btn-copy').onclick = async () => {
    const ta = $('#export-code');
    try { await navigator.clipboard.writeText(ta.value); toast('Cod copiat'); }
    catch (e) { ta.focus(); ta.select(); try { document.execCommand('copy'); toast('Cod copiat'); } catch (e2) { toast('Selectează și copiază manual'); } }
  };
  $('#btn-download').onclick = () => {
    const blob = new Blob([$('#export-code').value], { type: 'text/html' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'index.html'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Descărcare pornită');
  };
  const setView = (m) => { mobileView = m; $('#view-desktop').classList.toggle('on', !m); $('#view-mobile').classList.toggle('on', m); renderCanvas(); };
  $('#view-desktop').onclick = () => setView(false);
  $('#view-mobile').onclick = () => setView(true);
  const setPv = (m) => { $('#preview-body').classList.toggle('mobile', m); $('#pv-desktop').classList.toggle('on', !m); $('#pv-mobile').classList.toggle('on', m); };
  $('#pv-desktop').onclick = () => setPv(false);
  $('#pv-mobile').onclick = () => setPv(true);
  $('#canvas-wrap').addEventListener('click', (e) => { if (e.target === e.currentTarget || e.target.id === 'canvas' || e.target.closest('.canvas-head .label')) { selectedId = null; renderCanvas(); renderInspector(); } });

  document.addEventListener('keydown', (e) => {
    const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !inField) { e.preventDefault(); undo(); return; }
    if (e.key === 'Escape') {
      if ($('#tpl-modal').classList.contains('open') && !$('#tpl-cancel').hidden) { $('#tpl-modal').classList.remove('open'); return; }
      if ($('#preview-overlay').classList.contains('open')) { $('#preview-overlay').classList.remove('open'); return; }
      if ($('#export-overlay').classList.contains('open')) { $('#export-overlay').classList.remove('open'); return; }
      if (selectedId) { selectedId = null; renderCanvas(); renderInspector(); }
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !inField && selectedId) { e.preventDefault(); doAction('del', selectedId); }
  });
})();
