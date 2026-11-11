(() => {
  "use strict";
  const CURRENT_KEY = "take5-scorekeeper-v1"; // compatibel met de bestaande versie
  const ARCHIVE_KEY = "scorekeeper-archive-v1";
  const $ = id => document.getElementById(id);
  const screens = ["homeScreen","rulesScreen","setupScreen","gameScreen"];
  let selectedGameId = "take5";
  let currentGame = loadCurrent();
  let archive = loadArchive();
  let pendingEvent = null;

  function loadCurrent() {
    try { return JSON.parse(localStorage.getItem(CURRENT_KEY)); } catch { return null; }
  }
  function loadArchive() {
    try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY)) || []; } catch { return []; }
  }
  function persist() {
    if (currentGame) localStorage.setItem(CURRENT_KEY, JSON.stringify(currentGame));
    else localStorage.removeItem(CURRENT_KEY);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
  }
  function esc(value) {
    return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  }
  function moduleFor(id) { return window.GameModules?.[id] || null; }
  function totals(game = currentGame) {
    const mod = moduleFor(game.gameId || "take5");
    return game.players.map(player => ({
      ...player,
      total: mod ? mod.calculateTotal(player, game.rounds) : 0,
      status: mod ? mod.status(player, mod.calculateTotal(player, game.rounds), game) : "active"
    }));
  }
  function winner(game = currentGame) {
    const mod = moduleFor(game.gameId || "take5");
    return mod ? mod.winner(game.players, game.rounds, game) : null;
  }
  function showScreen(id) {
    screens.forEach(screen => $(screen).classList.toggle("hidden", screen !== id));
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function renderCatalog() {
    const modules = Object.values(window.GameModules || {});
    const resumeTile = currentGame ? `
      <button class="game-tile" data-resume="true">
        <span class="game-art">↗</span>
        <span class="game-tile-copy"><strong>Verder met ${esc(currentGame.gameName || "je spel")}</strong><span>Je lopende wedstrijd staat nog klaar.</span></span>
        <span class="tile-arrow">›</span>
      </button>` : "";
    $("gameCatalog").innerHTML = resumeTile + modules.map(mod => `
      <button class="game-tile" data-game="${esc(mod.id)}">
        <span class="game-art">${esc(mod.icon || "•")}</span>
        <span class="game-tile-copy"><strong>${esc(mod.name)}</strong><span>${esc(mod.shortDescription || mod.tagline || "")}</span></span>
        <span class="tile-arrow">›</span>
      </button>`).join("") + `
      <div class="game-tile soon-tile" aria-disabled="true">
        <span class="game-art">＋</span>
        <span class="game-tile-copy"><strong>Nieuw spel</strong><span>Deze plek is gereserveerd voor een volgend spel.</span><span class="soon-tag">BINNENKORT</span></span>
      </div>`;
    $("gameCatalog").onclick = event => {
      const resume = event.target.closest("[data-resume]");
      if (resume && currentGame) { renderGame(); showScreen("gameScreen"); return; }
      const button = event.target.closest("[data-game]");
      if (!button) return;
      selectedGameId = button.dataset.game;
      renderRules();
      showScreen("rulesScreen");
    };
  }
  function renderRules() {
    const mod = moduleFor(selectedGameId);
    if (!mod) return;
    $("rulesContent").innerHTML = `
      <div class="rules-hero">
        <div class="rules-icon">${esc(mod.icon || "•")}</div>
        <p class="eyebrow">SPELINTRODUCTIE</p>
        <h1>${esc(mod.name)}</h1>
        <p>${esc(mod.tagline || "")}</p>
      </div>
      <section class="card">
        <p class="eyebrow">DE BELANGRIJKSTE REGELS</p>
        <ol class="rule-list">${mod.rules.map(rule => `<li>${esc(rule)}</li>`).join("")}</ol>
        ${mod.rulesNote ? `<p class="rules-footnote">${esc(mod.rulesNote)}</p>` : ""}
      </section>
      <button class="button button-primary button-full" id="continueSetup">Spelers instellen <span>→</span></button>`;
    $("continueSetup").onclick = () => {
      $("pointLimit").value = mod.defaultLimit || 66;
      $("gameMode").innerHTML = (mod.modes || [{value:"out",label:"Afvalmodus"},{value:"win",label:"Winmodus"}])
        .map(mode => `<option value="${esc(mode.value)}">${esc(mode.label)}</option>`).join("");
      $("playerNames").value = "";
      showScreen("setupScreen");
    };
  }
  function renderArchive() {
    $("archiveCount").textContent = archive.length;
    if (!archive.length) {
      $("archiveList").innerHTML = '<div class="archive-empty">Je afgeronde spellen verschijnen hier.</div>';
      return;
    }
    $("archiveList").innerHTML = archive.slice().reverse().slice(0,5).map(item => `
      <div class="archive-row"><div><strong>${esc(item.gameName || "Spel")}</strong><small>${esc(item.date || "")} · ${item.players?.length || 0} spelers</small></div><strong>${esc(item.winnerName || "Afgerond")}</strong></div>`).join("");
  }
  function renderGame() {
    if (!currentGame) return;
    const mod = moduleFor(currentGame.gameId || "take5");
    if (!mod) return;
    const list = totals().sort((a,b) => a.total - b.total);
    const winning = winner();
    $("activeGameEyebrow").textContent = mod.name.toUpperCase();
    $("gameMeta").textContent = `${currentGame.rounds.length} rondes`;
    $("gameSummary").textContent = `Limiet ${currentGame.limit} · ${currentGame.mode === "out" ? "Afvalmodus" : "Winmodus"}`;
    $("roundCount").textContent = `${currentGame.rounds.length} rondes`;
    $("leaderboard").innerHTML = list.map((player,index) => `
      <article class="player-score ${player.status === "out" ? "is-out" : ""} ${winning?.player.id === player.id ? "is-winner" : ""}">
        <div><div class="player-name">${esc(player.name)}</div><div class="player-sub">${player.status === "out" ? "UITGESCHAKELD" : winning?.player.id === player.id ? "WINNAAR" : `SPELER ${index+1}`}</div></div>
        <div class="player-total">${player.total}</div>
      </article>`).join("");
    $("roundInputs").innerHTML = currentGame.players.map(player => {
      const item = list.find(p => p.id === player.id);
      const disabled = item.status !== "active" || !!winning;
      return `<div class="round-entry"><label for="score-${esc(player.id)}">${esc(player.name)}<small>${disabled ? (item.status === "out" ? "Uitgeschakeld" : "Spel afgelopen") : "Strafpunten deze ronde"}</small></label><input id="score-${esc(player.id)}" type="number" min="0" step="1" inputmode="numeric" value="0" data-player="${esc(player.id)}" ${disabled ? "disabled" : ""}></div>`;
    }).join("");
    $("saveRound").disabled = !!winning;
    $("saveRound").textContent = winning ? "Spel afgelopen" : "Ronde opslaan";
    $("roundHistory").innerHTML = currentGame.rounds.length ? currentGame.rounds.map((round,index) => `
      <div class="history-round"><div class="history-round-head"><strong>Ronde ${index+1}</strong><button class="button button-secondary button-small" data-edit-round="${esc(round.id)}">Wijzigen</button></div>
      ${currentGame.players.map(player => `<div class="history-score-row"><span>${esc(player.name)}</span><b>${Number(round.scores[player.id]) || 0}</b></div>`).join("")}</div>`).join("") : '<div class="archive-empty">Nog geen rondes gespeeld.</div>';
  }
  function startGame() {
    const mod = moduleFor(selectedGameId);
    const names = $("playerNames").value.split("\n").map(name => name.trim()).filter(Boolean);
    if (names.length < 2) return alert("Voer minimaal twee spelers in.");
    if (new Set(names.map(name => name.toLocaleLowerCase())).size !== names.length) return alert("Gebruik unieke spelersnamen.");
    const limit = Math.max(1, Number($("pointLimit").value) || mod.defaultLimit || 66);
    if (currentGame && !confirm("Er is al een spel bezig. Start je een nieuw spel, dan wordt het huidige spel afgesloten en bewaard in de geschiedenis.")) return;
    if (currentGame) archiveCurrent(false);
    currentGame = {
      gameId: selectedGameId, gameName: mod.name, limit, mode: $("gameMode").value,
      players: names.map((name,index) => ({id:`p${Date.now()}${index}`,name})),
      rounds: [], createdAt: new Date().toISOString()
    };
    persist(); renderGame(); renderArchive(); showScreen("gameScreen");
  }
  function archiveCurrent(completed = true) {
    if (!currentGame) return;
    const winning = winner();
    archive.push({
      id:`a${Date.now()}`,gameId:currentGame.gameId,gameName:currentGame.gameName,
      date:new Date().toLocaleDateString("nl-NL"),players:currentGame.players,
      rounds:currentGame.rounds,limit:currentGame.limit,mode:currentGame.mode,
      winnerName:winning?.player.name || (completed ? "Afgerond" : "Onderbroken")
    });
    currentGame = null;
  }
  function showEvent(type, player, total) {
    pendingEvent = type;
    $("eventSymbol").textContent = type === "winner" ? "🏆" : "○";
    $("eventEyebrow").textContent = type === "winner" ? "EINDE VAN HET SPEL" : "SPELSTATUS";
    $("eventTitle").textContent = type === "winner" ? "Gewonnen!" : "Speler uitgeschakeld";
    $("eventPlayer").textContent = player.name;
    $("eventScore").textContent = `${total} strafpunten`;
    $("eventMessage").textContent = type === "winner" ? "Gefeliciteerd met de overwinning!" : "Helaas, je hebt de puntenlimiet bereikt.";
    $("eventConfirm").textContent = type === "winner" ? "Terug naar overzicht" : "Verder spelen";
    $("eventModal").classList.remove("hidden");
    if (type === "winner") launchConfetti();
  }
  function launchConfetti() {
    const layer = $("confettiLayer");
    layer.innerHTML = "";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#c7d5a6","#e6c98d","#d99a89","#e8e8df","#8eaa80"];
    for (let i=0;i<42;i++) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random()*100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty("--drift", `${Math.round(Math.random()*110-55)}px`);
      piece.style.setProperty("--spin", `${Math.round(Math.random()*650+180)}deg`);
      piece.style.animationDelay = `${Math.random()*.65}s`;
      layer.appendChild(piece);
    }
  }
  function saveRound() {
    if (!currentGame || winner()) return;
    const before = totals();
    const scores = {};
    document.querySelectorAll("[data-player]").forEach(input => {
      scores[input.dataset.player] = Math.max(0,Math.floor(Number(input.value) || 0));
    });
    currentGame.rounds.push({id:`r${Date.now()}`,scores});
    persist();
    const after = totals();
    const winning = winner();
    renderGame();
    if (winning) {
      showEvent("winner",winning.player,winning.total);
      archiveCurrent(true); persist(); renderArchive();
      // Keep the final scoreboard visible underneath the winner dialog.
    } else {
      const eliminated = after.find(player => player.status === "out" && before.find(old => old.id === player.id)?.status !== "out");
      if (eliminated) showEvent("out",eliminated,eliminated.total);
    }
  }
  function editRound(id) {
    const round = currentGame.rounds.find(item => item.id === id);
    if (!round) return;
    for (const player of currentGame.players) {
      const value = prompt(`Strafpunten voor ${player.name} in deze ronde:`,round.scores[player.id] ?? 0);
      if (value === null) return;
      round.scores[player.id] = Math.max(0,Math.floor(Number(value) || 0));
    }
    persist(); renderGame();
  }
  function exportData(data,filename) {
    const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");anchor.href=url;anchor.download=filename;anchor.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.players && data.rounds && data.limit) {
          currentGame = {...data,gameId:data.gameId || "take5",gameName:data.gameName || "Take 5"};
          persist();renderGame();showScreen("gameScreen");toast("Back-up teruggezet.");
        } else if (Array.isArray(data.archive)) {
          archive = data.archive; if(data.current) currentGame=data.current;
          persist();renderArchive();toast("Back-up teruggezet.");
        } else throw new Error();
      } catch { alert("Dit bestand is geen geldige scorekeeper-back-up."); }
    };
    reader.readAsText(file);
  }
  function toast(message) {
    $("toast").textContent = message;$("toast").classList.remove("hidden");
    setTimeout(()=>$("toast").classList.add("hidden"),2200);
  }

  $("homeButton").onclick = () => { renderCatalog();renderArchive();showScreen("homeScreen"); };
  $("backToRules").onclick = () => { renderRules();showScreen("rulesScreen"); };
  $("startGame").onclick = startGame;
  $("saveRound").onclick = saveRound;
  $("leaveGame").onclick = () => {
    if (currentGame && !confirm("Terug naar de spellen? Je huidige wedstrijd blijft bewaard en kan later worden hervat via de back-up.")) return;
    renderCatalog();renderArchive();showScreen("homeScreen");
  };
  $("newGame").onclick = () => {
    if (!confirm("Een nieuw spel starten? Het huidige spel wordt bewaard in de geschiedenis.")) return;
    archiveCurrent(false);persist();renderArchive();renderCatalog();showScreen("homeScreen");
  };
  $("roundHistory").onclick = event => {
    const button = event.target.closest("[data-edit-round]");
    if (button) editRound(button.dataset.editRound);
  };
  $("eventConfirm").onclick = () => {
    $("eventModal").classList.add("hidden");$("confettiLayer").innerHTML="";
    if (pendingEvent === "winner") { renderCatalog();renderArchive();showScreen("homeScreen"); }
    pendingEvent = null;
  };
  $("exportCurrent").onclick = () => exportData(currentGame,"scorekeeper-spel-backup.json");
  $("exportAll").onclick = () => exportData({archive,current:currentGame},"scorekeeper-backup.json");
  $("importAll").onchange = event => { if(event.target.files[0])importData(event.target.files[0]);event.target.value=""; };
  $("gameMode").onchange = () => $("modeHelp").textContent = $("gameMode").value === "out"
    ? "Afvalmodus: wie de limiet bereikt, ligt uit het spel. De laatste speler wint."
    : "Winmodus: de eerste speler die de limiet bereikt, wint direct.";
  if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  function updateConnection(){ $("connection").textContent = navigator.onLine ? "Online · offline klaar" : "Offline"; }
  window.addEventListener("online",updateConnection);window.addEventListener("offline",updateConnection);updateConnection();
  renderCatalog();renderArchive();
  if (currentGame) { selectedGameId=currentGame.gameId || "take5";renderGame();showScreen("gameScreen"); }
  else showScreen("homeScreen");
})();