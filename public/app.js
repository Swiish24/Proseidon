import { LV, BYID, ARENA, PLACE_LV, PLACES, check, answerText, rankFor, fixIssues, dailyIds, orderText, streakMult, TIPS } from "./bank.js";

const PRAISE = ["Smooth sailing.", "The trident strikes true.", "Right on target.", "Clean as a fresh page.", "Spot on.", "Calm seas ahead."];
const MISS = ["Choppy waters.", "The tide turned on that one.", "Not this time.", "Close, but no pearl."];
const ONB = ["welcome", "intro", "place", "placed", "loading", "forgot", "reccode"];
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

function blank(name) { return { name, lvl: 0, xp: 0, best: {}, right: 0, total: 0, streak: 0, placed: false, seen: {}, last: {}, review: {}, skills: {}, daily: { streak: 0, last: null, freezes: 1, fweek: null }, arena: {}, tide: null, d5: null, tokens: {}, hist: {}, pb: {}, updatedAt: 0 }; }
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
  const all = LV[l].q.filter(q => !q.scenic && !q.myth).map(q => q.id).filter(id => !avoid.includes(id));
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
function skillHit(q, ok) { const k = q.lvl + "|" + q.tag; const s = U.skills[k] || (U.skills[k] = { r: 0, t: 0 }); s.t++; if (ok) s.r++; const hh = (U.hist || (U.hist = {}))[k] || (U.hist[k] = []); hh.push(ok ? 1 : 0); if (hh.length > 12) hh.shift(); const w = U.weeks || (U.weeks = {}), wk = w[weekKey()] || (w[weekKey()] = { r: 0, t: 0 }); wk.t++; if (ok) wk.r++; const ks = Object.keys(w).sort(); if (ks.length > 8) delete w[ks[0]]; }
const STEPS = [1, 3, 7, 21, 60];
function addReview(id, conf) { const r = U.review[id]; if (r) { r.step = 0; r.due = Date.now() + DAY; if (conf) r.conf = true; return; } U.review[id] = { due: Date.now() + DAY, step: 0, ...(conf ? { conf: true } : {}) }; }
// Reviews come back after 1, 3, 7, 21, then 60 days. A miss starts the ladder over.
function reviewResult(id, ok) { const r = U.review[id]; if (!r || r.due > Date.now()) return; if (r.step == null) r.step = r.wins || 0; if (ok) { r.step++; if (r.step >= STEPS.length) delete U.review[id]; else r.due = Date.now() + STEPS[r.step] * DAY; } else { r.step = 0; r.due = Date.now() + DAY; } }
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
  if (isGuest()) { t.innerHTML = `Playing as a <b>guest</b> · <button class="link" id="sw">Sign in or create an account</button>`; }
  else t.innerHTML = `${back ? "Welcome back, " : "Playing as "}<b>${esc(U.name)}</b>${AUTH && ONLINE ? ` · ${rankFor(PTS.all).name}` : ` <span class="off">offline</span>`} · <button class="link" id="sw">Switch player</button>`;
  $("sw").onclick = () => { if (!isGuest()) DB.current = null; U = null; AUTH = null; ADMIN = false; $("inboxT").hidden = true; persist(); S.mode = "welcome"; tag(); render(); };
}
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.remove("show"); void t.offsetWidth; t.classList.add("show"); }
function floatUp(text, cls) { const c = $("card"); requestAnimationFrame(() => { const x = document.createElement("div"); x.className = "xp " + (cls || ""); x.textContent = text; c.appendChild(x); setTimeout(() => x.remove(), 1200); }); }
function gain(n) { U.xp += n; stats(); floatUp("+" + n + " XP"); const c = $("card"); const r = document.createElement("div"); r.className = "ripple"; r.style.left = "50%"; r.style.top = "60%"; c.appendChild(r); setTimeout(() => r.remove(), 900); }
function shake() { const c = $("card"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); }
function fresh() { S.sel = null; S.typed = ""; S.answered = false; S.sure = null; S.order = shuffle([0, 1, 2, 3]); S.stateFor = null; }
// Set up answer state for tile, multi-tap, and matching questions the first time each one shows.
function initState(q) { if (S.stateFor === q.id || S.answered) return; S.stateFor = q.id; S.tileOrder = q.tiles ? shuffle(q.tiles.map((_, i) => i)) : []; S.defOrder = q.pairs ? shuffle(q.pairs.map((_, i) => i)) : []; S.sel = ["order", "multi"].includes(q.type) ? [] : q.type === "match" ? q.pairs.map(() => null) : null; }

