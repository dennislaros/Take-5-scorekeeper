/* Spelmodule: Take 5. Voeg toekomstige spellen toe als aparte modules met dezelfde structuur. */
window.GameModules = window.GameModules || {};
window.GameModules.take5 = {
  id: "take5",
  name: "Take 5",
  tagline: "Het kaartspel waarbij je zo min mogelijk koeienkoppen verzamelt.",
  shortDescription: "Houd je strafpunten laag en blijf als laatste over.",
  icon: "5",
  available: true,
  defaultLimit: 66,
  rules: [
    "Iedere speler krijgt kaarten en speelt elke ronde één kaart tegelijk.",
    "Kaarten worden op volgorde aangelegd bij de rij met het dichtstbijzijnde lagere kaartnummer.",
    "De zesde kaart in een rij betekent dat je de vijf kaarten ervoor moet pakken.",
    "De koeienkoppen op die kaarten tellen als strafpunten.",
    "In afvalmodus lig je eruit zodra je de ingestelde puntenlimiet bereikt. De laatste speler wint."
  ],
  rulesNote: "Je kunt ook Winmodus kiezen: de eerste speler die de limiet bereikt, wint direct.",
  modes: [
    { value: "out", label: "Afvalmodus" },
    { value: "win", label: "Winmodus" }
  ],
  calculateTotal(player, rounds) {
    return rounds.reduce((sum, round) => sum + (Number(round.scores?.[player.id]) || 0), 0);
  },
  status(player, total, game) {
    if (game.mode === "win" && total >= game.limit) return "winner";
    if (game.mode === "out" && total >= game.limit) return "out";
    return "active";
  },
  winner(players, rounds, game) {
    const totals = players.map(player => ({
      player,
      total: this.calculateTotal(player, rounds)
    }));
    if (game.mode === "win") {
      return totals.find(item => item.total >= game.limit) || null;
    }
    const active = totals.filter(item => item.total < game.limit);
    return active.length === 1 ? active[0] : null;
  }
};