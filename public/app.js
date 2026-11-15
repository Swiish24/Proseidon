import { LV, BYID, ARENA, PLACE_LV, PLACES, check, answerText, rankFor, fixIssues, dailyIds } from "./bank.js";

const PRAISE = ["Smooth sailing.", "The trident strikes true.", "Right on target.", "Clean as a fresh page.", "Spot on.", "Calm seas ahead."];
const MISS = ["Choppy waters.", "The tide turned on that one.", "Not this time.", "Close, but no pearl."];
const ONB = ["welcome", "intro", "place", "placed", "loading"];
const KEY = "proseidon_v4";
const DAY = 864e5;
const trident = `<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 31V10M5 4v5a7 7 0 0 0 14 0V4M12 4v6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M3 6l2-4 2 4M10 6l2-4 2 4M17 6l2-4 2 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rand = a => a[Math.floor(Math.random() * a.length)];
const today = () => new Date().toLocaleDateString("en-CA");
const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);
function weekKey() { const d = new Date(); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = t.getUTCFullYear(); return y + "-W" + Math.ceil(((t - Date.UTC(y, 0, 1)) / DAY + 1) / 7); }

let DB = { users: {}, current: null };
try { const d = JSON.parse(localStorage.getItem(KEY) || "null"); if (d && d.users) DB = d; } catch (e) {}
let U = null, AUTH = null, ONLINE = false, ADMIN = false, PTS = { week: 0, all: 0 };
const S = { mode: "loading", lvl: 0, round: [], qi: 0, res: [], prac: [], pi: 0, sel: null, typed: "", answered: false, pq: [], pres: [], hint: false, order: [0, 1, 2, 3], set: null, rp: null, served: {}, qStart: {}, roundPts: 0, arena: null, lb: "week" };

function blank(name) { return { name, lvl: 0, xp: 0, best: {}, right: 0, total: 0, streak: 0, placed: false, seen: {}, last: {}, review: {}, skills: {}, daily: { streak: 0, last: null, freezes: 1, fweek: null }, arena: {}, tide: null, d5: null, updatedAt: 0 }; }
function fill(p) { const b = blank(p.name); for (const k in b) if (p[k] == null) p[k] = b[k]; return p; }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} }
let syncTimer = null;
function save() {
  if (!U) return;
  U.lvl = S.lvl; U.updatedAt = Date.now(); persist();
  if (AUTH && ONLINE) { clearTimeout(syncTimer); syncTimer = setTimeout(() => api("/sync", { ...AUTH, profile: U }).catch(() => {}), 1500); }
}
async function api(path, body) {
  const r = await fetch("/api" + path, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok) { const e = new Error(j.error || "Something went wrong. Try again."); e.status = r.status; throw e; }
  return j;
}

/* ---------- progress helpers ---------- */
function draw(l, n, avoid = []) {
  const all = LV[l].q.map(q => q.id).filter(id => !avoid.includes(id));
  U.seen[l] = (U.seen[l] || []).filter(id => BYID[id]);
  let pick = shuffle(all.filter(id => !U.seen[l].includes(id))).slice(0, n);
  if (pick.length < n) {
    U.seen[l] = [];
    const last = U.last[l] || [], rest = all.filter(id => !pick.includes(id));
    pick = pick.concat(shuffle(rest.filter(id => !last.includes(id))).concat(shuffle(rest.filter(id => last.includes(id)))).slice(0, n - pick.length));
  }
  U.seen[l] = U.seen[l].concat(pick);
  return pick;
}
function skillHit(q, ok) { const k = q.lvl + "|" + q.tag; const s = U.skills[k] || (U.skills[k] = { r: 0, t: 0 }); s.t++; if (ok) s.r++; }
function addReview(id) { U.review[id] = { due: Date.now() + DAY, wins: 0 }; }
function reviewResult(id, ok) { const r = U.review[id]; if (!r || r.due > Date.now()) return; if (ok) { r.wins++; if (r.wins >= 2) delete U.review[id]; else r.due = Date.now() + 3 * DAY; } else { r.wins = 0; r.due = Date.now() + DAY; } }
const savedIds = () => Object.keys(U.review).filter(id => BYID[id]);
const dueIds = () => savedIds().filter(id => U.review[id].due <= Date.now()).sort((a, b) => U.review[a].due - U.review[b].due);
function refreshDaily() { const d = U.daily, wk = weekKey(); if (d.fweek !== wk) { d.freezes = 1; d.fweek = wk; } if (d.last) { const g = dayDiff(d.last, today()); if (g > 2 || (g === 2 && d.freezes < 1)) d.streak = 0; } }
function markDay() {
  const d = U.daily, t = today(); if (d.last === t) return;
  const g = d.last ? dayDiff(d.last, t) : 99;
  if (g === 1) d.streak++;
  else if (g === 2 && d.freezes > 0) { d.freezes--; d.streak++; toast("Streak freeze used. Your streak is safe."); }
  else d.streak = 1;
  d.last = t; save(); toast(`Daily goal done. Day streak: ${d.streak}.`);
}
function weakSpots() {
  return Object.entries(U.skills).filter(([, s]) => s.t >= 2).map(([k, s]) => { const [l, tag] = k.split("|"); return { l: +l, tag, r: s.r, t: s.t, acc: s.r / s.t }; })
    .filter(x => LV[x.l] && LV[x.l].skills[x.tag]).sort((a, b) => a.acc - b.acc || b.t - a.t);
}

/* ---------- shell ---------- */
function stats() {
  $("sLevel").textContent = U && U.placed ? S.lvl + 1 : "–";
  $("sDay").textContent = U ? U.daily.streak : 0;
  $("sPts").textContent = AUTH && ONLINE ? PTS.week : "–";
  $("sXp").textContent = U ? U.xp : 0;
  $("sAcc").textContent = U && U.total ? Math.round(100 * U.right / U.total) + "%" : "–";
  const due = U ? dueIds().length : 0;
  $("tReview").innerHTML = `Returning Tide${due ? ` <span class="badge">${due}</span>` : ""}`;
}
function map() {
  $("map").innerHTML = LV.map((v, k) => { const b = U && U.best[k]; let c = "lv"; if (b >= 4) c += " done"; if (k === S.lvl) c += " cur"; return `<button class="${c}" data-lv="${k}" aria-label="Level ${k + 1}, ${PLACES[k]}: ${v.t}${b != null ? `, best ${b} of 5` : ""}" title="${v.t}${b != null ? ` · best ${b}/5` : ""}"><span class="n">${k + 1}</span><span class="s">${PLACES[k].replace("The ", "")}</span></button>`; }).join("");
}
function tag(back) {
  const t = $("tag");
  if (!U) { t.textContent = "Climb ten levels of English, from parts of speech to PhD."; return; }
  t.innerHTML = `${back ? "Welcome back, " : "Playing as "}<b>${esc(U.name)}</b>${AUTH && ONLINE ? ` · ${rankFor(PTS.all).name}` : ` <span class="off">offline</span>`} · <button class="link" id="sw">Switch player</button>`;
  $("sw").onclick = () => { DB.current = null; U = null; AUTH = null; ADMIN = false; $("inboxT").hidden = true; persist(); S.mode = "welcome"; tag(); render(); };
}
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.remove("show"); void t.offsetWidth; t.classList.add("show"); }
function floatUp(text, cls) { const c = $("card"); requestAnimationFrame(() => { const x = document.createElement("div"); x.className = "xp " + (cls || ""); x.textContent = text; c.appendChild(x); setTimeout(() => x.remove(), 1200); }); }
function gain(n) { U.xp += n; stats(); floatUp("+" + n + " XP"); const c = $("card"); const r = document.createElement("div"); r.className = "ripple"; r.style.left = "50%"; r.style.top = "60%"; c.appendChild(r); setTimeout(() => r.remove(), 900); }
function shake() { const c = $("card"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); }
function fresh() { S.sel = null; S.typed = ""; S.answered = false; S.order = shuffle([0, 1, 2, 3]); }

/* ---------- account screens ---------- */
function enter(key, res, isNew) {
  const local = DB.users[key] && DB.users[key].profile;
  let p = res.profile;
  if (local && (!p || (local.updatedAt || 0) > (p.updatedAt || 0))) p = local;
  p = fill(p || blank(res.name)); p.name = res.name;
  DB.users[key] = { profile: p, token: res.token || null }; DB.current = key;
  U = p; AUTH = res.token ? { user: res.name, token: res.token } : null;
  PTS = { week: res.weekPts || 0, all: res.allPts || 0 }; ADMIN = !!res.isAdmin;
  $("inboxT").hidden = !ADMIN;
  refreshDaily(); S.lvl = U.lvl || 0; save(); tag(!isNew);
  if (U.placed) home(); else { S.mode = "intro"; render(); }
}
function welcome(prefill) {
  const others = Object.keys(DB.users);
  $("card").innerHTML = `<p class="big">Welcome aboard.</p><p class="lead">Proseidon is a game for sharper English. Climb ten levels, from parts of speech to PhD-level rhetoric, and compete on the leaderboard.</p>
  <div class="row" style="align-items:flex-start"><div class="field"><label for="nm" class="lbl">Username</label><input id="nm" class="inp" maxlength="20" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="wordsmith.42" aria-describedby="nmHelp nmErr" value="${esc(prefill || "")}"><span class="foot" id="nmHelp">Letters, numbers, periods, hyphens, or underscores</span><p class="err" id="nmErr" role="alert"></p></div>
  ${ONLINE ? `<div class="field" style="max-width:160px"><label for="pin" class="lbl">4-digit PIN</label><input id="pin" class="inp" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="current-password" placeholder="••••" aria-describedby="pinErr"><p class="err" id="pinErr" role="alert"></p></div>` : ""}</div>
  <p class="err" id="err" role="alert"></p><div id="confirmNew"></div>
  <div class="row"><button class="btn" id="go">Continue</button></div>
  ${others.length ? `<div class="field" style="max-width:none"><span class="lbl">Players on this device</span><div class="row">${others.map(k => `<button class="btn ghost small" data-k="${esc(k)}">${esc(DB.users[k].profile.name)}</button>`).join("")}</div></div>` : ""}
  <p class="foot">${ONLINE ? "New here? Pick a username and PIN. Returning? Enter yours to pick up on any device." : "Offline mode: progress saves in this browser only, and scores won't post to the leaderboard."}</p>`;
  const clearErrs = () => { ["err", "nmErr", "pinErr"].forEach(id => { if ($(id)) $(id).textContent = ""; }); ["nm", "pin"].forEach(id => { if ($(id)) $(id).classList.remove("wrong"); }); };
  const err = (m, field) => { clearErrs(); const box = field && $(field + "Err") ? field + "Err" : "err"; $(box).textContent = m; if (field && $(field)) { $(field).classList.add("wrong"); $(field).focus(); } };
  const go = async () => {
    const v = $("nm").value.trim(); const k = v.toLowerCase();
    if (v.length < 3 || v.length > 20) return err("Usernames are 3 to 20 characters long.", "nm");
    if (/[^A-Za-z0-9_.-]/.test(v)) { const bad = [...new Set(v.match(/[^A-Za-z0-9_.-]/g))].map(c => c === " " ? "spaces" : `“${c}”`).join(", "); return err(`Usernames can't include ${bad}. Use letters, numbers, periods, hyphens, or underscores.`, "nm"); }
    if (!/^[A-Za-z0-9].*[A-Za-z0-9]$/.test(v)) return err("Start and end your username with a letter or number.", "nm");
    if (!ONLINE) { if (!DB.users[k]) DB.users[k] = { profile: blank(v), token: null }; return enter(k, { name: DB.users[k].profile.name, profile: DB.users[k].profile }, !DB.users[k].profile.placed); }
    const pin = $("pin").value.trim();
    if (!/^\d{4}$/.test(pin)) return err("Your PIN must be exactly 4 numbers.", "pin");
    $("go").textContent = "Checking…";
    try { enter(k, await api("/login", { user: v, pin }), false); }
    catch (e) {
      $("go").textContent = "Continue";
      if (e.status === 404) {
        err("");
        $("confirmNew").innerHTML = `<div class="fb tip"><h3>New player?</h3><p>No one has the username “${esc(v)}” yet. Create it with this PIN? Remember your PIN. You'll need it on other devices.</p><div class="row" style="margin-top:8px"><button class="btn brass" id="mk">Create player</button></div></div>`;
        $("mk").onclick = async () => { try { enter(k, await api("/register", { user: v, pin }), true); } catch (e2) { err(e2.message); } };
        $("mk").focus();
      } else err(e.message, e.status === 401 ? "pin" : e.status === 400 ? "nm" : null);
    }
  };
  $("go").onclick = go;
  ["nm", "pin"].forEach(id => { if ($(id)) { $(id).onkeydown = e => { if (e.key === "Enter") go(); }; $(id).oninput = () => { clearErrs(); $("confirmNew").innerHTML = ""; }; } });
  document.querySelectorAll("[data-k]").forEach(b => b.onclick = async () => {
    const rec = DB.users[b.dataset.k];
    if (ONLINE && rec.token) { try { return enter(b.dataset.k, await api("/login", { user: rec.profile.name, token: rec.token }), false); } catch (e) {} }
    if (!ONLINE) return enter(b.dataset.k, { name: rec.profile.name, profile: rec.profile }, false);
    $("nm").value = rec.profile.name; err("Enter your PIN to continue.", "pin");
  });
  (prefill && $("pin") ? $("pin") : $("nm")).focus();
}
function intro() {
  const steps = [["1", "Quick assessment", "Five questions, each harder than the last, set your starting level."], ["2", "Climb and compete", "Clear a level with 4 of 5 right. Fast, correct answers on harder levels earn more leaderboard points."], ["3", "Learn from misses", "Misses open a short lesson and come back later in your review queue."], ["4", "Daily habit", "Finish one round a day to grow your streak. You get one free streak freeze each week."]];
  $("card").innerHTML = `<span class="pill">How it works</span><p class="prompt">${esc(U.name)}, here's the plan.</p><div class="steps">${steps.map(s => `<div class="step"><span class="num">${s[0]}</span><div><h3>${s[1]}</h3><p>${s[2]}</p></div></div>`).join("")}</div><div class="row"><button class="btn" id="go">Start the assessment</button><button class="btn ghost" id="skip">Skip and start at Level 1</button></div>`;
  $("go").onclick = startPlace; $("skip").onclick = () => { U.placed = true; start(0); }; $("go").focus();
}
function startPlace() { if (!U) return; S.pq = PLACE_LV.map(l => { const ids = LV[l].q.filter(q => q.type === "mc").map(q => q.id); return ids[Math.floor(Math.random() * ids.length)]; }); S.pres = []; S.qi = 0; S.mode = "place"; fresh(); save(); render(); }
function placed() {
  const sc = S.pres.filter(Boolean).length, miss = S.pres.indexOf(false), lv = miss === -1 ? 9 : Math.max(0, PLACE_LV[miss] - 1);
  S.lvl = lv; U.placed = true; save(); stats();
  const why = miss === -1 ? "You answered all five. Head straight for the summit." : miss === 0 ? "We'll build from the ground up. The early levels move fast." : `You handled everything through Level ${PLACE_LV[miss - 1] + 1}, so you'll start just past it.`;
  $("card").innerHTML = `<span class="pill">Assessment complete · ${sc} of 5</span><p class="big">Start at Level ${lv + 1} · ${PLACES[lv]}</p><p class="lead"><b>${LV[lv].t}.</b> ${why}</p><p class="foot">You can jump to any level from the map at any time.</p><div class="row"><button class="btn" id="go">Start Level ${lv + 1}</button><button class="btn ghost" id="again">Retake the assessment</button></div>`;
  $("go").onclick = () => start(lv); $("again").onclick = startPlace; $("go").focus();
}

