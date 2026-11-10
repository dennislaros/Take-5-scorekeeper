TAKE 5 SCOREKEEPER — INSTALLEREN VANAF JE IPHONE

Wat zit erin?
- index.html: de scoreapp
- manifest.webmanifest: naam en beginscherminstellingen
- sw.js: offline cache
- icon.svg: app-icoon

BELANGRIJK
De websitecode wordt publiek gepubliceerd via GitHub Pages. Zet geen privégegevens in de code.
De spelersnamen en scores worden alleen lokaal in de browser van het apparaat opgeslagen.
Deze eerste versie synchroniseert niet tussen apparaten.

SNELLE PUBLICATIE MET GITHUB PAGES
1. Open Safari en ga naar https://github.com/join (maak gratis een account als je er nog geen hebt).
2. Maak een nieuwe repository met de naam take5-scorekeeper.
3. Kies Public en maak de repository aan.
4. Kies Add file > Upload files.
5. Pak deze ZIP uit in de Bestanden-app. Upload de vier bestanden uit de map (niet de map zelf).
6. Kies Commit changes.
7. Ga in de repository naar Settings > Pages.
8. Bij Build and deployment kies je Deploy from a branch.
9. Kies branch main en folder /(root), en druk Save.
10. Wacht tot GitHub de website publiceert. De URL wordt:
    https://JOUWGITHUBNAAM.github.io/take5-scorekeeper/
11. Open die URL in Safari op je iPhone. Wacht tot de pagina volledig geladen is.
12. Tik op Deel (vierkant met pijl omhoog) > Zet op beginscherm > Voeg toe.
13. Open Take 5 voortaan via het nieuwe beginschermicoon.
14. Test een keer: open de app online, zet daarna vliegtuigmodus aan en open de app opnieuw.

QR-CODE
Maak pas na publicatie een QR-code van de volledige GitHub Pages-URL. Die QR-code opent de app, maar voor offline gebruik moet de app eerst minstens één keer online geladen zijn en aan het beginscherm zijn toegevoegd.

DATA
- Scores staan lokaal op dit apparaat.
- Gebruik Exporteer back-up om een JSON-back-up te bewaren.
- Als je Safari-websitegegevens wist of de app verwijdert, kun je lokale scores kwijtraken. Bewaar daarom af en toe een back-up.

SPELREGELS IN DEZE EERSTE VERSIE
- Strafpunten per speler per ronde handmatig invoeren.
- Afvalmodus: speler is af bij totaal >= limiet.
- Winmodus: speler wint bij totaal >= limiet.
- Scorehistorie en scorecorrecties.