/* ---------- account screens ---------- */
// Guests can play everything on this device. An account adds cross-device saving and the leaderboard.
const GUEST = "~guest";
const isGuest = () => DB.current === GUEST;
function guestId() { if (!DB.guestId) { DB.guestId = "g" + Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, "0")).join(""); persist(); } return DB.guestId; }
function enterGuest(then) {
  if (!DB.users[GUEST]) DB.users[GUEST] = { profile: blank("Guest"), token: null };
  const p = fill(DB.users[GUEST].profile); DB.current = GUEST; U = p; AUTH = null; ADMIN = false; PTS = { week: 0, all: 0 }; $("inboxT").hidden = true;
  refreshDaily(); S.lvl = U.lvl || 0; persist(); tag();
  if (then) then(); else if (U.placed) home(); else { S.mode = "intro"; render(); }
}
// When a guest creates an account, their progress comes with them.
function carryGuest(k, name) { const g = DB.users[GUEST]; if (isGuest() && g && !DB.users[k]) { DB.users[k] = { profile: { ...g.profile, name, updatedAt: Date.now() }, token: null }; delete DB.users[GUEST]; } }
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
  if (res.recovery) { S.recovery = res.recovery; S.recNext = U.placed ? "home" : "intro"; S.mode = "reccode"; return render(); }
  if (U.placed) home(); else { S.mode = "intro"; render(); }
}
function welcome(prefill) {
  const others = Object.keys(DB.users).filter(k => k !== GUEST);
  $("card").innerHTML = `<p class="big">Welcome aboard.</p><p class="lead">Proseidon is a game for sharper English. Climb ten levels, from parts of speech to PhD-level rhetoric, and compete on the leaderboard.</p>
  <p class="foot"><b>Create a free account</b> to save your progress on any device, earn Olympian tokens, and climb the leaderboard. Already have one? Sign in below.</p>
  <div class="row" style="align-items:flex-start"><div class="field"><label for="nm" class="lbl">Username</label><input id="nm" class="inp" maxlength="20" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="wordsmith.42" aria-describedby="nmHelp nmErr" value="${esc(prefill || "")}"><span class="foot" id="nmHelp">Letters, numbers, periods, hyphens, or underscores</span><p class="err" id="nmErr" role="alert"></p></div>
  ${ONLINE ? `<div class="field" style="max-width:160px"><label for="pin" class="lbl">4-digit PIN</label><input id="pin" class="inp" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="current-password" placeholder="••••" aria-describedby="pinErr"><p class="err" id="pinErr" role="alert"></p></div>` : ""}</div>
  ${ONLINE ? `<p class="foot"><button class="link small" id="forgot">Forgot your PIN?</button></p>` : ""}
  <p class="err" id="err" role="alert"></p><div id="confirmNew"></div>
  <div class="row"><button class="btn" id="go">Sign in or sign up</button></div>
  <div class="guestbox2"><span class="lbl">Just want to try it first?</span><div class="row"><button class="btn ghost small" id="gD5">Play today's Daily Five</button><button class="btn ghost small" id="gTide">Today's Tide</button><button class="btn ghost small" id="gGo">Continue as a guest</button></div><span class="foot">Guest progress saves on this device and moves into your account when you make one.</span></div>
  ${others.length ? `<div class="field" style="max-width:none"><span class="lbl">Players on this device</span><div class="row">${others.map(k => `<button class="btn ghost small" data-k="${esc(k)}">${esc(DB.users[k].profile.name)}</button>`).join("")}</div></div>` : ""}
  <p class="foot">${ONLINE ? "New here? Pick a username and PIN. Returning? Enter yours to pick up on any device." : "Offline mode: progress saves in this browser only, and scores won't post to the leaderboard."}</p>`;
  const clearErrs = () => { ["err", "nmErr", "pinErr"].forEach(id => { if ($(id)) $(id).textContent = ""; }); ["nm", "pin"].forEach(id => { if ($(id)) $(id).classList.remove("wrong"); }); };
  const err = (m, field) => { clearErrs(); const box = field && $(field + "Err") ? field + "Err" : "err"; $(box).textContent = m; if (field && $(field)) { $(field).classList.add("wrong"); $(field).focus(); } };
  const go = async () => {
    const v = $("nm").value.trim(); const k = v.toLowerCase();
    if (v.length < 3 || v.length > 20) return err("Usernames are 3 to 20 characters long.", "nm");
    if (/[^A-Za-z0-9_.-]/.test(v)) { const bad = [...new Set(v.match(/[^A-Za-z0-9_.-]/g))].map(c => c === " " ? "spaces" : `“${c}”`).join(", "); return err(`Usernames can't include ${bad}. Use letters, numbers, periods, hyphens, or underscores.`, "nm"); }
    if (!/^[A-Za-z0-9].*[A-Za-z0-9]$/.test(v)) return err("Start and end your username with a letter or number.", "nm");
    if (!ONLINE) { carryGuest(k, v); if (!DB.users[k]) DB.users[k] = { profile: blank(v), token: null }; return enter(k, { name: DB.users[k].profile.name, profile: DB.users[k].profile }, !DB.users[k].profile.placed); }
    const pin = $("pin").value.trim();
    if (!/^\d{4}$/.test(pin)) return err("Your PIN must be exactly 4 numbers.", "pin");
    $("go").textContent = "Checking…";
    try { enter(k, await api("/login", { user: v, pin }), false); }
    catch (e) {
      $("go").textContent = "Sign in or sign up";
      if (e.status === 404) {
        err("");
        $("confirmNew").innerHTML = `<div class="fb tip"><h3>New player?</h3><p>No one has the username “${esc(v)}” yet. Create it with this PIN? Remember your PIN. You'll need it on other devices.</p><div class="row" style="margin-top:8px"><button class="btn brass" id="mk">Create player</button></div></div>`;
        $("mk").onclick = async () => { try { const res = await api("/register", { user: v, pin }); carryGuest(k, res.name); enter(k, res, !(DB.users[k] && DB.users[k].profile.placed)); } catch (e2) { err(e2.message); } };
        $("mk").focus();
      } else err(e.message, e.status === 401 ? "pin" : e.status === 400 ? "nm" : null);
    }
  };
  $("go").onclick = go;
  if ($("forgot")) $("forgot").onclick = () => { S.forgotName = $("nm").value.trim(); S.mode = "forgot"; render(); };
  $("gD5").onclick = () => enterGuest(startDaily);
  $("gTide").onclick = () => enterGuest(startTide);
  $("gGo").onclick = () => enterGuest();
  ["nm", "pin"].forEach(id => { if ($(id)) { $(id).onkeydown = e => { if (e.key === "Enter") go(); }; $(id).oninput = () => { clearErrs(); $("confirmNew").innerHTML = ""; }; } });
  document.querySelectorAll("[data-k]").forEach(b => b.onclick = async () => {
    const rec = DB.users[b.dataset.k];
    if (ONLINE && rec.token) { try { return enter(b.dataset.k, await api("/login", { user: rec.profile.name, token: rec.token }), false); } catch (e) {} }
    if (!ONLINE) return enter(b.dataset.k, { name: rec.profile.name, profile: rec.profile }, false);
    $("nm").value = rec.profile.name; err("Enter your PIN to continue.", "pin");
  });
  // Only jump to the sign-in fields for returning players, so phones show the no-account options first.
  if (prefill) ($("pin") || $("nm")).focus();
}
const GOALS = [["work", "Work writing"], ["school", "School"], ["personal", "Personal growth"]];
function wireGoals(again) { document.querySelectorAll("[data-goal]").forEach(b => b.onclick = () => { U.goal = U.goal === b.dataset.goal ? null : b.dataset.goal; save(); again(); }); }
const CONTEXT = { work: /\b(reports?|clients?|managers?|memos?|meetings?|deadlines?|teams?|office|emails?|reps?|audits?|vendors?|polic(y|ies)|invoices?|slides|board|analysts?|budgets?|launch|files?|CEO)\b/i, school: /\b(class|teachers?|essays?|homework|exams?|tests?|students?|school|professors?|papers?|lectures?|grades?)\b/i };
// Prefer questions that match the player's goal, when there are enough to choose from.
function byGoal(ids, n) { const re = U.goal && CONTEXT[U.goal]; if (!re) return ids.slice(0, n); const txt = id => { const q = BYID[id]; return [q.p, ...(q.o || []), ...(q.s || [])].join(" "); }; return ids.slice().sort((a, b) => re.test(txt(b)) - re.test(txt(a))).slice(0, n); }
function recView() {
  $("card").innerHTML = `<span class="pill">Save your recovery code</span><p class="prompt">If you ever forget your PIN, this code resets it.</p>
  <div class="reccode" id="rc">${esc(S.recovery)}</div>
  <p class="foot">Write it down or save it somewhere safe. It's shown only once. You can get a new one later in Settings.</p>
  <div class="row"><button class="btn ghost" id="cp">Copy code</button><button class="btn" id="go">I saved it</button></div><p class="foot" id="cpMsg"></p>`;
  $("cp").onclick = async () => { try { await navigator.clipboard.writeText(S.recovery); $("cpMsg").textContent = "Copied."; } catch (e) { $("cpMsg").textContent = "Select the code above and copy it."; } };
  $("go").onclick = () => { S.recovery = null; if (S.recNext === "intro") { S.mode = "intro"; render(); } else home(); };
}
function forgotView(name) {
  $("card").innerHTML = `<span class="pill">Forgot your PIN?</span><p class="prompt">Reset it with your recovery code.</p>
  <div class="field"><label class="lbl" for="fn">Username</label><input id="fn" class="inp" autocomplete="username" autocapitalize="off" value="${esc(name || "")}"></div>
  <div class="field"><label class="lbl" for="fc">Recovery code</label><input id="fc" class="inp" autocapitalize="characters" placeholder="ABCDE-23456"></div>
  <div class="field" style="max-width:160px"><label class="lbl" for="fp">New 4-digit PIN</label><input id="fp" class="inp" type="password" inputmode="numeric" maxlength="4" autocomplete="new-password"></div>
  <p class="err" id="ferr" role="alert"></p>
  <div class="row"><button class="btn" id="fgo">Reset my PIN</button><button class="btn ghost" id="fback">Back</button></div>
  <details class="more"><summary>No recovery code?</summary><p class="foot">Send a request and the game's admin can reset your PIN. Include a way to reach you, like a coworker's name or your email.</p><textarea id="fnote" class="inp" rows="2" maxlength="400" placeholder="How can we reach you?"></textarea><div class="row"><button class="btn ghost" id="fhelp">Send request</button></div><p class="foot" id="fhmsg"></p></details>`;
  $("fback").onclick = () => { S.mode = "welcome"; render(); };
  $("fgo").onclick = async () => {
    const user = $("fn").value.trim(), code = $("fc").value.trim(), newPin = $("fp").value.trim();
    if (!/^\d{4}$/.test(newPin)) { $("ferr").textContent = "Your new PIN must be exactly 4 numbers."; return; }
    try { const r = await api("/pin/reset", { user, code, newPin }); carryGuest(user.toLowerCase(), r.name); enter(user.toLowerCase(), r, false); } catch (e) { $("ferr").textContent = e.message; }
  };
  $("fhelp").onclick = async () => { const user = $("fn").value.trim(); try { await api("/pin/help", { user, note: $("fnote").value.trim() }); $("fhmsg").textContent = "Request sent. The admin will reset your PIN and get it to you."; } catch (e) { $("fhmsg").textContent = e.message; } };
  $("fn").focus();
}
function intro() {
  const steps = [["1", "Quick assessment", "Five questions set your starting level."], ["2", "Climb", isGuest() ? "Clear a level with 4 of 5 right." : "Clear a level with 4 of 5 right. Right answers earn leaderboard points."], ["3", "Learn from misses", "Each miss opens a short lesson and comes back later for review."], ["4", "Daily habit", "The Daily Five and your Tide take about 5 minutes a day."]];
  $("card").innerHTML = `<span class="pill">How it works</span><p class="prompt">${isGuest() ? "Here's" : esc(U.name) + ", here's"} the plan.</p>
  <div class="field goalq" style="max-width:none"><span class="lbl">What are you practicing for? (optional)</span><div class="row">${GOALS.map(g => `<button class="btn ghost small ${U.goal === g[0] ? "on" : ""}" data-goal="${g[0]}">${g[1]}</button>`).join("")}</div><span class="foot">This tilts examples toward your kind of writing. You can change it on the home screen.</span></div><div class="row"><button class="btn" id="go">Start the assessment</button><button class="btn ghost" id="skip">Skip and start at Level 1</button></div><details class="more"><summary>How it works</summary><div class="steps">${steps.map(s => `<div class="step"><span class="num">${s[0]}</span><div><h3>${s[1]}</h3><p>${s[2]}</p></div></div>`).join("")}</div></details>`;
  wireGoals(intro);
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
// One personalized line for the home screen, built from this player's own history.
function skillTrends() {
  const out = [];
  for (const k in U.skills) {
    const s = U.skills[k], hh = (U.hist || {})[k] || [];
    if (s.t < 8 || hh.length < 8) continue;
    const [l, tag] = k.split("|"); if (!LV[+l] || !LV[+l].skills[tag]) continue;
    const recent = Math.round(100 * hh.reduce((a, b) => a + b, 0) / hh.length), overall = Math.round(100 * s.r / s.t);
    out.push({ name: LV[+l].skills[tag], lvl: +l, tag, recent, overall, gain: recent - overall });
  }
  return out;
}
function coachNote() {
  const name = isGuest() ? "" : esc(U.name) + ", ";
  const gapDays = U.updatedAt ? Math.floor((Date.now() - U.updatedAt) / DAY) : 0;
  const due = dueIds().length, trends = skillTrends(), rk = rankFor(PTS.all);
  if (gapDays >= 3) return `Welcome back, ${isGuest() ? "sailor" : esc(U.name)}. The harbor kept your place${due ? `, and ${due} review question${due === 1 ? "" : "s"} are ready when you are` : ""}.`;
  const up = trends.filter(x => x.gain >= 12).sort((a, b) => b.gain - a.gain)[0];
  if (up) return `${name}your ${up.name.toLowerCase()} is climbing: ${up.recent}% right lately, up from ${up.overall}% overall. Keep that going.`;
  if ((U.streak || 0) > 0 && U.streak === U.bestStreak && U.streak >= 5) return `${name}you're on your best accuracy streak ever: ${U.streak} in a row. One more makes a new record every time.`;
  if (AUTH && ONLINE && rk.next && rk.next.at - PTS.all <= 60) return `${name}you're ${(rk.next.at - PTS.all)} points from ${rk.next.name}. One strong round gets you there.`;
  const down = trends.filter(x => x.gain <= -12).sort((a, b) => a.gain - b.gain)[0];
  if (down) return `${name}${down.name.toLowerCase()} has slipped lately: ${down.recent}% right in your last few, from ${down.overall}% overall. A short drill would patch it.`;
  const w = weakSpots()[0];
  if (w && U.total >= 15) return `${name}your strongest lever right now is ${LV[w.l].skills[w.tag].toLowerCase()}: ${Math.round(w.acc * 100)}% right so far. The drill below targets exactly that.`;
  if (U.total < 10) return `${name}play a few rounds and the Oracle starts reading your strengths and weak spots.`;
  return "";
}
function homeView() {
  const d = U.daily, due = dueIds().length, weak = weakSpots()[0];
  const rk = rankFor(PTS.all), tideDone = U.tide === today();
  const d5 = d5Today(), allDone = d5 && tideDone;
  const wk = weekStats(), L = LV[S.lvl];
  const tideWhy = due ? `${Math.min(due, 3)} review question${Math.min(due, 3) === 1 ? "" : "s"} from past misses, plus Level ${S.lvl + 1} practice` : `Level ${S.lvl + 1} practice${weak ? `, with an eye on ${LV[weak.l].skills[weak.tag].toLowerCase()}` : ""}`;
  const note = coachNote();
  $("card").innerHTML = `<span class="pill">The Harbor · Home</span>
  ${note ? `<p class="oracleline">🔮 <b>The Oracle's note:</b> ${note}</p>` : ""}
  ${allDone ? `<div class="fb ok donefor"><h3>That's today.</h3><p>The Daily Five and your Tide are both done. New ones arrive tomorrow. Extra practice is always open below.</p></div>` : ""}
  <h2 class="sect">Today</h2>
  <div class="tidecard d5card ${d5 ? "done" : ""}"><div><span class="lbl">Daily Five · same five for everyone</span><b>${d5 ? `${d5.res.filter(Boolean).length} / 5 today &nbsp;${squares(d5.res)}` : "5 questions · easy to hard"}</b><span class="foot">${d5 ? "A new Daily Five arrives tomorrow." : "Compare with friends. About 2 minutes."}</span></div><button class="btn ${d5 ? "ghost" : "brass"}" id="d5">${d5 ? "See and share" : "Play the Daily Five"}</button></div>
  <div class="tidecard ${tideDone ? "done" : ""}"><div><span class="lbl">Today's Tide · picked for you</span><b>${tideDone ? "Done for today" : "5 questions · about 3 minutes"}</b><span class="foot">${tideDone ? "A new Tide rolls in tomorrow." : `Today: ${esc(tideWhy)}.`}</span></div><button class="btn ${tideDone ? "ghost" : "brass"}" id="tide">${tideDone ? "Play it again" : "Start today's Tide"}</button></div>
  ${isGuest() ? `<div class="fb tip"><h3>Playing as a guest</h3><p>Progress saves on this device. A free account keeps it everywhere and adds the leaderboard. Your progress comes with you.</p><div class="row"><button class="btn brass" id="mkAcct">Create an account</button></div></div>` : ""}
  ${!U.placed ? `<div class="fb lesson"><h3>Find your level</h3><p>Five quick questions place you at the right level.</p><div class="row"><button class="btn" id="doPlace">Take the assessment</button></div></div>` : ""}
  <h2 class="sect">Your climb</h2>
  <div class="climb"><div><span class="lbl">Level ${S.lvl + 1} of 10 · ${PLACES[S.lvl]}</span><b>${esc(L.t)}</b><span class="foot">You'll practice: ${esc(Object.values(L.skills).join(", ").toLowerCase())}.${U.best[S.lvl] != null ? ` Best so far ${U.best[S.lvl]}/5.` : ""}</span></div><div class="row"><button class="btn" id="go">Play Level ${S.lvl + 1}</button>${due ? `<button class="btn ghost" id="rv">Review ${due} due</button>` : ""}</div></div>
  <div class="streakrow"><span>🔥 Accuracy streak <b>${U.streak || 0}</b>${U.bestStreak ? ` · best ${U.bestStreak}` : ""}</span><span class="foot">${(U.streak || 0) >= 8 ? "Stretch questions from the next level are unlocked." : `${8 - (U.streak || 0)} more right in a row unlocks stretch questions.`}</span></div>
  <p class="foot tokens"><b>Olympian tokens:</b> ${Object.entries(GODS).map(([k, g]) => `<span title="${g.name}'s ${g.token}">${g.icon} ${(U.tokens || {})[k] || 0}</span>`).join(" ")} <span class="foot">Token power: <b>+${tokenPower()}%</b> on all leaderboard points. Win tokens in rare Trials during level rounds.</span></p>
  ${wk.t >= 5 ? `<p class="foot weekline"><b>This week:</b> ${wk.pct}% right on ${wk.t} answers${wk.prev != null ? ` (last week ${wk.prev}%${wk.pct > wk.prev ? ", up " + (wk.pct - wk.prev) + " points" : ""})` : ""}.</p>` : ""}
  ${(U.streak || 0) >= 15 && S.lvl < LV.length - 1 ? `<div class="fb ok"><h3>You're on a roll.</h3><p>${U.streak} right in a row. Ready to try Level ${S.lvl + 2}?</p><div class="row"><button class="btn brass" id="skipup">Try Level ${S.lvl + 2}</button></div></div>` : ""}
  ${AUTH && ONLINE ? `<div class="rank"><span><b>${rk.name}</b>${rk.next ? ` · ${(rk.next.at - PTS.all).toLocaleString()} points to ${rk.next.name}` : " · the highest rank"} · ${PTS.week} this week</span><div class="bar sea"><span style="width:${rk.next ? Math.round(100 * (PTS.all - rk.min) / (rk.next.at - rk.min)) : 100}%"></span></div></div>` : ""}
  <details class="more" ${S.openMore ? "open" : ""} id="moreBox"><summary>More practice</summary>
    <div class="practice">
      ${weak ? `<button class="pbtn" id="dr"><b>Drill your weakest skill</b><span>${esc(LV[weak.l].skills[weak.tag])} · ${Math.round(weak.acc * 100)}% right</span></button>` : ""}
      <button class="pbtn" id="myth"><b>Myth or rule?</b><span>Which grammar “rules” are real</span></button>
      <button class="pbtn" id="mix"><b>Mix look-alikes</b><span>Affect/effect, who/whom, and more</span></button>
      <button class="pbtn" id="ar"><b>Enter the Agora</b><span>Argument practice scenarios</span></button>
    </div></details>
  <details class="more"><summary>Your journey · ${PLACES.filter((_, k) => U.best[k] >= 4).length} of 10 levels cleared</summary>
    <ol class="journey">${LV.map((lv, k) => { const m = mastery(k); return `<li class="${U.best[k] >= 4 ? "got" : ""} ${k === S.lvl ? "now" : ""}"><span class="jn">${k + 1}</span><div><b>${esc(lv.t)}</b> <span class="foot">${PLACES[k]}${U.best[k] >= 4 ? " · cleared" : ""}</span><span class="foot">${esc(Object.values(lv.skills).join(" · "))}</span>${m != null ? `<div class="bar"><span style="width:${m}%"></span></div><span class="foot">${m}% right so far</span>` : ""}</div><button class="link small" data-lv="${k}">Play</button></li>`; }).join("")}</ol></details>
  <details class="more"><summary>Settings</summary>
    <p class="foot goalq">Practicing for: ${GOALS.map(g => `<button class="link small ${U.goal === g[0] ? "on" : ""}" data-goal="${g[0]}">${g[1]}</button>`).join(" · ")}${U.goal ? "" : " (optional)"}</p>
    <p class="foot">Confidence check: <b>${U.conf ? "On" : "Off"}</b>. Tap “sure” or “not sure” before checking; confident mistakes get extra review. <button class="link small" id="conf">${U.conf ? "Turn off" : "Turn on"}</button></p>
    <p class="foot">Speed timer: <b>${U.calm ? "Off" : "On"}</b>. ${U.calm ? "No countdown. Right answers earn a steady bonus instead." : "Faster right answers earn more points."} <button class="link small" id="calm">${U.calm ? "Turn on" : "Turn off"}</button></p>
    ${AUTH && !isGuest() ? `<p class="foot">Recovery code: lets you reset a forgotten PIN. <button class="link small" id="newRec">Get a new code</button></p>` : ""}
  </details>`;
  $("go").onclick = () => start(S.lvl);
  $("tide").onclick = startTide;
  $("d5").onclick = startDaily;
  if ($("rv")) $("rv").onclick = startReview;
  if ($("dr")) $("dr").onclick = () => startDrill(weak.l, weak.tag);
  $("ar").onclick = () => { S.mode = "arena"; render(); };
  $("mix").onclick = startMix;
  $("myth").onclick = startMyths;
  $("moreBox").ontoggle = e => { S.openMore = e.target.open; };
  wireGoals(render);
  if ($("mkAcct")) $("mkAcct").onclick = () => $("sw").click();
  if ($("doPlace")) $("doPlace").onclick = startPlace;
  $("conf").onclick = () => { U.conf = !U.conf; save(); render(); };
  $("calm").onclick = () => { U.calm = !U.calm; save(); render(); };
  if ($("newRec")) $("newRec").onclick = async () => { try { const r = await api("/recovery/new", { ...AUTH }); S.recovery = r.recovery; S.recNext = "home"; S.mode = "reccode"; render(); } catch (e) { toast(e.message); } };
  if ($("skipup")) $("skipup").onclick = () => start(S.lvl + 1);
}
// Share of right answers per level, from skill tracking. null until there's something to show.
function mastery(l) { let r = 0, t = 0; for (const k in U.skills) if (k.startsWith(l + "|")) { r += U.skills[k].r; t += U.skills[k].t; } return t >= 3 ? Math.round(100 * r / t) : null; }
function weekStats() { const w = U.weeks || {}, k = weekKey(), cur = w[k] || { r: 0, t: 0 }, keys = Object.keys(w).filter(x => x < k).sort(), prev = keys.length ? w[keys[keys.length - 1]] : null; return { t: cur.t, pct: cur.t ? Math.round(100 * cur.r / cur.t) : 0, prev: prev && prev.t >= 5 ? Math.round(100 * prev.r / prev.t) : null }; }
function startReview() {
  const due = dueIds(), all = savedIds();
  if (!all.length) { S.mode = "msg"; S.msg = ["Returning Tide · Review", "Nothing to review yet.", "Questions you miss in level rounds land here and come back after 1 day, then 3 days. Answer one right twice in a row and it leaves the queue."]; return render(); }
  const ids = (due.length ? due : shuffle(all)).slice(0, 5);
  S.set = { kind: "review", early: !due.length, title: due.length ? "Returning Tide" : "Returning Tide (early)", ids, i: 0, res: [] }; S.mode = "set"; fresh(); render();
}
// Look-alike skills mixed together: telling them apart is the skill.
const LOOKALIKES = [[2, "A"], [3, "F"], [3, "S"], [3, "P"], [3, "W"], [7, "P"], [7, "V"]];
function startMyths() {
  if (!U.mythIntro) { S.mode = "rules"; return render(); }
  const all = []; LV.forEach(L => L.q.forEach(q => { if (q.myth) all.push(q.id); }));
  const seen = U.mythSeen || [], fresh1 = shuffle(all.filter(id => !seen.includes(id))), ids = fresh1.concat(shuffle(all.filter(id => !fresh1.includes(id)))).slice(0, 5);
  U.mythSeen = seen.concat(ids).slice(-15);
  S.set = { kind: "myth", title: "Myth or rule?", ids, i: 0, res: [] }; S.mode = "set"; fresh(); save(); render();
}
function rulesView() {
  $("card").innerHTML = `<span class="pill scenic">Rules, choices, and style</span><p class="prompt">Not every grammar “rule” is a rule.</p>
  <div class="steps">
  <div class="step"><span class="num">1</span><div><h3>Rules</h3><p>Every major guide agrees. Break one and readers notice: “The list are long,” or “it's” where you meant “its.”</p></div></div>
  <div class="step"><span class="num">2</span><div><h3>Choices</h3><p>More than one version is correct. Pick by reader and tone: active or passive, short or long sentences, contractions or not.</p></div></div>
  <div class="step"><span class="num">3</span><div><h3>Style</h3><p>A style guide picks one option so a team stays consistent. Chicago (books and academic writing) uses the comma before “and” in a list. AP (news and business) usually doesn't. Follow the one your workplace uses.</p></div></div>
  <div class="step"><span class="num">4</span><div><h3>Myths</h3><p>“Rules” many of us learned in school that the major guides reject, like never splitting an infinitive.</p></div></div></div>
  <p class="foot">In Proseidon, when the major guides disagree, every accepted answer counts. Look for <b>The Oracle's ruling</b>.</p>
  <div class="row"><button class="btn brass" id="go">Play Myth or rule?</button><button class="btn ghost" id="hm">Back to home</button></div>`;
  $("go").onclick = () => { U.mythIntro = true; save(); startMyths(); }; $("hm").onclick = home; $("go").focus();
}
function startMix() {
  const groups = LOOKALIKES.map(([l, t]) => shuffle(LV[l].q.filter(q => q.tag === t && !q.scenic && ["mc", "tap", "match"].includes(q.type)).map(q => q.id)));
  const ids = []; for (let k = 0; ids.length < 6 && k < 20; k++) for (const g of shuffle(groups)) { if (ids.length < 6 && g[k] && !ids.includes(g[k])) ids.push(g[k]); }
  S.set = { kind: "mix", title: "Look-alike mix", ids: shuffle(ids), i: 0, res: [] }; S.mode = "set"; fresh(); render();
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

/* ---------- Olympian Trials ---------- */
// About 1 in 12 level-round questions, a god offers a harder question (up to two levels up).
// Accepting is optional. A right answer pays triple points and earns that god's token. A miss never breaks the streak.
const GODS = {
  athena: { name: "Athena", token: "owl", icon: "🦉", domain: "argument and rhetoric" },
  hermes: { name: "Hermes", token: "winged sandals", icon: "🪽", domain: "clear, swift messages", plural: true },
  apollo: { name: "Apollo", token: "lyre", icon: "🎶", domain: "sound and language" },
  hephaestus: { name: "Hephaestus", token: "hammer", icon: "🔨", domain: "well-built sentences" },
  zeus: { name: "Zeus", token: "thunderbolt", icon: "⚡", domain: "the hardest questions" }
};
const tokenCount = () => Object.values(U.tokens || {}).reduce((a, b) => a + b, 0);
const tokenPower = () => Math.min(tokenCount(), 10) * 2;
function godFor(q) {
  if (q.lvl === 3 || q.lvl === 5) return "hermes";
  if (q.lvl === 6) return ["A", "X"].includes(q.tag) ? "athena" : "apollo";
  if (q.lvl === 8) return "apollo";
  if (q.lvl === 9) return q.tag === "C" ? "athena" : "zeus";
  return "hephaestus";
}
function maybeTrial(k) {
  S.trial = null;
  if (Math.random() >= 0.2) return;
  const tl = Math.min(k + 2, LV.length - 1), i = 1 + Math.floor(Math.random() * 3);
  const pool = shuffle(LV[tl].q.filter(q => q.type === "mc" && !S.round.includes(q.id)).map(q => q.id)); if (!pool.length) return;
  const id = pool[0], alt = S.round[i];
  S.round[i] = id; S.trial = { i, id, alt, god: godFor(BYID[id]), accepted: null };
}
function trialOffer() {
  const g = GODS[S.trial.god], q = BYID[S.trial.id], have = (U.tokens || {})[S.trial.god] || 0;
  $("card").innerHTML = `<div class="trial"><span class="pill gold">${g.icon} An Olympian Trial</span><p class="prompt">${g.name} offers you a trial.</p>
  <p class="lead">A harder question from Level ${q.lvl + 1}, on ${esc(g.domain)}. Answer it right for <b>triple points</b> and ${g.name}'s ${g.token}. Every token adds <b>+2%</b> to all your leaderboard points from then on (up to +20%).${have ? ` You have ${have} so far.` : ""}</p>
  <p class="foot">Missing a trial never breaks your streak. Saying no gives you a regular question instead.</p>
  <div class="row"><button class="btn brass" id="tAcc">Accept the trial</button><button class="btn ghost" id="tDec">Not today</button></div></div>`;
  $("tAcc").onclick = () => { S.trial.accepted = true; fresh(); render(); };
  $("tDec").onclick = () => { S.trial.accepted = false; S.round[S.trial.i] = S.trial.alt; fresh(); render(); };
  $("tAcc").focus();
}
const trialNow = () => S.mode === "q" && S.trial && S.qi === S.trial.i && S.trial.accepted === true;

/* ---------- rounds ---------- */
function start(k) {
  if (!U) return;
  S.lvl = k; S.round = draw(k, 5); U.last[k] = S.round.slice();
  if ((U.streak || 0) >= 8 && k < LV.length - 1 && AUTH && ONLINE) { const up = draw(k + 1, 3).find(id => BYID[id].type === "mc"); if (up) S.round[4] = up; }
  maybeTrial(k); S.qi = 0; S.res = []; S.mode = "q"; S.hint = false; S.served = {}; S.qStart = {}; S.roundPts = 0;
  S.rp = AUTH && ONLINE ? api("/round/start", { ...AUTH, level: k, qids: S.round, calm: !!U.calm, ...(S.trial ? { trial: { i: S.trial.i, alt: S.trial.alt } } : {}) }).then(r => r.roundId).catch(() => null) : Promise.resolve(null);
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
    h += `<div class="opts" role="group">` + S.order.map((o, pos) => { let c = "opt"; if (S.answered) { if (o === q.a || (q.alt || []).includes(o)) c += " right"; else if (o === S.sel) c += " wrong"; } else if (o === S.sel) c += " sel"; return `<button class="${c}" ${S.answered ? "disabled" : ""} data-pick="${o}"><span class="k">${pos + 1}</span><span>${esc(q.o[o])}</span></button>`; }).join("") + `</div>`;
  } else if (q.type === "tap") {
    h += `<p class="foot">Tap a word in the sentence.</p><div class="toks">` + q.s.map((w, k) => { let c = "tok"; if (S.answered) { if (k === q.a) c += " right"; else if (k === S.sel) c += " wrong"; } else if (k === S.sel) c += " sel"; return `<button class="${c}" ${S.answered ? "disabled" : ""} data-pick="${k}">${esc(w)}</button>`; }).join("") + `</div>`;
  } else if (q.type === "mor") {
    h += `<div class="mor">` + [["Myth", 0], ["Real rule", 1]].map(([lbl, k]) => { let c = "opt morb"; if (S.answered) { if (k === q.a) c += " right"; else if (k === S.sel) c += " wrong"; } else if (k === S.sel) c += " sel"; return `<button class="${c}" ${S.answered ? "disabled" : ""} data-pick="${k}"><span class="k">${k + 1}</span><span>${lbl}</span></button>`; }).join("") + `</div>`;
  } else if (q.type === "order") {
    const sel = S.sel || [], text = orderText(q, sel), ok = S.answered && check(q, sel);
    h += `<p class="foot">${S.answered ? "" : "Tap or drag the tiles to build it. Tap a placed tile to remove it. Not every tile has to be used."}</p><div class="build ${S.answered ? (ok ? "right" : "wrong") : ""}" id="build" aria-label="Your answer">${sel.length ? sel.map((ti, k) => `<button class="tile2 placed" ${S.answered ? "disabled" : ""} data-orem="${k}" draggable="${!S.answered}" data-odrag="p${k}">${esc(q.tiles[ti])}</button>`).join("") : `<span class="foot">Your ${q.join === "" ? "word" : "sentence"} appears here.</span>`}</div>`;
    if (!S.answered) h += `<div class="pool">${S.tileOrder.filter(ti => !sel.includes(ti)).map(ti => `<button class="tile2" data-oadd="${ti}" draggable="true" data-odrag="t${ti}">${esc(q.tiles[ti])}</button>`).join("")}</div>`;
    else if (!ok) h += `<p class="foot">You built: “${esc(text)}”</p>`;
  } else if (q.type === "multi") {
    const sel = S.sel || [];
    h += `<p class="foot">Tap every word that fits, then check.</p><div class="toks">` + q.s.map((w, k) => { let c = "tok"; if (S.answered) { if (q.a.includes(k)) c += sel.includes(k) ? " right" : " missed"; else if (sel.includes(k)) c += " wrong"; } else if (sel.includes(k)) c += " sel"; return `<button class="${c}" ${S.answered ? "disabled" : ""} data-mtog="${k}">${esc(w)}</button>`; }).join("") + `</div>`;
  } else if (q.type === "match") {
    h += `<div class="match">` + q.pairs.map((pr, i) => { const v = S.sel ? S.sel[i] : null; const st = S.answered ? (v === i ? "right" : "wrong") : ""; return `<label class="mrow ${st}"><b>${esc(pr[0])}</b><select class="inp" data-msel="${i}" ${S.answered ? "disabled" : ""}><option value="">Choose a match</option>${S.defOrder.map(d => `<option value="${d}" ${v === d ? "selected" : ""}>${esc(q.pairs[d][1])}</option>`).join("")}</select>${S.answered && v !== i ? `<span class="foot">Answer: ${esc(pr[1])}</span>` : ""}</label>`; }).join("") + `</div>`;
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
  const st = document.querySelector(".stats"); if (st) st.style.display = U && !(isGuest() && !U.total) ? "" : "none";
  $("map").style.display = onb ? "none" : ""; $("tiles").style.display = onb ? "none" : ""; $("tools").style.display = U ? "" : "none";
  document.querySelectorAll("#tiles .tile").forEach(t => t.classList.toggle("on", t.dataset.view === S.mode || (t.dataset.view === "arena" && S.mode === "scene") || (t.dataset.view === "review" && S.mode === "set" && S.set && S.set.kind === "review") || (t.dataset.view === "d5" && (S.mode === "d5done" || (S.mode === "set" && S.set && S.set.kind === "daily"))) || (t.dataset.view === "tide" && S.mode === "set" && S.set && S.set.kind === "tide")));
  const c = $("card");
  if (S.mode === "loading") { c.innerHTML = `<p class="foot">Loading…</p>`; return; }
  if (S.mode === "forgot") return forgotView(S.forgotName);
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
  if (S.mode === "rules") return rulesView();
  if (S.mode === "reccode") return recView();
  if (S.mode === "d5done") return dailyDone();
  const L = LV[S.lvl];
  if (S.mode === "lesson") {
    c.innerHTML = `<div class="top"><span class="pill scenic">Scenic route · ${esc(L.t)}</span></div><div class="fb lesson"><h3>Quick lesson</h3><p>${esc(L.l)}</p></div>${S.missTip ? `<p class="foot styletip"><b>Style tip:</b> ${esc(S.missTip)}</p>` : ""}<div class="row"><button class="btn brass" id="go">Practice, then a writing task</button><button class="btn ghost" id="skipd">Skip the detour</button></div>`;
    $("go").onclick = () => { S.mode = "prac"; S.pi = 0; fresh(); render(); }; $("skipd").onclick = back; $("go").focus(); return;
  }
  const q = curQ(), main = S.mode === "q", pl = S.mode === "place", set = S.mode === "set";
  if (main && S.trial && S.qi === S.trial.i && S.trial.accepted === null) return trialOffer();
  initState(q);
  if (main && !S.answered) { serve(S.qi); if (!S.qStart[S.qi]) S.qStart[S.qi] = performance.now(); }
  let dots = "";
  if (main || pl || set) { const arr = pl ? S.pres : set ? S.set.res : S.res, n = set ? S.set.ids.length : 5, cur = set ? S.set.i : S.qi; dots = `<div class="dots" aria-label="Question ${cur + 1} of ${n}">${Array.from({ length: n }, (_, k) => `<span class="dot ${arr[k] === true ? "ok" : arr[k] === false ? "bad" : k === cur ? "now" : ""}"></span>`).join("")}</div>`; }
  const label = pl ? `Assessment · question ${S.qi + 1} of 5` : main ? `Level ${S.lvl + 1} · ${PLACES[S.lvl]} · ${L.t}` : set ? `${S.set.title} · Level ${q.lvl + 1}` : S.pi === 1 ? `Scenic route · writing lab` : `Scenic route · practice`;
  const trialQ = trialNow(), stretchQ = main && q.lvl !== S.lvl && !trialQ;
  let h = `<div class="top"><span class="pill ${main || pl ? "" : "scenic"}">${esc(trialQ ? `${GODS[S.trial.god].icon} Trial of ${GODS[S.trial.god].name} · Level ${q.lvl + 1} · 3x points` : stretchQ ? `Stretch question · Level ${q.lvl + 1} · 1.5x points` : label)}</span>${dots}</div>`;
  if (main && (U.streak || 0) >= 2) h += `<div class="streak"><span>🔥 ${U.streak} in a row</span><span class="foot">Accuracy streak · ${streakMult(U.streak + 1).toFixed(2)}x points on your next right answer</span></div>`;
  if (main && AUTH && ONLINE && !S.answered && q.type !== "fix" && !U.calm) { const el = (performance.now() - S.qStart[S.qi]) / 1000; h += `<div class="tide"><span class="foot">Tide · speed bonus</span><div class="timer"><span style="animation-delay:-${el.toFixed(2)}s"></span></div></div>`; }
  h += questionBody(q) + `<p class="err" id="err"></p>`;
  if (S.hint && main && !S.answered) h += `<div class="fb tip"><h3>Coach's tip</h3><p>${esc(L.l)}</p></div>`;
  if (S.answered) {
    const ok = check(q, S.sel);
    let body = "";
    if (q.type === "fix") {
      const issues = ok ? [] : fixIssues(q, S.sel);
      body = `${issues.length ? `<ul class="issues">${issues.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}<p><b>One strong rewrite:</b> ${esc(q.model)}</p><p>${esc(q.e)}</p>`;
    } else if (q.type === "mor") {
      body = `<p><b>${q.a ? "Real rule." : "Myth."}</b> ${q.kind === "Choice" ? "It's really a choice that depends on your reader. " : q.kind === "Style" ? "It's really a house-style choice. " : ""}${esc(q.e)}</p>`;
    } else {
      body = `<p>${ok ? "" : `The answer: ${esc(answerText(q))}. `}${esc(q.e)}</p>`;
      if (q.type === "mc" && q.w) {
        const why = k => q.w[k] ? `<li><b>“${esc(q.o[k])}”:</b> ${esc(q.w[k])}</li>` : "";
        if (!ok && q.w[S.sel]) body += `<p class="whynot"><b>Why not “${esc(q.o[S.sel])}”:</b> ${esc(q.w[S.sel])}</p>`;
        const others = [0, 1, 2, 3].filter(k => k !== q.a && (ok || k !== S.sel) && q.w[k]);
        if (others.length) body += `<details class="why"><summary>Why the ${ok ? "other answers are" : "remaining answers are"} wrong</summary><ul>${others.map(why).join("")}</ul></details>`;
      }
    }
    h += `<div class="fb ${ok ? "ok" : "bad"}"><h3>${ok ? rand(PRAISE) : rand(MISS)}${ok && main && U.streak >= 3 ? ` ${U.streak} in a row.` : ""}${!ok && main && S.lostStreak >= 3 ? ` Streak of ${S.lostStreak} ended.` : ""}</h3>${body}</div>`;
    if (set && S.set.kind === "daily") h += `<p class="foot dpct">${esc(dailyPct(q.id, S.set.i))}</p>`;
    if (q.ruling) h += `<div class="fb oracle"><h3>The Oracle's ruling</h3><p>${esc(q.ruling)}</p></div>`;
    if (!ok && TIPS[q.lvl + "|" + q.tag]) h += `<p class="foot styletip"><b>Style tip:</b> ${esc(TIPS[q.lvl + "|" + q.tag])}</p>`;
    if (S.sure === true && !ok) h += `<div class="fb tip"><h3>Confident miss</h3><p>You were sure, and it was wrong. These are the mistakes that stick best once corrected, so it goes into your review queue.</p></div>`;
    if (S.sure === false && ok) h += `<p class="foot">Right, but you weren't sure. It will come back once in review to lock it in.</p>`;
    if (stretchQ && !ok) h += `<p class="foot">Stretch questions don't break your streak.</p>`;
    if (trialQ) { const g = GODS[S.trial.god]; h += ok ? `<div class="fb trialwin"><h3>${g.icon} You passed ${g.name}'s trial.</h3><p>You earned ${g.name}'s ${g.token}. Token power is now +${tokenPower()}% on every leaderboard point you score.</p></div>` : `<p class="foot">Trials are meant to be hard. Your streak is safe, and this question goes to your review queue.</p>`; }
    h += `<div class="report"><button class="link small" id="rep">Something wrong with this question? Report it</button><div id="repBox"></div></div>`;
    if (main && !ok && !trialQ) h += `<div class="fb tip"><h3>Scenic route ahead</h3><p>A short lesson, one practice question, and one writing task on this skill, then back to the climb. This question also goes into your review queue.</p></div>`;
  }
  h += `<div class="row">`;
  if (!S.answered) { h += U.conf && q.type !== "fix" && q.type !== "type" ? `<button class="btn" id="go">Check · I'm sure</button><button class="btn ghost" id="go2">Check · Not sure</button>` : `<button class="btn" id="go">Check answer</button>`; if (main) h += `<button class="btn ghost" id="hint">${S.hint ? "Hide tip" : "Coach's tip"}</button>`; }
  else {
    const ok = check(q, S.sel);
    if (pl) h += `<button class="btn" id="go">${S.qi < 4 ? "Next question" : "See my starting level"}</button>`;
    else if (set) h += `<button class="btn" id="go">${S.set.i < S.set.ids.length - 1 ? "Next question" : "Finish"}</button>`;
    else if (main) h += ok || trialQ ? `<button class="btn" id="go">${S.qi < 4 ? "Next question" : "See results"}</button>` : `<button class="btn brass" id="go">Take the scenic route</button><button class="btn ghost" id="skipd">Skip it</button>`;
    else h += `<button class="btn" id="go">${S.pi < 1 ? "Next practice" : "Back to the climb"}</button>`;
  }
  h += "</div>";
  c.innerHTML = h;
  $("go").onclick = () => { if (!S.answered && $("go2")) S.sure = true; act(); };
  if ($("go2")) $("go2").onclick = () => { S.sure = false; act(); };
  if (!S.answered) wireBuild(q);
  if ($("hint")) $("hint").onclick = () => { S.hint = !S.hint; render(); };
  if ($("skipd")) $("skipd").onclick = back;
  if ($("ans") && !S.answered) { $("ans").oninput = e => { S.typed = e.target.value; $("err").textContent = ""; }; $("ans").onkeydown = e => { if (e.key === "Enter" && (q.type !== "fix" || e.ctrlKey || e.metaKey)) { e.preventDefault(); act(); } }; $("ans").focus(); }
  if ($("rep")) $("rep").onclick = () => openReport(q);
  else $("go").focus();
}
function wireBuild(q) {
  document.querySelectorAll("[data-oadd]").forEach(b => b.onclick = () => { S.sel.push(+b.dataset.oadd); render(); });
  document.querySelectorAll("[data-orem]").forEach(b => b.onclick = () => { S.sel.splice(+b.dataset.orem, 1); render(); });
  document.querySelectorAll("[data-mtog]").forEach(b => b.onclick = () => { const k = +b.dataset.mtog, i = S.sel.indexOf(k); if (i < 0) S.sel.push(k); else S.sel.splice(i, 1); render(); });
  document.querySelectorAll("[data-msel]").forEach(x => x.onchange = () => { S.sel[+x.dataset.msel] = x.value === "" ? null : +x.value; $("err").textContent = ""; });
  // Drag and drop (mouse). Tapping works everywhere, including phones.
  let drag = null;
  document.querySelectorAll("[data-odrag]").forEach(b => { b.ondragstart = e => { drag = b.dataset.odrag; e.dataTransfer.setData("text/plain", drag); }; });
  const build = $("build"); if (!build) return;
  const place = (target) => {
    if (!drag) return; const at = target ? +target.dataset.orem : S.sel.length;
    if (drag[0] === "t") { const ti = +drag.slice(1); S.sel.splice(isNaN(at) ? S.sel.length : at, 0, ti); }
    else { const from = +drag.slice(1), ti = S.sel.splice(from, 1)[0]; let to = isNaN(at) ? S.sel.length : at; if (from < to) to--; S.sel.splice(to, 0, ti); }
    drag = null; render();
  };
  build.ondragover = e => { e.preventDefault(); build.classList.add("over"); };
  build.ondragleave = () => build.classList.remove("over");
  build.ondrop = e => { e.preventDefault(); place(e.target.closest("[data-orem]")); };
}
function pick(o) { if (S.answered) return; S.sel = o; render(); }
function act() {
  const q = curQ(), main = S.mode === "q", pl = S.mode === "place", set = S.mode === "set";
  if (!S.answered) {
    if (q.type === "type" || q.type === "fix") { if (!S.typed.trim()) { $("err").textContent = q.type === "fix" ? "Write your rewrite first." : "Type an answer first."; return; } S.sel = S.typed.trim(); }
    else if (q.type === "order" || q.type === "multi") { if (!S.sel.length) { $("err").textContent = q.type === "order" ? "Place at least one tile first." : "Tap at least one word first."; return; } }
    else if (q.type === "match") { if (S.sel.some(x => x == null)) { $("err").textContent = "Choose a match for every item first."; return; } }
    else if (S.sel === null) { $("err").textContent = q.type === "tap" ? "Tap a word first." : "Pick an answer first."; return; }
    S.answered = true; S.hint = false;
    const ok = check(q, S.sel);
    U.total++; if (ok) U.right++; skillHit(q, ok);
    if (!main) queueStat(q.id, ok);
    if (pl) { S.pres[S.qi] = ok; if (ok) gain(5); else shake(); }
    else if (set) { if (S.sure === true && !ok) addReview(q.id, true); if (S.sure === false && ok && !U.review[q.id]) addReview(q.id); S.set.res[S.set.i] = ok; if (S.set.kind === "review" || (S.set.kind === "tide" && U.review[q.id])) reviewResult(q.id, ok); if (ok) gain(5); else { shake(); if (S.set.kind === "tide" && !U.review[q.id]) addReview(q.id); } }
    else if (main) {
      S.res[S.qi] = ok;
      const isTrial = trialNow(), stretch = q.lvl !== S.lvl || isTrial; S.lostStreak = 0;
      if (isTrial && ok) { U.tokens = U.tokens || {}; U.tokens[S.trial.god] = (U.tokens[S.trial.god] || 0) + 1; S.trial.won = true; }
      if (ok) { U.streak++; U.bestStreak = Math.max(U.bestStreak || 0, U.streak); gain(10 + (U.streak >= 3 ? 5 : 0)); if ([10, 25, 50, 100].includes(U.streak)) floatUp(`🔥 ${U.streak} in a row!`, "pts"); if (S.sure === false) addReview(q.id); }
      else { if (!stretch) { S.lostStreak = U.streak; U.streak = 0; } addReview(q.id, S.sure === true); shake(); }
      const i = S.qi, resp = S.sel, declined = !!(S.trial && S.trial.i === i && S.trial.accepted === false);
      (S.served[i] || Promise.resolve(null)).then(id => id ? api("/round/answer", { ...AUTH, roundId: id, i, response: resp, declined }) : null).then(r => {
        if (!r) return; PTS = { week: r.weekPts, all: r.allPts }; S.roundPts = r.roundPts;
        if (r.finished) { U.pb = U.pb || {}; if ((r.roundPts || 0) > (U.pb.roundPts || 0)) { S.newPB = U.pb.roundPts > 0; U.pb.roundPts = r.roundPts; save(); } } if (typeof r.astreak === "number") { U.streak = r.astreak; U.bestStreak = Math.max(U.bestStreak || 0, r.bestStreak || 0); save(); }
        if (r.points + r.bonus > 0) floatUp(`+${r.points + r.bonus} pts`, "pts");
        stats(); if ($("rpts")) $("rpts").textContent = `${r.roundPts} leaderboard points this round${r.finished && S.newPB ? " · a new personal best!" : ""}`;
      }).catch(() => {});
    } else { if (ok) gain(3); else shake(); }
    save(); render(); return;
  }
  if (pl) { if (S.qi < 4) { S.qi++; fresh(); } else S.mode = "placed"; render(); return; }
  if (set) { if (S.set.i < S.set.ids.length - 1) { S.set.i++; fresh(); } else if (S.set.kind === "daily") { finishDaily(); return; } else { S.mode = "setdone"; if (S.set.kind === "tide" && U.tide !== today()) { U.tide = today(); gain(15); } markDay(); save(); } render(); return; }
  if (main) { if (check(q, S.sel) || trialNow()) advance(); else { S.prac = [draw(S.lvl, 1, S.round)[0], scenicPick(q.lvl, q.tag)]; S.missTip = TIPS[q.lvl + "|" + q.tag] || ""; save(); S.mode = "lesson"; render(); } return; }
  if (S.pi < 1) { S.pi++; fresh(); render(); } else back();
}
function scenicPick(l, tag) {
  const pool = LV[l].q.filter(x => x.scenic), seen = U.scenicSeen || (U.scenicSeen = []);
  const fresh1 = a => a.filter(x => !seen.includes(x.id));
  const pick = [fresh1(pool.filter(x => x.tag === tag)), pool.filter(x => x.tag === tag), fresh1(pool), pool].find(a => a.length);
  const q = pick[Math.floor(Math.random() * pick.length)];
  U.scenicSeen = seen.concat(q.id).slice(-40); return q.id;
}
function back() { S.mode = "q"; advance(); }
function advance() {
  if (S.qi < 4) { S.qi++; fresh(); render(); return; }
  S.mode = "done"; const sc = S.res.filter(Boolean).length;
  S.prevBest = U.best[S.lvl]; S.newPB = false;
  if (U.best[S.lvl] == null || sc > U.best[S.lvl]) U.best[S.lvl] = sc;
  if (sc >= 4) gain(25);
  markDay(); save(); render();
}
function done() {
  const L = LV[S.lvl], sc = S.res.filter(Boolean).length, pass = sc >= 4, nx = S.lvl + 1 < LV.length;
  const missed = S.round.map((id, i) => S.res[i] ? null : BYID[id].p).filter(Boolean);
  const byTag = {}; S.round.forEach((id, i) => { const q = BYID[id]; if (q.lvl !== S.lvl) return; const t = byTag[q.tag] || (byTag[q.tag] = { r: 0, t: 0 }); t.t++; if (S.res[i]) t.r++; });
  const tags = Object.entries(byTag), best = tags.filter(([, v]) => v.r === v.t).map(([k]) => L.skills[k]), worst = tags.filter(([, v]) => v.r < v.t).sort((a, b) => a[1].r / a[1].t - b[1].r / b[1].t)[0];
  S.failTag = worst ? worst[0] : null;
  const coach = !pass && (best.length || worst) ? `${best.length ? `You were solid on ${esc(best.join(" and ").toLowerCase())}. ` : ""}${worst ? `Next skill to work on: ${esc(L.skills[worst[0]].toLowerCase())}.` : ""}` : "";
  $("card").innerHTML = `<div class="top"><span class="pill">Level ${S.lvl + 1} · ${PLACES[S.lvl]} · ${esc(L.t)}</span></div><p class="big">${sc} / 5</p>${AUTH && ONLINE ? `<p class="lead" id="rpts">${S.roundPts ? S.roundPts + " leaderboard points this round" : "Tallying points…"}</p>` : ""}
  <div class="fb ${pass ? "ok" : "tip"}"><h3>${pass ? (nx ? "Level cleared. The next rung is open." : "You reached the summit.") : (sc === 3 ? "Almost there. Four correct clears the level." : "Good practice. Four correct clears the level.")}</h3><p>${pass ? `+25 XP bonus. You earned the ${PLACES[S.lvl].replace("The ", "")} badge.` : `Your progress is saved. ${coach} A fresh mix of questions is ready when you are.`}${S.prevBest != null && sc > S.prevBest ? ` That beats your best here of ${S.prevBest}/5.` : ""}${missed.length ? " Your misses are saved to your review queue." : ""}</p></div>
  ${S.trial && S.trial.won ? `<div class="fb trialwin"><h3>${GODS[S.trial.god].icon} ${GODS[S.trial.god].name}'s ${GODS[S.trial.god].token} ${GODS[S.trial.god].plural ? "are" : "is"} yours.</h3><p>You passed an Olympian Trial this round.</p></div>` : ""}
  ${missed.length ? `<div class="fb lesson"><h3>Worth another look</h3><p>${missed.map(esc).join("<br>")}</p></div>` : ""}
  <div class="row">${pass && nx ? `<button class="btn" id="go">Climb to ${PLACES[S.lvl + 1]}</button>` : ""}${!pass && S.failTag ? `<button class="btn brass" id="fdrill">Drill ${esc(L.skills[S.failTag].toLowerCase())}</button>` : ""}<button class="btn ${pass && nx ? "ghost" : ""}" id="again">Retry Level ${S.lvl + 1}</button><button class="btn ghost" id="hm">Home</button><button class="btn ghost" id="rate">Rate Proseidon</button></div>`;
  if ($("go")) $("go").onclick = () => start(S.lvl + 1);
  $("again").onclick = () => start(S.lvl); $("hm").onclick = home; if ($("fdrill")) $("fdrill").onclick = () => startDrill(S.lvl, S.failTag); $("rate").onclick = openFb;
  ($("go") || $("again")).focus();
}
function setDone() {
  const st = S.set, sc = st.res.filter(Boolean).length;
  $("card").innerHTML = `<span class="pill scenic">${esc(st.title)}</span><p class="big">${sc} / ${st.ids.length}</p><p class="lead">${st.kind === "tide" ? (d5Today() ? "That's today. Your Tide and the Daily Five are both done. +15 XP bonus. See you tomorrow." : "Today's Tide is done. +15 XP bonus. The Daily Five is still waiting.") : st.kind === "myth" ? "Rules hold in every major guide. Choices depend on your reader. Style is your workplace's pick. Myths are school rules the guides reject. <button class=\"link small\" id=\"rcs\">What's the difference?</button>" : st.kind === "mix" ? "Mixing look-alikes is harder than drilling one at a time. That extra effort is what helps you tell them apart later." : st.kind === "review" ? "Reviews feel harder than new questions. That's the point: pulling an answer back after a gap is what makes it last. " + (st.early ? "Early practice doesn't change your review schedule. Due questions count." : `${savedIds().length} question${savedIds().length === 1 ? "" : "s"} left in your review queue.`) : "Drills sharpen one skill at a time. Check your weak spots to see if it moved."}</p><div class="row"><button class="btn" id="hm">Back to home</button><button class="btn ghost" id="ws">See weak spots</button></div>`;
  if ($("rcs")) $("rcs").onclick = () => { S.mode = "rules"; render(); };
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
  if (ONLINE) api("/daily/submit", { ...(AUTH || { guest: guestId() }), date: U.d5.date, res, ms }).then(r => { S.d5day = r.day; if (S.mode === "d5done") render(); }).catch(() => {});
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
  const fill = byGoal(draw(S.lvl, 10 - due.length, due), 5 - due.length);
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
  const wire = () => { document.querySelectorAll("[data-itab]").forEach(b => b.onclick = () => { S.inboxTab = b.dataset.itab; render(); });
    document.querySelectorAll("[data-resetpin]").forEach(b => b.onclick = async () => { const t = b.dataset.resetpin; try { const r = await api("/admin/resetpin", { ...AUTH, target: t }); document.getElementById("rp-" + t).textContent = `New PIN for ${r.name}: ${r.pin}. Send it to them privately.`; } catch (e) { document.getElementById("rp-" + t).textContent = e.message; } }); if ($("hm")) $("hm").onclick = home; };
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
        const pins = r.items.filter(x => x.kind === "pinhelp");
        const items = r.items.filter(x => x.kind !== "report" && x.kind !== "pinhelp");
        const rated = items.filter(x => x.rating);
        const avg = rated.length ? rated.reduce((a, x) => a + x.rating, 0) / rated.length : 0;
        const pinHtml = pins.length ? `<div class="fb tip"><h3>PIN help requests</h3>${pins.map(x => `<p><b>${esc(x.username)}</b> <span class="foot">${new Date(x.at).toLocaleString()}</span><br>${esc(x.note || "No note")}<br><button class="btn ghost small" data-resetpin="${esc(x.username)}">Reset PIN</button> <span class="foot" id="rp-${esc(x.username)}"></span></p>`).join("")}</div>` : "";
        $("card").innerHTML = head + pinHtml + `<p class="prompt">${items.length} response${items.length === 1 ? "" : "s"}${avg ? ` · average ${avg.toFixed(1)} stars` : ""}</p>` +
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
  const q = curQ(); if (q.type === "mor") { if (["1", "2"].includes(e.key)) pick(+e.key - 1); return; } if (q.type !== "mc") return;
  if (["1", "2", "3", "4"].includes(e.key)) pick(S.order[+e.key - 1]);
});
document.querySelectorAll("#tiles .tile").forEach(t => t.onclick = () => {
  if (!U) return; const v = t.dataset.view;
  if (v === "home") home(); else if (v === "review") startReview(); else if (v === "d5") startDaily(); else if (v === "tide") startTide(); else { S.mode = v; render(); }
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
  if (k === GUEST && rec) return enterGuest();
  if (rec) {
    if (ONLINE && rec.token) { try { return enter(k, await api("/login", { user: rec.profile.name, token: rec.token }), false); } catch (e) { S.mode = "welcome"; tag(); render(); return welcome(rec.profile.name); } }
    if (!ONLINE) return enter(k, { name: rec.profile.name, profile: rec.profile }, false);
  }
  S.mode = "welcome"; tag(); render();
})();