/* ---------- home and side screens ---------- */
function home() { S.mode = "home"; render(); }
function homeView() {
  const d = U.daily, done = d.last === today(), due = dueIds().length, weak = weakSpots()[0];
  const rk = rankFor(PTS.all), tideDone = U.tide === today();
  const d5 = d5Today(), allDone = d5 && tideDone;
  $("card").innerHTML = `<span class="pill">The Harbor · Home</span>
  ${allDone ? `<div class="fb ok donefor"><h3>That's today.</h3><p>The Daily Five and your Tide are both done. Come back tomorrow for new ones. Extra practice is always open, but your daily work is finished.</p></div>` : ""}
  <div class="tidecard d5card ${d5 ? "done" : ""}"><div><span class="lbl">Daily Five · same five for everyone</span><b>${d5 ? `${d5.res.filter(Boolean).length} / 5 today &nbsp;${squares(d5.res)}` : "5 questions · easy to hard"}</b><span class="foot">${d5 ? "A new Daily Five arrives tomorrow." : "Everyone plays the same five today, so you can compare with friends."}</span></div><button class="btn ${d5 ? "ghost" : "brass"}" id="d5">${d5 ? "See and share" : "Play the Daily Five"}</button></div>
  <div class="tidecard ${tideDone ? "done" : ""}"><div><span class="lbl">Today's Tide</span><b>${tideDone ? "Done for today" : "5 questions · about 3 minutes"}</b><span class="foot">${tideDone ? "Nice work. A new Tide rolls in tomorrow. Extra practice is always open." : "A mix of your review questions and your current level. Counts toward your daily goal."}</span></div><button class="btn ${tideDone ? "ghost" : "brass"}" id="tide">${tideDone ? "Play it again" : "Start today's Tide"}</button></div><p class="big">Level ${S.lvl + 1} · ${PLACES[S.lvl]}</p><p class="lead">${LV[S.lvl].t}${U.best[S.lvl] != null ? ` · best ${U.best[S.lvl]}/5` : ""}</p>
  ${AUTH && ONLINE ? `<div class="rank"><span><b>${rk.name}</b>${rk.next ? ` · ${(rk.next.at - PTS.all).toLocaleString()} points to ${rk.next.name}` : " · the highest rank"}</span><div class="bar sea"><span style="width:${rk.next ? Math.round(100 * (PTS.all - rk.min) / (rk.next.at - rk.min)) : 100}%"></span></div></div>` : ""}
  <div class="grid2">
    <div class="mini ${done ? "good" : ""}"><span class="lbl">Today's goal</span><b>${done ? "Done" : "Finish 1 round"}</b><span class="foot">Day streak ${d.streak} · ${d.freezes} freeze${d.freezes === 1 ? "" : "s"} left this week</span></div>
    <div class="mini"><span class="lbl">Review queue</span><b>${due} due</b><span class="foot">${savedIds().length} saved from past misses</span></div>
    <div class="mini"><span class="lbl">Weakest skill</span><b>${weak ? esc(LV[weak.l].skills[weak.tag]) : "Not enough data yet"}</b><span class="foot">${weak ? `Level ${weak.l + 1} · ${Math.round(weak.acc * 100)}% right` : "Play a few rounds to find out."}</span></div>
    <div class="mini"><span class="lbl">Leaderboard points</span><b>${AUTH && ONLINE ? PTS.week + " this week" : "Offline"}</b><span class="foot">${AUTH && ONLINE ? PTS.all + " all-time" : "Play online to compete."}</span></div>
  </div>
  <div class="badges" aria-label="Level badges">${PLACES.map((pl, k) => `<span class="bdg ${U.best[k] >= 4 ? "got" : ""}" title="${pl}${U.best[k] >= 4 ? " · cleared" : " · not cleared yet"}">${trident}<i>${k + 1}</i></span>`).join("")}</div>
  <div class="row"><button class="btn" id="go">Play Level ${S.lvl + 1}</button>${due ? `<button class="btn ghost" id="rv">Review ${due} due</button>` : ""}${weak ? `<button class="btn ghost" id="dr">Drill weakest skill</button>` : ""}<button class="btn ghost" id="ar">Enter the Agora</button></div>`;
  $("go").onclick = () => start(S.lvl);
  $("tide").onclick = startTide;
  $("d5").onclick = startDaily;
  if ($("rv")) $("rv").onclick = startReview;
  if ($("dr")) $("dr").onclick = () => startDrill(weak.l, weak.tag);
  $("ar").onclick = () => { S.mode = "arena"; render(); };
  $("go").focus();
}
function startReview() {
  const due = dueIds(), all = savedIds();
  if (!all.length) { S.mode = "msg"; S.msg = ["Returning Tide · Review", "Nothing to review yet.", "Questions you miss in level rounds land here and come back after 1 day, then 3 days. Answer one right twice in a row and it leaves the queue."]; return render(); }
  const ids = (due.length ? due : shuffle(all)).slice(0, 5);
  S.set = { kind: "review", early: !due.length, title: due.length ? "Returning Tide" : "Returning Tide (early)", ids, i: 0, res: [] }; S.mode = "set"; fresh(); render();
}
function startDrill(l, tagKey) { const ids = shuffle(LV[l].q.filter(q => q.tag === tagKey).map(q => q.id)).slice(0, 5); S.set = { kind: "drill", title: "Drill · " + LV[l].skills[tagKey], ids, i: 0, res: [] }; S.mode = "set"; fresh(); render(); }
function weakView() {
  const w = weakSpots().slice(0, 6);
  $("card").innerHTML = `<span class="pill">Rough Waters · Weak spots</span><p class="prompt">Your skills, weakest first</p>${w.length ? `<div class="skills">${w.map(x => `<div class="skill"><div class="sk-top"><span><b>${esc(LV[x.l].skills[x.tag])}</b> <span class="foot">Level ${x.l + 1}</span></span><span class="foot">${x.r}/${x.t} right</span></div><div class="bar"><span style="width:${Math.round(x.acc * 100)}%"></span></div><button class="btn ghost small" data-drill="${x.l}|${x.tag}">Drill this skill</button></div>`).join("")}</div>` : `<p class="lead">Play a few rounds and this map fills in. Each question is tagged with a skill, so you'll see exactly where to focus.</p>`}<div class="row"><button class="btn ghost" id="hm">Back to home</button></div>`;
  document.querySelectorAll("[data-drill]").forEach(b => b.onclick = () => { const [l, t] = b.dataset.drill.split("|"); startDrill(+l, t); });
  $("hm").onclick = home;
}
function msgView() { const [p, h, t] = S.msg; $("card").innerHTML = `<span class="pill">${p}</span><p class="prompt">${h}</p><p class="lead">${t}</p><div class="row"><button class="btn" id="hm">Back to home</button></div>`; $("hm").onclick = home; $("hm").focus(); }
function arenaView() {
  $("card").innerHTML = `<span class="pill scenic">The Agora · Argument practice</span><p class="prompt">Win the argument, not the fight.</p><p class="lead">In ancient Athens, the agora was where people met to argue and decide. Pick your move in real situations. Each scenario teaches one idea from classical rhetoric.</p>
  <div class="arena">${ARENA.map(a => { const b = U.arena[a.id]; return `<button class="scen" data-sc="${a.id}"><span class="lbl">${esc(a.concept)}</span><b>${esc(a.title)}</b><span class="stars3">${b == null ? "Not played" : "★".repeat(b) + "☆".repeat(3 - b)}</span></button>`; }).join("")}</div><div class="row"><button class="btn ghost" id="hm">Back to home</button></div>`;
  document.querySelectorAll("[data-sc]").forEach(b => b.onclick = () => { S.arena = { id: b.dataset.sc, order: shuffle([0, 1, 2]), pick: null }; S.mode = "scene"; render(); });
  $("hm").onclick = home;
}
function sceneView() {
  const a = ARENA.find(x => x.id === S.arena.id), p = S.arena.pick;
  let h = `<span class="pill scenic">The Agora · ${esc(a.concept)}</span><p class="prompt">${esc(a.title)}</p><p class="lead">${esc(a.setup)}</p><p class="lbl">Your move:</p><div class="opts one">`;
  h += S.arena.order.map(k => { let c = "opt"; if (p != null) { if (a.moves[k][1] === 3) c += " right"; else if (k === p) c += " wrong"; } return `<button class="${c}" ${p != null ? "disabled" : ""} data-mv="${k}"><span>${esc(a.moves[k][0])}</span></button>`; }).join("") + "</div>";
  if (p != null) { const m = a.moves[p]; h += `<div class="fb ${m[1] === 3 ? "ok" : m[1] === 1 ? "tip" : "bad"}"><h3>${m[1] === 3 ? "Strong move. ★★★" : m[1] === 1 ? "It works, partly. ★☆☆" : "That backfires. ☆☆☆"}</h3><p>${esc(m[2])}</p></div><div class="fb lesson"><h3>The idea: ${esc(a.concept)}</h3><p>${esc(a.lesson)}</p></div>`;
    const nx = ARENA[(ARENA.indexOf(a) + 1) % ARENA.length];
    h += `<div class="row"><button class="btn" id="go">Next: ${esc(nx.title)}</button><button class="btn ghost" id="back">All scenarios</button><button class="btn ghost" id="again">Try again</button></div>`;
    $("card").innerHTML = h;
    $("go").onclick = () => { S.arena = { id: nx.id, order: shuffle([0, 1, 2]), pick: null }; render(); };
    $("back").onclick = () => { S.mode = "arena"; render(); };
    $("again").onclick = () => { S.arena = { id: a.id, order: shuffle([0, 1, 2]), pick: null }; render(); };
    $("go").focus(); return;
  }
  $("card").innerHTML = h + `<div class="row"><button class="btn ghost" id="back">All scenarios</button></div>`;
  $("back").onclick = () => { S.mode = "arena"; render(); };
  document.querySelectorAll("[data-mv]").forEach(b => b.onclick = () => {
    const k = +b.dataset.mv, pts = a.moves[k][1], prev = U.arena[a.id];
    S.arena.pick = k;
    if (prev == null || pts > prev) { const add = (pts - (prev || 0)) * 5; U.arena[a.id] = pts; if (add > 0) gain(add); }
    if (pts === 0) shake();
    markDay(); save(); render();
  });
}
async function lbView() {
  const head = `<span class="pill">The Pantheon · Leaderboard</span><div class="tabs" role="tablist"><button role="tab" class="tab ${S.lb === "week" ? "on" : ""}" aria-selected="${S.lb === "week"}" data-tab="week">This week</button><button role="tab" class="tab ${S.lb === "all" ? "on" : ""}" aria-selected="${S.lb === "all"}" data-tab="all">All-time</button></div>`;
  const how = `<p class="foot">Points come from level rounds only. Each correct answer earns 10 × the level, plus up to 50% for speed (fades over 20 seconds) and up to 40% for a streak in the round. Clearing a level adds a bonus. Weekly boards reset Monday (UTC). Rank titles come from all-time points: Deckhand, Sailor (500), Navigator (1,500), Captain (4,000), Admiral (10,000), Triton (25,000), and Poseidon (50,000).</p>`;
  const wire = () => { document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { S.lb = b.dataset.tab; render(); }); if ($("hm")) $("hm").onclick = home; };
  if (!ONLINE) { $("card").innerHTML = head + `<p class="lead">The leaderboard needs the online version of Proseidon.</p>` + how + `<div class="row"><button class="btn ghost" id="hm">Back to home</button></div>`; return wire(); }
  $("card").innerHTML = head + `<p class="foot">Loading…</p>`; wire();
  const want = S.lb;
  try {
    const r = await api("/leaderboard?period=" + want);
    if (S.mode !== "lb" || S.lb !== want) return;
    const me = U ? U.name.toLowerCase() : "";
    const rows = r.rows.map((x, i) => `<tr class="${x.name.toLowerCase() === me ? "me" : ""}"><td class="rk">${i + 1}</td><td>${esc(x.name)} <span class="rk-t">${esc(x.rank || "")}</span></td><td class="num">${x.pts.toLocaleString()}</td><td class="num">${x.rounds}</td></tr>`).join("");
    $("card").innerHTML = head + (r.rows.length ? `<div class="tblwrap"><table class="lb"><thead><tr><th>#</th><th>Player</th><th class="num">Points</th><th class="num">Rounds</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="lead">No scores yet ${want === "week" ? "this week" : ""}. Play a level round to take the top spot.</p>`) + (AUTH ? `<p class="foot">You: ${PTS.week.toLocaleString()} this week · ${PTS.all.toLocaleString()} all-time</p>` : "") + how + `<div class="row"><button class="btn ghost" id="hm">Back to home</button></div>`;
    wire();
  } catch (e) { $("card").innerHTML = head + `<p class="err">The leaderboard couldn't load. Try again in a moment.</p><div class="row"><button class="btn ghost" id="hm">Back to home</button></div>`; wire(); }
}

