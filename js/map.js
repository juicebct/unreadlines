/* map - leaflet */

const bounds = L.latLngBounds(
  [56.3, 27.0],
  [56.7, 27.6]
);

const map = L.map('map', {
  maxBounds: bounds,
  maxBoundsViscosity: 1.0
}).setView([56.5078, 27.3346], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const landmarks = [
  {
    name: "Ančupānu skatu tornis",
    description: "Ceļš uz turieni bija kluss. Tik kluss, ka sāki dzirdēt pats savas domas. No torņa skats bija plašāks nekā jebkad. Varbūt tāpēc mēs tur aizgājām. Ne tikai meklēt dabu, bet arī saprast - ko katrs no mums redz, kad paskatās tālāk.",
    coords: [56.53855238449452, 27.31524286147357],
    image: "images/ancupani.svg",
    linkwiki: "https://lv.wikipedia.org/wiki/Ančupānu_kalni",
    linksite: "https://skolenuekskursijas.lv/apskates-vieta/ancupanu-skatu-tornis/",
  },
  {
    name: "Olimpiskais centrs Rēzekne",
    description: "Ledus vienmēr šķita pārāk slidens, bet tur bija silti - ne pēc temperatūras, bet pēc sajūtas. Reiz kritām visi reizē, un tas bija smieklīgāk nekā sāpīgi. Neviens neteica, ka jābūt labākajam.",
    coords: [56.513980438427154, 27.352523305127935],
    image: "images/olimp.svg",
    linkwiki: "https://lv.wikipedia.org/wiki/Olimpiskais_centrs_Rēzekne",
    linksite: "https://ocr.lv",
  },
  {
    name: "Latgales vēstniecība 'GORS'",
    description: "Šeit es biežāk skatījos no malas. Sēdēju pēdējās rindās un vēroju, kā citi runā, dzied, dejo. Reizēm gribējās piecelties, reizēm - vienkārši pazust. Bet bija labi - būt starp cilvēkiem un nedomāt, ko teikt.",
    coords: [56.50306329935126, 27.32557228162562],
    image: "images/gors.svg",
    linkwiki: "https://lv.wikipedia.org/wiki/Latgales_vēstniecība_%22Gors%22",
    linksite: "http://www.latgalesgors.lv",
  },
  {
    name: "Rēzeknes 2. vidusskola",
    description: "Šī ēka sākumā šķita auksta un sveša. Pārāk skaļi zvani, pārāk balti griesti. Bet tieši šeit notika viss - pirmās kļūdas, pirmie smiekli, pirmie vārdi, kas palika atmiņā. Un es… es lēnām kļuvu par daļu no šīs vietas.",
    coords: [56.50699604397554, 27.3336142172098],
    image: "images/skola.svg",
    linkwiki: "https://lv.wikipedia.org/wiki/Rēzeknes_2._vidusskola"
  },
  {
    name: "Zeimuļs",
    description: "Šeit viss bija citādāk. Mazāk noteikumu, vairāk krāsu. Katrs stūris smaržoja pēc kaut kā cita - krāsām, koka, plastilīna vai mūzikas. Dažiem tā bija otrā māja, citi tikai nāca paskatīties. Bet vienmēr kāds radīja kaut ko savu.",
    coords: [56.50276856950499, 27.333251768746095],
    image: "images/zeimulis.svg",
    linkwiki: "https://lv.wikipedia.org/wiki/Zeimuļs",
  }
];

landmarks.forEach(place => {
  let links = `<a href="${place.linkwiki}" target="_blank" rel="noreferrer">Vikipēdija</a>`;
  if (place.linksite) {
    links += ` / <a href="${place.linksite}" target="_blank" rel="noreferrer">Mājaslapa</a>`;
  }

  const popupContent = `
    <strong>${place.name}</strong><br><br>
    <img src="${place.image}" alt="${place.name}" width="275"><br>
    <p>${place.description}</p>
    ${links}
  `;
  L.marker(place.coords).addTo(map).bindPopup(popupContent);
});
