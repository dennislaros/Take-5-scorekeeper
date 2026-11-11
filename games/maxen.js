/* Maxen: twee dobbelstenen, maximaal drie worpen per speler. */
window.GameModules = window.GameModules || {};
window.GameModules.maxen = {
  id: "maxen",
  name: "Maxen",
  icon: "⚄",
  available: true,
  hideSetupOptions: true,
  tagline: "Gooi maximaal drie keer, houd je hoogste worp en tel de slokken.",
  shortDescription: "Dobbelspel · Slokken bijhouden",
  rules: [
    "Iedere ronde bepaalt de eerste speler vooraf of iedereen maximaal 1, 2 of 3 keer mag gooien.",
    "Iedere speler mag na een worp zelf kiezen: nog een keer gooien of de huidige hoogste score accepteren. Wie tevreden is, kan direct door naar de volgende speler.",
    "De hoogste worp van iedere speler telt. Een gewone worp wordt gelezen met het hoogste dobbelsteengetal vooraan, bijvoorbeeld 5 en 3 is 53.",
    "Een dubbel wordt weergegeven als 100 t/m 600. 21 (een 2 en een 1) is Max en is de hoogste worp.",
    "De speler(s) met de laagste eindworp verliezen de ronde en drinken standaard 1 slok.",
    "Iedere keer dat iemand 21 (Max) gooit, verdubbelt het aantal slokken dat voor die ronde geldt opnieuw: 1, 2, 4, 8, enzovoort.",
    "De laatste speler die 31 heeft gegooid, drinkt iedere keer 1 slok wanneer een andere speler daarna een dubbel (100 t/m 600) gooit."
  ],
  rulesNote: "De 31-slokken komen boven op eventuele slokken als rondeverliezer. Bij een gelijke laagste eindworp drinken alle spelers met die laagste score.",
  winner() { return null; },
  createGame(names) {
    const players = names.map((name, i) => ({ id: `p${Date.now()}${i}`, name }));
    return {
      gameId: "maxen",
      gameName: "Maxen",
      players,
      rounds: [],
      createdAt: new Date().toISOString(),
      maxenRound: this.newRound(1, players)
    };
  },
  newRound(number, players) {
    return {
      number,
      phase: "choose-limit",
      limit: null,
      turnIndex: 0,
      rolls: Object.fromEntries(players.map(p => [p.id, []])),
      best: Object.fromEntries(players.map(p => [p.id, null])),
      last31PlayerId: null,
      maxCount: 0,
      thirtyOneDrinks: Object.fromEntries(players.map(p => [p.id, 0])),
      lastDice: null,
      results: null
    };
  },
  score(d1, d2) {
    if ((d1 === 2 && d2 === 1) || (d1 === 1 && d2 === 2)) return { value: 21, rank: 1000, label: "21 · MAX", isMax: true, isDouble: false };
    if (d1 === d2) return { value: d1 * 100, rank: d1 * 100, label: `${d1 * 100}`, isMax: false, isDouble: true };
    const value = Math.max(d1, d2) * 10 + Math.min(d1, d2);
    return { value, rank: value, label: String(value), isMax: false, isDouble: false };
  },
  finishRound(game) {
    const r = game.maxenRound;
    const ranks = game.players.map(p => ({ player: p, best: r.best[p.id] }));
    const valid = ranks.filter(x => x.best);
    const lowest = Math.min(...valid.map(x => x.best.rank));
    const baseDrinks = Math.pow(2, r.maxCount);
    const sloks = {};
    game.players.forEach(p => {
      const lost = r.best[p.id] && r.best[p.id].rank === lowest;
      sloks[p.id] = (lost ? baseDrinks : 0) + (r.thirtyOneDrinks[p.id] || 0);
    });
    r.results = {
      sloks,
      baseDrinks,
      maxCount: r.maxCount,
      last31PlayerId: r.last31PlayerId,
      thirtyOneDrinks: { ...r.thirtyOneDrinks },
      scores: Object.fromEntries(game.players.map(p => [p.id, r.best[p.id] ? r.best[p.id].label : "—"])),
      rolls: JSON.parse(JSON.stringify(r.rolls)),
      limit: r.limit,
      losers: ranks.filter(x => x.best && x.best.rank === lowest).map(x => x.player.id)
    };
    r.phase = "summary";
    game.rounds.push({
      id: `maxen-${Date.now()}`,
      number: r.number,
      limit: r.limit,
      scores: r.results.scores,
      sloks: r.results.sloks,
      maxCount: r.maxCount,
      baseDrinks,
      last31PlayerId: r.last31PlayerId,
      thirtyOneDrinks: { ...r.thirtyOneDrinks },
      rolls: JSON.parse(JSON.stringify(r.rolls))
    });
  },
  render(game, root, api) {
    const self = this;
    const r = game.maxenRound || (game.maxenRound = self.newRound(game.rounds.length + 1, game.players));
    const dieFaces = ["","⚀","⚁","⚂","⚃","⚄","⚅"];
    const totalSloks = Object.fromEntries(game.players.map(p => [p.id, game.rounds.reduce((sum, round) => sum + (Number(round.sloks?.[p.id]) || 0), 0)]));
    const playerName = id => game.players.find(p => p.id === id)?.name || "Onbekende speler";
    const scoreLabel = best => best ? best.label : "—";
    let body = "";
    if (r.phase === "choose-limit") {
      body = `<section class="maxen-card"><div class="maxen-topline"><span class="eyebrow">RONDE ${r.number}</span><span class="count-pill">Instellen</span></div><h2 class="maxen-title">${esc(playerName(game.players[0].id))} bepaalt het aantal worpen</h2><p class="maxen-muted">Hoe vaak mag iedere speler maximaal gooien? Iedereen mag eerder stoppen zodra die tevreden is.</p><div class="maxen-choice-row">${[1,2,3].map(n=>`<button class="maxen-choice" data-limit="${n}">${n}<small>${n===1?"worp":"worpen"}</small></button>`).join("")}</div></section>`;
    } else if (r.phase === "playing") {
      const p = game.players[r.turnIndex], rolls = r.rolls[p.id] || [], best = r.best[p.id], last = r.lastDice;
      const done = rolls.length >= r.limit;
      const faces = last ? [dieFaces[last[0]],dieFaces[last[1]]] : ["⚀","⚀"];
      const rollText = last ? self.score(last[0],last[1]).label : "Klaar voor de eerste worp";
      const currentList = game.players.map((player,i)=>`<div class="maxen-player-row ${i===r.turnIndex?"current":""}"><div><strong>${esc(player.name)}</strong><small>${(r.rolls[player.id]||[]).length}/${r.limit} worpen${i===r.turnIndex?" · aan de beurt":""}</small></div><div class="maxen-player-score">${esc(scoreLabel(r.best[player.id]))}</div></div>`).join("");
      body = `<section class="maxen-card"><div class="maxen-topline"><span class="eyebrow">RONDE ${r.number}</span><span class="count-pill">Maximaal ${r.limit} ${r.limit===1?"worp":"worpen"}</span></div><p class="maxen-muted">Nu aan de beurt</p><h2 class="maxen-title">${esc(p.name)}</h2><div class="maxen-dice"><div class="maxen-die">${faces[0]}</div><div class="maxen-die">${faces[1]}</div></div><div class="maxen-roll-score">${esc(rollText)}</div><p class="maxen-muted" style="text-align:center">${last?`Worp ${(r.rolls[p.id]||[]).length} van ${r.limit} · beste score: ${esc(scoreLabel(best))}`:"Gooi de dobbelstenen om je eerste score te zien."}</p>${last&&self.score(last[0],last[1]).isMax?'<div class="maxen-notice">MAX! Het aantal slokken voor deze ronde is opnieuw verdubbeld.</div>':""}<div class="maxen-actions ${!last?"single":""}">${!done?`<button class="button button-primary" data-action="roll">${last?"Nog een keer gooien":"Gooi de dobbelstenen"}</button>`:""}${last?`<button class="button button-secondary" data-action="accept">${done?"Volgende speler":"Score akkoord"}</button>`:""}</div><div class="maxen-stat-grid"><div class="maxen-stat"><strong>${(r.rolls[p.id]||[]).length}/${r.limit}</strong><span>Worpen</span></div><div class="maxen-stat"><strong>${esc(scoreLabel(best))}</strong><span>Beste worp</span></div><div class="maxen-stat"><strong>${r.maxCount}</strong><span>Max gegooid</span></div></div></section><section class="maxen-card"><p class="eyebrow">TUSSENSTAND</p><div class="maxen-player-list">${currentList}</div></section>`;
    } else {
      const rows = game.players.map(p=>`<div class="maxen-result-row"><strong>${esc(p.name)}${r.results.losers.includes(p.id)?" · verliezer":""}</strong><span class="maxen-result-score">${esc(r.results.scores[p.id])}</span><span class="maxen-result-drinks">${r.results.sloks[p.id]} ${r.results.sloks[p.id]===1?"slok":"slokken"}</span></div>`).join("");
      const total = Object.values(r.results.sloks).reduce((a,b)=>a+b,0);
      body = `<section class="maxen-card"><div class="maxen-topline"><span class="eyebrow">RONDE ${r.number} AFGEROND</span><span class="count-pill">Uitslag</span></div><h2 class="maxen-title">Slokken deze ronde</h2><p class="maxen-muted">De laagste eindworp verliest. De slokken van de 31-regel komen daar eventueel bovenop.</p><div style="margin-top:12px">${rows}</div><div class="maxen-notice" style="margin-top:14px">Max gegooid: ${r.maxCount} keer · basis voor de verliezer: ${r.results.baseDrinks} ${r.results.baseDrinks===1?"slok":"slokken"}${r.last31PlayerId?` · laatste 31: ${esc(playerName(r.last31PlayerId))} (${r.results.thirtyOneDrinks[r.last31PlayerId]||0} extra)`:" · geen 31-regel geactiveerd"}</div><div class="maxen-actions single"><button class="button button-primary" data-action="next-round">Volgende ronde</button></div></section>`;
    }
    const history = game.rounds.length ? `<section class="maxen-card"><p class="eyebrow">TOTAALOVERZICHT</p>${game.players.map(p=>`<div class="maxen-player-row"><div><strong>${esc(p.name)}</strong><small>Opgeteld over ${game.rounds.length} ${game.rounds.length===1?"ronde":"rondes"}</small></div><div class="maxen-player-score">${totalSloks[p.id]} ${totalSloks[p.id]===1?"slok":"slokken"}</div></div>`).join("")}</section><section class="maxen-card"><p class="eyebrow">RONDEGESCHIEDENIS</p>${game.rounds.slice().reverse().map(round=>`<div class="maxen-history-round"><div class="maxen-history-head"><span>Ronde ${round.number}</span><span>${round.maxCount}× Max · basis ${round.baseDrinks}</span></div><div class="maxen-history-detail">${game.players.map(p=>`${esc(p.name)}: ${round.scores[p.id]||"—"} · ${round.sloks[p.id]} slok(ken)`).join("  |  ")}</div></div>`).join("")}</section>` : "";
    root.innerHTML = `<div class="maxen-panel">${body}${history}<div class="game-footer-actions"><button class="button button-secondary" data-action="backup">Back-up</button><button class="button button-secondary" data-action="new-game">Nieuw spel</button></div></div>`;
    root.onclick = event => {
      const button = event.target.closest("button[data-action],button[data-limit]");
      if (!button) return;
      if (button.dataset.limit) {
        r.limit = Number(button.dataset.limit);
        r.phase = "playing";
        r.turnIndex = 0;
        api.persist(); api.rerender(); return;
      }
      const action = button.dataset.action;
      if (action === "roll") {
        const d1 = Math.floor(Math.random()*6)+1, d2 = Math.floor(Math.random()*6)+1;
        const p = game.players[r.turnIndex], result = self.score(d1,d2);
        r.lastDice = [d1,d2];
        r.rolls[p.id].push({dice:[d1,d2],label:result.label,rank:result.rank});
        if (!r.best[p.id] || result.rank > r.best[p.id].rank) r.best[p.id] = result;
        if (result.isMax) r.maxCount += 1;
        if (result.value === 31) r.last31PlayerId = p.id;
        if (result.isDouble && r.last31PlayerId && r.last31PlayerId !== p.id) r.thirtyOneDrinks[r.last31PlayerId] += 1;
        api.persist(); api.rerender();
      } else if (action === "accept") {
        r.turnIndex += 1;
        r.lastDice = null;
        if (r.turnIndex >= game.players.length) self.finishRound(game);
        api.persist(); api.rerender();
      } else if (action === "next-round") {
        game.maxenRound = self.newRound(r.number+1,game.players);
        api.persist(); api.rerender();
      } else if (action === "backup") {
        api.exportBackup();
      } else if (action === "new-game") {
        document.getElementById("newGame").click();
      }
    };
  }
};
function esc(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