/* ---------- rounds ---------- */
function start(k) {
  if (!U) return;
  S.lvl = k; S.round = draw(k, 5); U.last[k] = S.round.slice(); S.qi = 0; S.res = []; S.mode = "q"; S.hint = false; S.served = {}; S.qStart = {}; S.roundPts = 0;
  S.rp = AUTH && ONLINE ? api("/round/start", { ...AUTH, level: k, qids: S.round }).then(r => r.roundId).catch(() => null) : Promise.resolve(null);
  fresh(); save(); render();
}
function serve(i) { if (S.served[i]) return; S.served[i] = S.rp.then(id => id ? api("/round/serve", { ...AUTH, roundId: id, i }).then(() => id) : null).catch(() => null); }
function curQ() {
  if (S.mode === "place") return BYID[S.pq[S.qi]];
  if (S.mode === "set") return BYID[S.set.ids[S.set.i]];
  return S.mode === "q" ? BYID[S.round[S.qi]] : BYID[S.prac[S.pi]];
}
function questionBody(q) {
  let h = `<p class="prompt">${esc(q.p)}</p>`;
  if (q.type === "mc") {
    h += `<div class="opts" role="group">` + S.order.map((o, pos) => { let c = "opt"; if (S.answered) { if (o === q.a) c += " right"; else if (o === S.sel) c += " wrong"; } else if (o === S.sel) c += " sel"; return `<button class="${c}" ${S.answered ? "disabled" : ""} data-pick="${o}"><span class="k">${pos + 1}</span><span>${esc(q.o[o])}</span></button>`; }).join("") + `</div>`;
  } else if (q.type === "tap") {
    h += `<p class="foot">Tap a word in the sentence.</p><div class="toks">` + q.s.map((w, k) => { let c = "tok"; if (S.answered) { if (k === q.a) c += " right"; else if (k === S.sel) c += " wrong"; } else if (k === S.sel) c += " sel"; return `<button class="${c}" ${S.answered ? "disabled" : ""} data-pick="${k}">${esc(w)}</button>`; }).join("") + `</div>`;
  } else if (q.type === "fix") {
    const st = S.answered ? (check(q, S.sel) ? "right" : "wrong") : "";
    h += `<div class="orig"><span class="lbl">Original</span><p>${esc(q.s)}</p></div><div class="field" style="max-width:none"><label class="lbl" for="ans">Your rewrite</label><textarea id="ans" class="inp ${st}" rows="3" autocapitalize="sentences" spellcheck="true" placeholder="Rewrite the sentence here" ${S.answered ? "disabled" : ""}>${esc(S.answered ? S.sel : S.typed)}</textarea><span class="foot">${q.max ? `Aim for ${q.max} words or fewer. ` : ""}Press Ctrl+Enter or Cmd+Enter to check.</span></div>`;
  } else {
    const st = S.answered ? (check(q, S.sel) ? "right" : "wrong") : "";
    h += `<div class="field" style="max-width:420px"><label class="lbl" for="ans">Your answer</label><input id="ans" class="inp ${st}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer" value="${esc(S.answered ? S.sel : S.typed)}" ${S.answered ? "disabled" : ""}></div>`;
  }
  return h;
}
function render() {
  stats(); map();
  const onb = ONB.includes(S.mode) || !U;
  $("map").style.display = onb ? "none" : ""; $("tiles").style.display = onb ? "none" : ""; $("tools").style.display = U ? "" : "none";
  document.querySelectorAll("#tiles .tile").forEach(t => t.classList.toggle("on", t.dataset.view === S.mode || (t.dataset.view === "arena" && S.mode === "scene") || (t.dataset.view === "review" && S.mode === "set" && S.set && S.set.kind === "review")));
  const c = $("card");
  if (S.mode === "loading") { c.innerHTML = `<p class="foot">Loading…</p>`; return; }
  if (S.mode === "welcome" || !U) return welcome();
  if (S.mode === "intro") return intro();
  if (S.mode === "placed") return placed();
  if (S.mode === "home") return homeView();
  if (S.mode === "weak") return weakView();
  if (S.mode === "msg") return msgView();
  if (S.mode === "arena") return arenaView();
  if (S.mode === "scene") return sceneView();
  if (S.mode === "lb") return lbView();
  if (S.mode === "inbox") return inboxView();
  if (S.mode === "done") return done();
  if (S.mode === "setdone") return setDone();
  if (S.mode === "d5done") return dailyDone();
  const L = LV[S.lvl];
  if (S.mode === "lesson") {
    c.innerHTML = `<div class="top"><span class="pill scenic">Scenic route · ${esc(L.t)}</span></div><div class="fb lesson"><h3>Quick lesson</h3><p>${esc(L.l)}</p></div><div class="row"><button class="btn brass" id="go">Try 2 practice questions</button><button class="btn ghost" id="skipd">Skip the detour</button></div>`;
    $("go").onclick = () => { S.mode = "prac"; S.pi = 0; fresh(); render(); }; $("skipd").onclick = back; $("go").focus(); return;
  }
  const q = curQ(), main = S.mode === "q", pl = S.mode === "place", set = S.mode === "set";
  if (main && !S.answered) { serve(S.qi); if (!S.qStart[S.qi]) S.qStart[S.qi] = performance.now(); }
  let dots = "";
  if (main || pl || set) { const arr = pl ? S.pres : set ? S.set.res : S.res, n = set ? S.set.ids.length : 5, cur = set ? S.set.i : S.qi; dots = `<div class="dots" aria-label="Question ${cur + 1} of ${n}">${Array.from({ length: n }, (_, k) => `<span class="dot ${arr[k] === true ? "ok" : arr[k] === false ? "bad" : k === cur ? "now" : ""}"></span>`).join("")}</div>`; }
  const label = pl ? `Assessment · question ${S.qi + 1} of 5` : main ? `Level ${S.lvl + 1} · ${PLACES[S.lvl]} · ${L.t}` : set ? `${S.set.title} · Level ${q.lvl + 1}` : `Scenic route · practice ${S.pi + 1} of 2`;
  let h = `<div class="top"><span class="pill ${main || pl ? "" : "scenic"}">${esc(label)}</span>${dots}</div>`;
  if (main && AUTH && ONLINE && !S.answered && q.type !== "fix") { const el = (performance.now() - S.qStart[S.qi]) / 1000; h += `<div class="tide"><span class="foot">Tide · speed bonus</span><div class="timer"><span style="animation-delay:-${el.toFixed(2)}s"></span></div></div>`; }
  h += questionBody(q) + `<p class="err" id="err"></p>`;
  if (S.hint && main && !S.answered) h += `<div class="fb tip"><h3>Coach's tip</h3><p>${esc(L.l)}</p></div>`;
  if (S.answered) {
    const ok = check(q, S.sel);
    let body = "";
    if (q.type === "fix") {
      const issues = ok ? [] : fixIssues(q, S.sel);
      body = `${issues.length ? `<ul class="issues">${issues.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}<p><b>One strong rewrite:</b> ${esc(q.model)}</p><p>${esc(q.e)}</p>`;
    } else {
      body = `<p>${ok ? "" : `The answer: ${esc(answerText(q))}. `}${esc(q.e)}</p>`;
      if (q.type === "mc" && q.w) {
        const why = k => q.w[k] ? `<li><b>“${esc(q.o[k])}”:</b> ${esc(q.w[k])}</li>` : "";
        if (!ok && q.w[S.sel]) body += `<p class="whynot"><b>Why not “${esc(q.o[S.sel])}”:</b> ${esc(q.w[S.sel])}</p>`;
        const others = [0, 1, 2, 3].filter(k => k !== q.a && (ok || k !== S.sel) && q.w[k]);
        if (others.length) body += `<details class="why"><summary>Why the ${ok ? "other answers are" : "remaining answers are"} wrong</summary><ul>${others.map(why).join("")}</ul></details>`;
      }
    }
    h += `<div class="fb ${ok ? "ok" : "bad"}"><h3>${ok ? rand(PRAISE) : rand(MISS)}${ok && main && U.streak >= 3 ? ` ${U.streak} in a row.` : ""}</h3>${body}</div>`;
    if (set && S.set.kind === "daily") h += `<p class="foot dpct">${esc(dailyPct(q.id, S.set.i))}</p>`;
    h += `<div class="report"><button class="link small" id="rep">Something wrong with this question? Report it</button><div id="repBox"></div></div>`;
    if (main && !ok) h += `<div class="fb tip"><h3>Scenic route ahead</h3><p>A short lesson and two practice questions, then back to the climb. This question also goes into your review queue.</p></div>`;
  }
  h += `<div class="row">`;
  if (!S.answered) { h += `<button class="btn" id="go">Check answer</button>`; if (main) h += `<button class="btn ghost" id="hint">${S.hint ? "Hide tip" : "Coach's tip"}</button>`; }
  else {
    const ok = check(q, S.sel);
    if (pl) h += `<button class="btn" id="go">${S.qi < 4 ? "Next question" : "See my starting level"}</button>`;
    else if (set) h += `<button class="btn" id="go">${S.set.i < S.set.ids.length - 1 ? "Next question" : "Finish"}</button>`;
    else if (main) h += ok ? `<button class="btn" id="go">${S.qi < 4 ? "Next question" : "See results"}</button>` : `<button class="btn brass" id="go">Take the scenic route</button><button class="btn ghost" id="skipd">Skip it</button>`;
    else h += `<button class="btn" id="go">${S.pi < 1 ? "Next practice" : "Back to the climb"}</button>`;
  }
  h += "</div>";
  c.innerHTML = h;
  $("go").onclick = act;
  if ($("hint")) $("hint").onclick = () => { S.hint = !S.hint; render(); };
  if ($("skipd")) $("skipd").onclick = back;
  if ($("ans") && !S.answered) { $("ans").oninput = e => { S.typed = e.target.value; $("err").textContent = ""; }; $("ans").onkeydown = e => { if (e.key === "Enter" && (q.type !== "fix" || e.ctrlKey || e.metaKey)) { e.preventDefault(); act(); } }; $("ans").focus(); }
  if ($("rep")) $("rep").onclick = () => openReport(q);
  else $("go").focus();
}
function pick(o) { if (S.answered) return; S.sel = o; render(); }
function act() {
  const q = curQ(), main = S.mode === "q", pl = S.mode === "place", set = S.mode === "set";
  if (!S.answered) {
    if (q.type === "type" || q.type === "fix") { if (!S.typed.trim()) { $("err").textContent = q.type === "fix" ? "Write your rewrite first." : "Type an answer first."; return; } S.sel = S.typed.trim(); }
    else if (S.sel === null) { $("err").textContent = q.type === "tap" ? "Tap a word first." : "Pick an answer first."; return; }
    S.answered = true; S.hint = false;
    const ok = check(q, S.sel);
    U.total++; if (ok) U.right++; skillHit(q, ok);
    if (!main) queueStat(q.id, ok);
    if (pl) { S.pres[S.qi] = ok; if (ok) gain(5); else shake(); }
    else if (set) { S.set.res[S.set.i] = ok; if (S.set.kind === "review" || (S.set.kind === "tide" && U.review[q.id])) reviewResult(q.id, ok); if (ok) gain(5); else { shake(); if (S.set.kind === "tide" && !U.review[q.id]) addReview(q.id); } }
    else if (main) {
      S.res[S.qi] = ok;
      if (ok) { U.streak++; gain(10 + (U.streak >= 3 ? 5 : 0)); } else { U.streak = 0; addReview(q.id); shake(); }
      const i = S.qi, resp = S.sel;
      (S.served[i] || Promise.resolve(null)).then(id => id ? api("/round/answer", { ...AUTH, roundId: id, i, response: resp }) : null).then(r => {
        if (!r) return; PTS = { week: r.weekPts, all: r.allPts }; S.roundPts = r.roundPts;
        if (r.points + r.bonus > 0) floatUp(`+${r.points + r.bonus} pts`, "pts");
        stats(); if ($("rpts")) $("rpts").textContent = `${r.roundPts} leaderboard points this round`;
      }).catch(() => {});
    } else { if (ok) gain(3); else shake(); }
    save(); render(); return;
  }
  if (pl) { if (S.qi < 4) { S.qi++; fresh(); } else S.mode = "placed"; render(); return; }
  if (set) { if (S.set.i < S.set.ids.length - 1) { S.set.i++; fresh(); } else if (S.set.kind === "daily") { finishDaily(); return; } else { S.mode = "setdone"; if (S.set.kind === "tide" && U.tide !== today()) { U.tide = today(); gain(15); } markDay(); save(); } render(); return; }
  if (main) { if (check(q, S.sel)) advance(); else { S.prac = draw(S.lvl, 2, S.round); save(); S.mode = "lesson"; render(); } return; }
  if (S.pi < 1) { S.pi++; fresh(); render(); } else back();
}
function back() { S.mode = "q"; advance(); }
function advance() {
  if (S.qi < 4) { S.qi++; fresh(); render(); return; }
  S.mode = "done"; const sc = S.res.filter(Boolean).length;
  if (U.best[S.lvl] == null || sc > U.best[S.lvl]) U.best[S.lvl] = sc;
  if (sc >= 4) gain(25);
  markDay(); save(); render();
}
function done() {
  const L = LV[S.lvl], sc = S.res.filter(Boolean).length, pass = sc >= 4, nx = S.lvl + 1 < LV.length;
  const missed = S.round.map((id, i) => S.res[i] ? null : BYID[id].p).filter(Boolean);
  $("card").innerHTML = `<div class="top"><span class="pill">Level ${S.lvl + 1} · ${PLACES[S.lvl]} · ${esc(L.t)}</span></div><p class="big">${sc} / 5</p>${AUTH && ONLINE ? `<p class="lead" id="rpts">${S.roundPts ? S.roundPts + " leaderboard points this round" : "Tallying points…"}</p>` : ""}
  <div class="fb ${pass ? "ok" : "tip"}"><h3>${pass ? (nx ? "Level cleared. The next rung is open." : "You reached the summit.") : "So close. Four correct clears the level."}</h3><p>${pass ? `+25 XP bonus. You earned the ${PLACES[S.lvl].replace("The ", "")} badge.` : "Run it again for a fresh mix of questions."}${missed.length ? " Your misses are saved to your review queue." : ""}</p></div>
  ${missed.length ? `<div class="fb lesson"><h3>Worth another look</h3><p>${missed.map(esc).join("<br>")}</p></div>` : ""}
  <div class="row">${pass && nx ? `<button class="btn" id="go">Climb to ${PLACES[S.lvl + 1]}</button>` : ""}<button class="btn ${pass && nx ? "ghost" : ""}" id="again">Retry Level ${S.lvl + 1}</button><button class="btn ghost" id="hm">Home</button><button class="btn ghost" id="rate">Rate Proseidon</button></div>`;
  if ($("go")) $("go").onclick = () => start(S.lvl + 1);
  $("again").onclick = () => start(S.lvl); $("hm").onclick = home; $("rate").onclick = openFb;
  ($("go") || $("again")).focus();
}
function setDone() {
  const st = S.set, sc = st.res.filter(Boolean).length;
  $("card").innerHTML = `<span class="pill scenic">${esc(st.title)}</span><p class="big">${sc} / ${st.ids.length}</p><p class="lead">${st.kind === "tide" ? (d5Today() ? "That's today. Your Tide and the Daily Five are both done. +15 XP bonus. See you tomorrow." : "Today's Tide is done. +15 XP bonus. The Daily Five is still waiting.") : st.kind === "review" ? (st.early ? "Early practice doesn't change your review schedule. Due questions count." : `${savedIds().length} question${savedIds().length === 1 ? "" : "s"} left in your review queue.`) : "Drills sharpen one skill at a time. Check your weak spots to see if it moved."}</p><div class="row"><button class="btn" id="hm">Back to home</button><button class="btn ghost" id="ws">See weak spots</button></div>`;
  $("hm").onclick = home; $("ws").onclick = () => { S.mode = "weak"; render(); }; $("hm").focus();
}


/* ---------- V5: Daily Tide, reports, stats, admin ---------- */
/* ---------- Daily Five ---------- */
function d5Today() { return U.d5 && U.d5.date === today() ? U.d5 : null; }
function squares(res) { return res.map(x => x ? "🟩" : "🟥").join(""); }
function startDaily() {
  if (d5Today()) { S.mode = "d5done"; S.d5day = S.d5day || null; render(); loadDaily(); return; }
  S.set = { kind: "daily", title: "Daily Five", ids: dailyIds(today()), i: 0, res: [], t0: Date.now() };
  S.dstats = null; loadDaily(); S.mode = "set"; fresh(); render();
}
function loadDaily() {
  if (!ONLINE) return;
  api("/daily/stats", { date: today() }).then(r => { S.dstats = r; S.d5day = r.day; if (S.mode === "d5done") render(); }).catch(() => {});
}
function dailyPct(qid, k) {
  const st = S.dstats; if (!st) return "";
  if (st.day && st.day.n >= 3) return `${Math.round(100 * st.day.right[k] / st.day.n)}% of today's players got this one right.`;
  const a = st.all && st.all[qid]; if (a && a.n >= 5) return `${Math.round(100 * a.right / a.n)}% of players have gotten this one right.`;
  return "You're one of the first to answer this one today.";
}
function finishDaily() {
  const res = S.set.res.map(Boolean), ms = Date.now() - S.set.t0;
  U.d5 = { date: today(), res, ms }; gain(10); markDay(); save();
  S.mode = "d5done"; render();
  if (ONLINE && AUTH) api("/daily/submit", { ...AUTH, date: U.d5.date, res, ms }).then(r => { S.d5day = r.day; if (S.mode === "d5done") render(); }).catch(() => {});
}
const mmss = ms => { const t = Math.round(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
function shareText(d) { return `Proseidon Daily Five ${d.date}\n${squares(d.res)}  ${d.res.filter(Boolean).length}/5 · ${mmss(d.ms)}\n${location.origin}`; }
function dailyDone() {
  const d = d5Today(); if (!d) return home();
  const sc = d.res.filter(Boolean).length, day = S.d5day;
  let beat = "";
  if (day && day.n >= 3) { const atOrBelow = day.dist.slice(0, sc + 1).reduce((a, b) => a + b, 0); beat = `You scored as well as or better than ${Math.round(100 * atOrBelow / day.n)}% of today's ${day.n} players.`; }
  const tideDone = U.tide === today();
  $("card").innerHTML = `<span class="pill scenic">Daily Five · ${esc(d.date)}</span><p class="big">${sc} / 5</p><p class="lead" style="font-size:28px;letter-spacing:4px">${squares(d.res)}</p><p class="lead">Time ${mmss(d.ms)}.${beat ? " " + beat : ""}</p>
  <div class="fb ${tideDone ? "ok" : "tip"}"><h3>${tideDone ? "That's today." : "Daily Five done."}</h3><p>${tideDone ? "Your Daily Five and Tide are both done. A new Daily Five arrives tomorrow." : "Your Tide is still open: five questions picked for you."}</p></div>
  <div class="row"><button class="btn brass" id="share">Share result</button>${tideDone ? "" : `<button class="btn" id="tide">Start today's Tide</button>`}<button class="btn ghost" id="hm">Back to home</button></div><p class="foot" id="shareMsg"></p>`;
  $("share").onclick = async () => {
    const t = shareText(d);
    try { if (navigator.share) { await navigator.share({ text: t }); return; } await navigator.clipboard.writeText(t); $("shareMsg").textContent = "Copied. Paste it anywhere. It doesn't give away the answers."; }
    catch (e) { $("shareMsg").textContent = t; }
  };
  if ($("tide")) $("tide").onclick = startTide;
  $("hm").onclick = home; $("share").focus();
}
function startTide() {
  const due = dueIds().slice(0, 3);
  const fill = draw(S.lvl, 5 - due.length, due);
  S.set = { kind: "tide", title: "Today's Tide", ids: shuffle(due.concat(fill)), i: 0, res: [] };
  S.mode = "set"; fresh(); save(); render();
}
let statQueue = [], statTimer = null;
function queueStat(qid, ok) {
  if (!ONLINE) return;
  statQueue.push({ qid, ok }); clearTimeout(statTimer);
  statTimer = setTimeout(() => { const items = statQueue.splice(0, 10); if (items.length) api("/stat", { items }).catch(() => {}); }, 1200);
}
function openReport(q) {
  const box = $("repBox"); if (!box) return;
  box.innerHTML = `<div class="field" style="max-width:none;margin-top:8px"><label class="lbl" for="repText">What looks wrong? (optional)</label><textarea id="repText" class="inp" rows="2" maxlength="600" placeholder="I think the second answer is also correct."></textarea></div><div class="row" style="margin-top:8px"><button class="btn small" id="repSend">Send report</button><button class="btn ghost small" id="repCancel">Cancel</button></div><p class="err" id="repErr"></p>`;
  $("repCancel").onclick = () => { box.innerHTML = ""; };
  $("repSend").onclick = async () => {
    if (!ONLINE) { $("repErr").textContent = "Reports need the online version of Proseidon."; return; }
    try { await api("/report", { qid: q.id, note: $("repText").value.trim(), user: U ? U.name : "", answer: S.sel }); box.innerHTML = `<p class="foot">Thanks. Your report was sent with this question attached.</p>`; }
    catch (e) { $("repErr").textContent = "Your report couldn't be sent. Try again."; }
  };
  $("repText").focus();
}

/* ---------- feedback ---------- */
let stars = 0;
function openFb() {
  const p = $("fbpanel"); p.hidden = false; stars = 0;
  p.innerHTML = `<h3>Rate Proseidon</h3><p class="foot">Optional. Tell us what's working and what isn't.</p><div class="stars" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map(n => `<button class="star" role="radio" aria-checked="false" aria-label="${n} star${n > 1 ? "s" : ""}" data-n="${n}">★</button>`).join("")}</div><div class="field" style="max-width:none"><label class="lbl" for="fbtext">Comments (optional)</label><textarea id="fbtext" class="inp" rows="3" maxlength="1000" placeholder="The scenic route helped me with semicolons."></textarea></div><p class="err" id="fberr"></p><div class="row"><button class="btn" id="fbsend">Send feedback</button><button class="btn ghost" id="fbclose">Close</button></div>`;
  p.querySelectorAll(".star").forEach(b => b.onclick = () => { stars = +b.dataset.n; p.querySelectorAll(".star").forEach(x => { x.classList.toggle("on", +x.dataset.n <= stars); x.setAttribute("aria-checked", String(+x.dataset.n === stars)); }); $("fberr").textContent = ""; });
  $("fbclose").onclick = () => { p.hidden = true; }; $("fbsend").onclick = sendFb;
  if (p.scrollIntoView) p.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
async function sendFb() {
  const txt = $("fbtext").value.trim();
  if (!stars && !txt) { $("fberr").textContent = "Add a rating or a comment first."; return; }
  $("fbsend").textContent = "Sending…";
  try { await api("/feedback", { rating: stars, comments: txt, user: U ? U.name : "", level: S.lvl + 1 }); $("fbpanel").innerHTML = `<h3>Thanks for the feedback.</h3><p class="foot">It helps make Proseidon better.</p>`; }
  catch (e) { $("fbsend").textContent = "Send feedback"; $("fberr").textContent = ONLINE ? "Your feedback couldn't be sent. Check your connection and try again." : "Feedback needs the online version of Proseidon."; }
}
async function inboxView() {
  const tab = S.inboxTab || "feedback";
  const head = `<span class="pill">Admin · only you can see this</span><div class="tabs" role="tablist">${[["feedback", "Feedback"], ["reports", "Question reports"], ["health", "Question health"]].map(([k, l]) => `<button role="tab" class="tab ${tab === k ? "on" : ""}" aria-selected="${tab === k}" data-itab="${k}">${l}</button>`).join("")}</div>`;
  const wire = () => { document.querySelectorAll("[data-itab]").forEach(b => b.onclick = () => { S.inboxTab = b.dataset.itab; render(); }); if ($("hm")) $("hm").onclick = home; };
  const back = `<div class="row"><button class="btn ghost" id="hm">Back to home</button></div>`;
  $("card").innerHTML = head + `<p class="foot">Loading…</p>`; wire();
  try {
    if (tab === "health") {
      const r = await api("/admin/health", { ...AUTH });
      if (S.mode !== "inbox" || (S.inboxTab || "feedback") !== "health") return;
      const rows = r.rows.map(x => { const q = BYID[x.qid]; const pct = Math.round(100 * x.miss / x.n); return `<tr><td class="num">${pct}%</td><td class="num">${x.n}</td><td>L${q.lvl + 1}</td><td>${esc(q.p.length > 90 ? q.p.slice(0, 88) + "…" : q.p)}<br><span class="foot">Answer: ${esc(answerText(q))}</span></td></tr>`; }).join("");
      $("card").innerHTML = head + `<p class="lead">${r.total.toLocaleString()} answers across ${r.questions} questions. Questions most players miss are listed first. A very high miss rate can mean unclear wording or a wrong answer key.</p>` + (r.rows.length ? `<div class="tblwrap"><table class="lb"><thead><tr><th class="num">Missed</th><th class="num">Tries</th><th>Level</th><th>Question</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="lead">No answers recorded yet.</p>`) + back;
    } else {
      const r = await api("/feedback/list", { ...AUTH });
      if (S.mode !== "inbox" || (S.inboxTab || "feedback") !== tab) return;
      if (tab === "reports") {
        const items = r.items.filter(x => x.kind === "report");
        $("card").innerHTML = head + `<p class="prompt">${items.length} report${items.length === 1 ? "" : "s"}</p>` + (items.length ? `<div class="skills">${items.map(x => { const q = BYID[x.qid]; let theirs = ""; if (q && x.answer !== "" && x.answer != null) theirs = q.type === "mc" ? q.o[+x.answer] : q.type === "tap" ? q.s[+x.answer] : x.answer; return `<div class="skill"><div class="sk-top"><span><b>Level ${q ? q.lvl + 1 : "?"}</b> <span class="foot">${esc(x.username || "anonymous")} · ${new Date(x.at).toLocaleString()}</span></span><span class="foot">${esc(x.qid)}</span></div><p style="margin:0">${esc(q ? q.p : "(question removed)")}</p><p class="foot" style="margin:0">Answer key: ${q ? esc(answerText(q)) : "?"}${theirs ? ` · They answered: ${esc(theirs)}` : ""}</p>${x.note ? `<p style="margin:0"><b>Note:</b> ${esc(x.note)}</p>` : ""}</div>`; }).join("")}</div>` : `<p class="lead">No question reports yet.</p>`) + back;
      } else {
        const items = r.items.filter(x => x.kind !== "report");
        const rated = items.filter(x => x.rating);
        const avg = rated.length ? rated.reduce((a, x) => a + x.rating, 0) / rated.length : 0;
        $("card").innerHTML = head + `<p class="prompt">${items.length} response${items.length === 1 ? "" : "s"}${avg ? ` · average ${avg.toFixed(1)} stars` : ""}</p>` +
          (items.length ? `<div class="skills">${items.map(x => `<div class="skill"><div class="sk-top"><span><b>${x.rating ? "★".repeat(x.rating) + "☆".repeat(5 - x.rating) : "No rating"}</b> <span class="foot">${esc(x.username || "anonymous")}${x.level ? ` · Level ${x.level}` : ""}</span></span><span class="foot">${new Date(x.at).toLocaleString()}</span></div>${x.comments ? `<p style="margin:0">${esc(x.comments)}</p>` : ""}</div>`).join("")}</div>` : `<p class="lead">No feedback yet.</p>`) + back;
      }
    }
  } catch (e) { $("card").innerHTML = head + `<p class="err">${esc(e.message)}</p>` + back; }
  wire();
}

/* ---------- wiring ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-pick],[data-lv]"); if (!b) return;
  if (b.dataset.pick != null) pick(+b.dataset.pick);
  else if (b.dataset.lv != null && U) start(+b.dataset.lv);
});
document.addEventListener("keydown", e => {
  if (!["q", "prac", "place", "set"].includes(S.mode) || S.answered) return;
  if (e.target && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
  const q = curQ(); if (q.type !== "mc") return;
  if (["1", "2", "3", "4"].includes(e.key)) pick(S.order[+e.key - 1]);
});
document.querySelectorAll("#tiles .tile").forEach(t => t.onclick = () => {
  if (!U) return; const v = t.dataset.view;
  if (v === "home") home(); else if (v === "review") startReview(); else { S.mode = v; render(); }
});
$("rateT").onclick = openFb; $("retake").onclick = startPlace; $("inboxT").onclick = () => { if (ADMIN) { S.mode = "inbox"; render(); } };
$("reset").onclick = () => {
  $("confirm").innerHTML = `<span class="foot">This clears ${esc(U.name)}'s level, XP, review queue, and skills. Leaderboard points stay.</span> <button class="btn small brass" id="yes">Yes, reset</button> <button class="btn ghost small" id="no">Cancel</button>`;
  $("no").onclick = () => { $("confirm").innerHTML = ""; };
  $("yes").onclick = () => { const p = blank(U.name); p.updatedAt = Date.now(); DB.users[DB.current].profile = p; U = p; S.lvl = 0; $("confirm").innerHTML = ""; save(); S.mode = "intro"; render(); };
};

(async function boot() {
  render();
  try { await api("/health"); ONLINE = true; } catch (e) { ONLINE = false; }
  const k = DB.current, rec = k && DB.users[k];
  if (rec) {
    if (ONLINE && rec.token) { try { return enter(k, await api("/login", { user: rec.profile.name, token: rec.token }), false); } catch (e) { S.mode = "welcome"; tag(); render(); return welcome(rec.profile.name); } }
    if (!ONLINE) return enter(k, { name: rec.profile.name, profile: rec.profile }, false);
  }
  S.mode = "welcome"; tag(); render();
})();
