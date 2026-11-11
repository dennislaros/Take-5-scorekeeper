window.GameModules = window.GameModules || {};
window.GameModules.toepen = {
  id:"toepen", name:"Toepen", icon:"♠", available:true, defaultLimit:15,
  tagline:"Win de laatste slag. Blijf onder de 15 strafpunten.",
  shortDescription:"Klop, pas of toep door en houd je strafpunten laag.",
  rules:[
    "Gebruik een gewone stok zonder jokers. Haal de kaarten 2 t/m 6 eruit: je speelt met 32 kaarten (7 t/m aas).",
    "Iedere speler krijgt 4 kaarten. Hoog naar laag: 10, 9, 8, 7, aas, heer, vrouw, boer.",
    "De eerste speler komt uit. Je moet kleur bekennen als je die kleur hebt. Heb je die niet, dan mag je een andere kaart spelen; daarmee kun je de slag niet winnen.",
    "De winnaar van een slag komt uit bij de volgende slag. De vierde en laatste slag bepaalt wie de ronde wint.",
    "Zonder toep krijgt iedere speler die de laatste slag niet wint 1 strafpunt. De winnaar krijgt geen strafpunten.",
    "Toepen (kloppen) verhoogt de inzet met 1. Meegaan en de ronde verliezen kost de verhoogde inzet; passen kost de inzet van vóór de toep. Overtoepen verhoogt de inzet verder.",
    "Noteer na iedere ronde de werkelijk opgelopen strafpunten. Laat het veld leeg bij 0 punten."
  ],
  rulesNote:"Bij 15 strafpunten lig je eruit. De laatste speler die overblijft wint. Toepen kent huisregelvarianten; spreek vooraf af hoe jullie passen en overtoepen afhandelen.",
  modes:[{value:"out",label:"Afvalmodus"}],
  calculateTotal(player,rounds){return rounds.reduce((s,r)=>s+(Number(r.scores?.[player.id])||0),0);},
  status(player,total,game){return total>=game.limit?"out":"active";},
  winner(players,rounds,game){
    const active=players.map(player=>({player,total:this.calculateTotal(player,rounds)})).filter(x=>x.total<game.limit);
    return active.length===1?active[0]:null;
  }
};
