(() => {
"use strict";
const CURRENT_KEY="take5-scorekeeper-v1", ARCHIVE_KEY="scorekeeper-archive-v1";
const $=id=>document.getElementById(id), screens=["homeScreen","rulesScreen","setupScreen","gameScreen"];
let selectedGameId="take5", currentGame=loadCurrent(), archive=loadArchive(), pendingEvent=null;
function loadCurrent(){try{return JSON.parse(localStorage.getItem(CURRENT_KEY));}catch{return null;}}
function loadArchive(){try{return JSON.parse(localStorage.getItem(ARCHIVE_KEY))||[];}catch{return [];}}
function persist(){if(currentGame)localStorage.setItem(CURRENT_KEY,JSON.stringify(currentGame));else localStorage.removeItem(CURRENT_KEY);localStorage.setItem(ARCHIVE_KEY,JSON.stringify(archive));}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function mod(id){return window.GameModules?.[id]||null;}
function totals(g=currentGame){const m=mod(g.gameId||"take5");return g.players.map(p=>({...p,total:m?m.calculateTotal(p,g.rounds):0,status:m?m.status(p,m.calculateTotal(p,g.rounds),g):"active"}));}
function winner(g=currentGame){const m=mod(g.gameId||"take5");return m?m.winner(g.players,g.rounds,g):null;}
function show(id){screens.forEach(s=>$(s).classList.toggle("hidden",s!==id));window.scrollTo({top:0,behavior:"smooth"});}
function renderCatalog(){
 const modules=Object.values(window.GameModules||{}),resume=currentGame?`<button class="game-tile" data-resume="true"><span class="game-art">↗</span><span class="game-tile-copy"><strong>Verder met ${esc(currentGame.gameName||"je spel")}</strong><span>Je lopende wedstrijd staat nog klaar.</span></span><span class="tile-arrow">›</span></button>`:"";
 $("gameCatalog").innerHTML=resume+modules.map(m=>`<button class="game-tile" data-game="${esc(m.id)}"><span class="game-art">${esc(m.icon||"•")}</span><span class="game-tile-copy"><strong>${esc(m.name)}</strong><span>${esc(m.shortDescription||m.tagline||"")}</span></span><span class="tile-arrow">›</span></button>`).join("")+`<div class="game-tile soon-tile" aria-disabled="true"><span class="game-art">＋</span><span class="game-tile-copy"><strong>Nieuw spel</strong><span>Deze plek is gereserveerd voor een volgend spel.</span><span class="soon-tag">BINNENKORT</span></span></div>`;
 $("gameCatalog").onclick=e=>{if(e.target.closest("[data-resume]")&&currentGame){renderGame();show("gameScreen");return;}const b=e.target.closest("[data-game]");if(!b)return;selectedGameId=b.dataset.game;renderRules();show("rulesScreen");};
}
function renderRules(){
 const m=mod(selectedGameId);if(!m)return;
 $("rulesContent").innerHTML=`<div class="rules-hero"><div class="rules-icon">${esc(m.icon||"•")}</div><p class="eyebrow">SPELINTRODUCTIE</p><h1>${esc(m.name)}</h1><p>${esc(m.tagline||"")}</p></div><section class="card"><p class="eyebrow">DE BELANGRIJKSTE REGELS</p><ol class="rule-list">${m.rules.map(r=>`<li>${esc(r)}</li>`).join("")}</ol>${m.rulesNote?`<p class="rules-footnote">${esc(m.rulesNote)}</p>`:""}</section><button class="button button-primary button-full" id="continueSetup">Spelers instellen <span>→</span></button>`;
 $("continueSetup").onclick=()=>{$("pointLimit").value=m.defaultLimit||66;$("gameMode").innerHTML=(m.modes||[{value:"out",label:"Afvalmodus"},{value:"win",label:"Winmodus"}]).map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join("");$("playerNames").value="";show("setupScreen");};
}
function renderArchive(){
 $("archiveCount").textContent=archive.length;
 $("archiveList").innerHTML=archive.length?archive.slice().reverse().slice(0,5).map(x=>`<div class="archive-row"><div><strong>${esc(x.gameName||"Spel")}</strong><small>${esc(x.date||"")} · ${x.players?.length||0} spelers</small></div><strong>${esc(x.winnerName||"Afgerond")}</strong></div>`).join(""):'<div class="archive-empty">Je afgeronde spellen verschijnen hier.</div>';
}
function renderGame(){
 if(!currentGame)return;const m=mod(currentGame.gameId||"take5");if(!m)return;
 const list=totals().sort((a,b)=>a.total-b.total),w=winner();
 $("activeGameEyebrow").textContent=m.name.toUpperCase();$("gameMeta").textContent=`${currentGame.rounds.length} rondes`;
 $("gameSummary").textContent=`Limiet ${currentGame.limit} · ${currentGame.mode==="out"?"Afvalmodus":"Winmodus"}`;$("roundCount").textContent=`${currentGame.rounds.length} rondes`;
 $("leaderboard").innerHTML=list.map((p,i)=>`<article class="player-score ${p.status==="out"?"is-out":""} ${w?.player.id===p.id?"is-winner":""}"><div><div class="player-name">${esc(p.name)}</div><div class="player-sub">${p.status==="out"?"UITGESCHAKELD":w?.player.id===p.id?"WINNAAR":`SPELER ${i+1}`}</div></div><div class="player-total">${p.total||"—"}</div></article>`).join("");
 $("roundInputs").innerHTML=currentGame.players.map(p=>{const item=list.find(x=>x.id===p.id),disabled=item.status!=="active"||!!w;return `<div class="round-entry"><label for="score-${esc(p.id)}">${esc(p.name)}<small>${disabled?(item.status==="out"?"Uitgeschakeld":"Spel afgelopen"):"Strafpunten deze ronde"}</small></label><input id="score-${esc(p.id)}" type="number" min="0" step="1" inputmode="numeric" placeholder="—" data-player="${esc(p.id)}" ${disabled?"disabled":""}></div>`;}).join("");
 $("saveRound").disabled=!!w;$("saveRound").textContent=w?"Spel afgelopen":"Ronde opslaan";
 $("roundHistory").innerHTML=currentGame.rounds.length?currentGame.rounds.map((r,i)=>`<div class="history-round"><div class="history-round-head"><strong>Ronde ${i+1}</strong><button class="button button-secondary button-small" data-edit-round="${esc(r.id)}">Wijzigen</button></div>${currentGame.players.map(p=>`<div class="history-score-row"><span>${esc(p.name)}</span><b>${Number(r.scores[p.id])||"—"}</b></div>`).join("")}</div>`).join(""):'<div class="archive-empty">Nog geen rondes gespeeld.</div>';
}
function startGame(){
 const m=mod(selectedGameId),names=$("playerNames").value.split("\n").map(x=>x.trim()).filter(Boolean);
 if(names.length<2)return alert("Voer minimaal twee spelers in.");
 if(new Set(names.map(x=>x.toLocaleLowerCase())).size!==names.length)return alert("Gebruik unieke spelersnamen.");
 const limit=Math.max(1,Number($("pointLimit").value)||m.defaultLimit||66);
 if(currentGame&&!confirm("Er is al een spel bezig. Start je een nieuw spel, dan wordt het huidige spel afgesloten en bewaard in de geschiedenis."))return;
 if(currentGame)archiveCurrent(false);
 currentGame={gameId:selectedGameId,gameName:m.name,limit,mode:$("gameMode").value,players:names.map((name,i)=>({id:`p${Date.now()}${i}`,name})),rounds:[],createdAt:new Date().toISOString()};
 persist();renderGame();renderArchive();show("gameScreen");
}
function archiveCurrent(completed=true){
 if(!currentGame)return;const w=winner();archive.push({id:`a${Date.now()}`,gameId:currentGame.gameId,gameName:currentGame.gameName,date:new Date().toLocaleDateString("nl-NL"),players:currentGame.players,rounds:currentGame.rounds,limit:currentGame.limit,mode:currentGame.mode,winnerName:w?.player.name||(completed?"Afgerond":"Onderbroken")});currentGame=null;
}
function launchConfetti(){const layer=$("confettiLayer");layer.innerHTML="";if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const colors=["#c7d5a6","#e6c98d","#d99a89","#e8e8df","#8eaa80"];for(let i=0;i<42;i++){const p=document.createElement("i");p.className="confetti-piece";p.style.left=`${Math.random()*100}%`;p.style.background=colors[i%colors.length];p.style.setProperty("--drift",`${Math.round(Math.random()*110-55)}px`);p.style.setProperty("--spin",`${Math.round(Math.random()*650+180)}deg`);p.style.animationDelay=`${Math.random()*.65}s`;layer.appendChild(p);}}
function showEvent(type,p,total){pendingEvent=type;$("eventSymbol").textContent=type==="winner"?"🏆":"○";$("eventEyebrow").textContent=type==="winner"?"EINDE VAN HET SPEL":"SPELSTATUS";$("eventTitle").textContent=type==="winner"?"Gewonnen!":"Speler uitgeschakeld";$("eventPlayer").textContent=p.name;$("eventScore").textContent=`${total} strafpunten`;$("eventMessage").textContent=type==="winner"?"Gefeliciteerd met de overwinning!":"Helaas, je hebt de puntenlimiet bereikt.";$("eventConfirm").textContent=type==="winner"?"Terug naar overzicht":"Verder spelen";$("eventModal").classList.remove("hidden");if(type==="winner")launchConfetti();}
function saveRound(){
 if(!currentGame||winner())return;const before=totals(),inputs=[...document.querySelectorAll("[data-player]")];
 if(!inputs.some(x=>x.value.trim()!==""))return alert("Vul minimaal één score in. Laat spelers met 0 strafpunten leeg.");
 const scores={};inputs.forEach(x=>scores[x.dataset.player]=x.value.trim()===""?0:Math.max(0,Math.floor(Number(x.value)||0)));
 currentGame.rounds.push({id:`r${Date.now()}`,scores});persist();const after=totals(),w=winner();renderGame();
 if(w){showEvent("winner",w.player,w.total);archiveCurrent(true);persist();renderArchive();}
 else{const out=after.find(p=>p.status==="out"&&before.find(x=>x.id===p.id)?.status!=="out");if(out)showEvent("out",out,out.total);}
}
function editRound(id){const r=currentGame.rounds.find(x=>x.id===id);if(!r)return;for(const p of currentGame.players){const v=prompt(`Strafpunten voor ${p.name} in deze ronde:`,r.scores[p.id]??0);if(v===null)return;r.scores[p.id]=Math.max(0,Math.floor(Number(v)||0));}persist();renderGame();}
function exportData(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function importData(file){const reader=new FileReader();reader.onload=()=>{try{const d=JSON.parse(reader.result);if(d.players&&d.rounds&&d.limit){currentGame={...d,gameId:d.gameId||"take5",gameName:d.gameName||"Take 5"};persist();renderGame();show("gameScreen");toast("Back-up teruggezet.");}else if(Array.isArray(d.archive)){archive=d.archive;if(d.current)currentGame=d.current;persist();renderArchive();toast("Back-up teruggezet.");}else throw Error();}catch{alert("Dit bestand is geen geldige scorekeeper-back-up.");}};reader.readAsText(file);}
function toast(msg){$("toast").textContent=msg;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),2200);}
$("homeButton").onclick=()=>{renderCatalog();renderArchive();show("homeScreen");};
$("backToRules").onclick=()=>{renderRules();show("rulesScreen");};$("startGame").onclick=startGame;$("saveRound").onclick=saveRound;
$("leaveGame").onclick=()=>{if(currentGame&&!confirm("Terug naar de spellen? Je huidige wedstrijd blijft bewaard en kan later worden hervat."))return;renderCatalog();renderArchive();show("homeScreen");};
$("newGame").onclick=()=>{if(!confirm("Een nieuw spel starten? Het huidige spel wordt bewaard in de geschiedenis."))return;archiveCurrent(false);persist();renderArchive();renderCatalog();show("homeScreen");};
$("roundHistory").onclick=e=>{const b=e.target.closest("[data-edit-round]");if(b)editRound(b.dataset.editRound);};
$("eventConfirm").onclick=()=>{$("eventModal").classList.add("hidden");$("confettiLayer").innerHTML="";if(pendingEvent==="winner"){renderCatalog();renderArchive();show("homeScreen");}pendingEvent=null;};
$("exportCurrent").onclick=()=>exportData(currentGame,"scorekeeper-spel-backup.json");$("exportAll").onclick=()=>exportData({archive,current:currentGame},"scorekeeper-backup.json");
$("importAll").onchange=e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value="";};
$("gameMode").onchange=()=>$("modeHelp").textContent=$("gameMode").value==="out"?"Afvalmodus: wie de limiet bereikt, ligt uit het spel. De laatste speler wint.":"Winmodus: de eerste speler die de limiet bereikt, wint direct.";
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
function connection(){$("connection").textContent=navigator.onLine?"Online · offline klaar":"Offline";}
window.addEventListener("online",connection);window.addEventListener("offline",connection);connection();renderCatalog();renderArchive();
if(currentGame){selectedGameId=currentGame.gameId||"take5";renderGame();show("gameScreen");}else show("homeScreen");
})();
