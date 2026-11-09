  /*help text random */

  const helpText = [
    "Izvēlieties vēlamo atbildi atbildes lodziņā, kas atrodas ekrāna apakšā.",
    "Rūpīgi izvēlieties atbildes - jūsu lēmumi var ietekmēt spēles iznākumu",
    "Jūs varat atgriezties pie iepriekšējām sarunām, lai labāk izprastu situāciju.",
    "Katrā situācijā var būt vairāk nekā viena pareizā pieeja - eksperimentējiet!",
    "Dažreiz arī klusēšana ir atbilde, bet vai tā ir pareizā atbilde?",
    "Spēle simulē reālu komunikāciju - padomājiet, kā jūs reaģētu reālā situācijā",
    "Ja neesat pārliecināts par atbildi, mēģiniet iztēloties, kā reaģētu jūsu varonis."
  ];

  const helpTextRandom = Math.floor(Math.random() * helpText.length);

  document.getElementById("help").textContent = helpText[helpTextRandom];

  /* info panel toggle */

  function toggleInfo() {
      const panel = document.getElementById("infoPanel");
    
      if (panel.classList.contains("open")) {
        panel.classList.remove("open");
        panel.classList.add("closing");
      } else {
        panel.classList.remove("closing");
        panel.classList.add("open");
      }
    }

  /* image resize */

  const overlay = document.getElementById("imageOverlay");
  const overlayImg = overlay.querySelector("img");

    document.addEventListener("click", e => {
        if (e.target.closest(".message img")) {
            overlayImg.src = e.target.src;
            overlay.style.display = "flex";
        } else if (e.target === overlay) {
            overlay.style.display = "none";
            overlayImg.src = "";
        }
    });