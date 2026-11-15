// Proseidon server logic: accounts, scored rounds, leaderboard.
// Storage is injected so this file can be tested without Netlify.
import crypto from "node:crypto";
import { LV, BYID, check, points, rankFor, dailyIds } from "../../../public/bank.js";

const ROUND_TTL = 60 * 60e3;
const LOCK_AFTER = 10;
const LOCK_MS = 15 * 60e3;

const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
export const NAME_RULE = /^[A-Za-z0-9](?:[A-Za-z0-9_.-]{1,18})[A-Za-z0-9]$/;
const okName = u => typeof u === "string" && NAME_RULE.test(u);
const okPin = p => typeof p === "string" && /^\d{4}$/.test(p);
const hashPin = (pin, salt) => crypto.scryptSync(pin, salt, 32).toString("hex");
// Recovery codes: 10 characters, no look-alike letters, shown once at sign-up. Only a hash is stored.
const RC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => { const b = crypto.randomBytes(10); let c = ""; for (let i = 0; i < 10; i++) c += RC[b[i] % RC.length]; return c.slice(0, 5) + "-" + c.slice(5); };
const normCode = c => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const safeEq = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return `${y}-W${String(w).padStart(2, "0")}`;
}

export async function handle(req, store, now = () => Date.now(), opts = {}) {
  const users = store("users"), rounds = store("rounds"), scores = store("scores"), feedback = store("feedback"), stats = store("stats"), daily = store("daily");
  const admins = String(opts.admins || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/(\.netlify\/functions\/)?api\/?/, "").replace(/\/$/, "");
  let b = {};
  if (req.method === "POST") { try { b = await req.json(); } catch { return json({ error: "Bad request." }, 400); } }
  const key = String(b.user || "").toLowerCase();
  const week = () => isoWeek(new Date(now()));

  async function auth() {
    if (!okName(b.user)) return [null, json({ error: "Invalid username." }, 400)];
    const u = await users.get(key, { type: "json" });
    if (!u) return [null, json({ error: "No player with that username." }, 404)];
    const t = now();
    if (u.lockUntil && u.lockUntil > t) return [null, json({ error: "Too many tries. Wait 15 minutes and try again." }, 429)];
    if (typeof b.token === "string" && (u.tokens || []).includes(b.token)) return [u, null];
    if (okPin(b.pin) && safeEq(hashPin(b.pin, u.salt), u.hash)) {
      if (u.fails) { u.fails = 0; await users.setJSON(key, u); }
      return [u, null];
    }
    if (b.pin != null) {
      u.fails = (u.fails || 0) + 1;
      if (u.fails >= LOCK_AFTER) { u.lockUntil = t + LOCK_MS; u.fails = 0; }
      await users.setJSON(key, u);
      return [null, json({ error: "Wrong PIN." }, 401)];
    }
    return [null, json({ error: "Please sign in again." }, 401)];
  }
  async function tally(qid, ok) {
    if (!BYID[qid]) return;
    const rec = (await stats.get(qid, { type: "json" })) || { n: 0, miss: 0 };
    rec.n += 1; if (!ok) rec.miss += 1;
    await stats.setJSON(qid, rec);
  }
  async function needAdmin() {
    const [u, err] = await auth(); if (err) return err;
    if (!admins.includes(key)) return json({ error: "Only admins can see this." }, 403);
    return null;
  }
  const newToken = u => { const t = crypto.randomBytes(24).toString("hex"); u.tokens = [t, ...(u.tokens || [])].slice(0, 5); return t; };
  async function totals() {
    const a = await scores.get(`all/${key}`, { type: "json" });
    const w = await scores.get(`week/${week()}/${key}`, { type: "json" });
    return { allPts: a ? a.pts : 0, weekPts: w ? w.pts : 0 };
  }
  async function addPts(name, pts, finished) {
    for (const k of [`all/${key}`, `week/${week()}/${key}`]) {
      const rec = (await scores.get(k, { type: "json" })) || { name, pts: 0, rounds: 0 };
      rec.name = name; rec.pts += pts; if (finished) rec.rounds += 1;
      await scores.setJSON(k, rec);
    }
  }

  try {
    if (path === "health") return json({ ok: true });

    if (path === "register" && req.method === "POST") {
      if (!okName(b.user)) return json({ error: "Usernames are 3 to 20 characters: letters, numbers, periods, hyphens, or underscores. Start and end with a letter or number." }, 400);
      if (!okPin(b.pin)) return json({ error: "Your PIN must be 4 digits." }, 400);
      if (await users.get(key, { type: "json" })) return json({ error: "That username is taken. Try another." }, 409);
      const salt = crypto.randomBytes(16).toString("hex");
      const u = { name: b.user, salt, hash: hashPin(b.pin, salt), created: now(), profile: null, tokens: [] };
      const token = newToken(u), recovery = newCode();
      u.rec = hashPin(normCode(recovery), salt);
      await users.setJSON(key, u);
      return json({ token, recovery, name: u.name, profile: null, allPts: 0, weekPts: 0, isAdmin: admins.includes(key) });
    }

    // ---- PIN recovery ----
    if (path === "recovery/new" && req.method === "POST") {
      const [u, err] = await auth(); if (err) return err;
      const recovery = newCode(); u.rec = hashPin(normCode(recovery), u.salt); await users.setJSON(key, u);
      return json({ recovery });
    }
    if (path === "pin/reset" && req.method === "POST") {
      if (!okName(b.user)) return json({ error: "Enter your username." }, 400);
      if (!okPin(b.newPin)) return json({ error: "Your new PIN must be 4 digits." }, 400);
      const u = await users.get(key, { type: "json" });
      if (!u) return json({ error: "No player with that username." }, 404);
      const t = now();
      if (u.lockUntil && u.lockUntil > t) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
      if (!u.rec || !safeEq(hashPin(normCode(b.code), u.salt), u.rec)) {
        u.fails = (u.fails || 0) + 1; if (u.fails >= LOCK_AFTER) { u.lockUntil = t + LOCK_MS; u.fails = 0; }
        await users.setJSON(key, u);
        return json({ error: "That recovery code doesn't match. Check it and try again, or ask for help." }, 401);
      }
      const recovery = newCode();
      u.hash = hashPin(b.newPin, u.salt); u.rec = hashPin(normCode(recovery), u.salt); u.fails = 0; u.lockUntil = 0; u.tokens = [];
      const token = newToken(u); await users.setJSON(key, u);
      return json({ token, recovery, name: u.name, profile: u.profile, isAdmin: admins.includes(key), ...(await totals()) });
    }
    if (path === "pin/help" && req.method === "POST") {
      if (!okName(b.user)) return json({ error: "Enter your username." }, 400);
      if (!(await users.get(key, { type: "json" }))) return json({ error: "No player with that username." }, 404);
      const id = `${now()}-${crypto.randomBytes(4).toString("hex")}`;
      await feedback.setJSON(id, { kind: "pinhelp", at: now(), username: b.user, note: String(b.note || "").trim().slice(0, 400) });
      return json({ ok: true });
    }
    if (path === "admin/resetpin" && req.method === "POST") {
      const bad = await needAdmin(); if (bad) return bad;
      const tk = String(b.target || "").toLowerCase(), u = okName(b.target) && await users.get(tk, { type: "json" });
      if (!u) return json({ error: "No player with that username." }, 404);
      const pin = String(crypto.randomInt(0, 10000)).padStart(4, "0");
      u.hash = hashPin(pin, u.salt); u.tokens = []; u.fails = 0; u.lockUntil = 0; await users.setJSON(tk, u);
      return json({ ok: true, name: u.name, pin });
    }

    if (path === "login" && req.method === "POST") {
      const [u, err] = await auth(); if (err) return err;
      const token = typeof b.token === "string" && u.tokens.includes(b.token) ? b.token : newToken(u);
      await users.setJSON(key, u);
      return json({ token, name: u.name, profile: u.profile, isAdmin: admins.includes(key), ...(await totals()) });
    }

    if (path === "sync" && req.method === "POST") {
      const [u, err] = await auth(); if (err) return err;
      if (!b.profile || typeof b.profile !== "object") return json({ error: "Missing progress data." }, 400);
      if (JSON.stringify(b.profile).length > 100000) return json({ error: "Progress data too large." }, 413);
      if (!u.profile || (b.profile.updatedAt || 0) >= (u.profile.updatedAt || 0)) { u.profile = b.profile; await users.setJSON(key, u); }
      return json({ ok: true, profile: u.profile });
    }

    if (path === "round/start" && req.method === "POST") {
      const [u, err] = await auth(); if (err) return err;
      const lvl = Number(b.level);
      if (!(Number.isInteger(lvl) && lvl >= 0 && lvl < LV.length)) return json({ error: "Bad level." }, 400);
      const ids = Array.isArray(b.qids) ? b.qids : [];
      // A long accuracy streak (8+) unlocks one "stretch" question from the next level.
      // Olympian Trial: one optional harder question (up to two levels up) with a same-level backup if declined.
      let trial = null;
      if (b.trial && Number.isInteger(b.trial.i) && b.trial.i >= 0 && b.trial.i < 5) {
        const tq = BYID[ids[b.trial.i]], aq = BYID[b.trial.alt];
        if (!tq || tq.type !== "mc" || tq.scenic || tq.myth || tq.lvl < lvl || tq.lvl > lvl + 2 || !aq || aq.lvl !== lvl || aq.scenic || aq.myth || ids.includes(aq.id)) return json({ error: "Bad trial." }, 400);
        trial = { i: b.trial.i, alt: aq.id };
      }
      const rest = trial ? ids.filter((_, k) => k !== trial.i) : ids;
      const up = rest.filter(id => BYID[id] && BYID[id].lvl === lvl + 1).length;
      const okIds = rest.every(id => BYID[id] && !BYID[id].scenic && !BYID[id].myth && (BYID[id].lvl === lvl || BYID[id].lvl === lvl + 1));
      if (ids.length !== 5 || new Set(ids).size !== 5 || !okIds || up > 1 || (up === 1 && (u.astreak || 0) < 8)) return json({ error: "Bad questions." }, 400);
      const id = crypto.randomBytes(12).toString("hex");
      await rounds.setJSON(id, { user: key, name: u.name, lvl, ids, trial, calm: !!b.calm, i: 0, served: [], streak: 0, right: 0, pts: 0, created: now() });
      return json({ roundId: id });
    }

    if ((path === "round/serve" || path === "round/answer") && req.method === "POST") {
      const [u, err] = await auth(); if (err) return err;
      const rid = String(b.roundId || "");
      const r = rid && await rounds.get(rid, { type: "json" });
      if (!r || r.user !== key) return json({ error: "Round not found." }, 404);
      if (now() - r.created > ROUND_TTL) { await rounds.delete(rid); return json({ error: "This round expired." }, 410); }
      const i = Number(b.i);
      if (i !== r.i) return json({ error: "Out of order." }, 409);

      if (path === "round/serve") {
        if (!r.served[i]) { r.served[i] = now(); await rounds.setJSON(rid, r); }
        return json({ ok: true });
      }

      if (!r.served[i]) return json({ error: "Out of order." }, 409);
      const isTrial = r.trial && r.trial.i === i, declined = isTrial && !!b.declined;
      const q = BYID[declined ? r.trial.alt : r.ids[i]];
      const correct = check(q, b.response);
      const elapsedMs = now() - r.served[i];
      let pts = 0;
      const stretch = q.lvl !== r.lvl, trialOn = isTrial && !declined;
      const power = 1 + Math.min(u.trials || 0, 10) * 0.02;
      if (correct) { r.streak += 1; r.right += 1; u.astreak = (u.astreak || 0) + 1; pts = points(q.lvl, elapsedMs, u.astreak, r.calm ? "fix" : q.type); if (trialOn) pts *= 3; else if (stretch) pts = Math.round(pts * 1.5); pts = Math.round(pts * power); if (trialOn) u.trials = (u.trials || 0) + 1; }
      else { r.streak = 0; if (!stretch) u.astreak = 0; }
      u.bestStreak = Math.max(u.bestStreak || 0, u.astreak || 0);
      await users.setJSON(key, u);
      await tally(q.id, correct);
      r.i += 1;
      const finished = r.i === 5;
      const bonus = finished && r.right >= 4 ? 20 * (r.lvl + 1) : 0;
      r.pts += pts + bonus;
      if (finished) await rounds.delete(rid); else await rounds.setJSON(rid, r);
      if (pts + bonus > 0 || finished) await addPts(u.name, pts + bonus, finished);
      return json({ correct, points: pts, bonus, roundPts: r.pts, elapsedMs, finished, astreak: u.astreak || 0, bestStreak: u.bestStreak || 0, stretch, trial: trialOn, trials: u.trials || 0, power, ...(await totals()) });
    }

    // ---- Daily Five: shared daily set, kept off the leaderboard ----
    const okDate = d => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && Math.abs(Date.parse(d + "T12:00:00Z") - now()) < 2.5 * 864e5;
    const emptyDay = () => ({ n: 0, right: [0, 0, 0, 0, 0], dist: [0, 0, 0, 0, 0, 0] });
    if (path === "daily/stats" && req.method === "POST") {
      if (!okDate(b.date)) return json({ error: "Bad date." }, 400);
      const ids = dailyIds(b.date), day = (await daily.get(b.date, { type: "json" })) || emptyDay(), all = {};
      for (const id of ids) { const r = await stats.get(id, { type: "json" }); if (r) all[id] = { n: r.n, right: r.n - r.miss }; }
      return json({ ids, day, all });
    }
    if (path === "daily/submit" && req.method === "POST") {
      // Guests can submit too, with a random id kept on their device.
      const guest = typeof b.guest === "string" && /^g[0-9a-f]{16}$/.test(b.guest) && !b.user ? b.guest : null;
      if (!guest) { const [, err] = await auth(); if (err) return err; }
      if (!okDate(b.date)) return json({ error: "Bad date." }, 400);
      const res = Array.isArray(b.res) ? b.res : [];
      if (res.length !== 5 || !res.every(x => typeof x === "boolean")) return json({ error: "Bad results." }, 400);
      const mark = guest ? `${b.date}/g/${guest}` : `${b.date}/u/${key}`;
      const day = (await daily.get(b.date, { type: "json" })) || emptyDay();
      if (await daily.get(mark, { type: "json" })) return json({ ok: true, repeat: true, day });
      day.n += 1; res.forEach((ok, k) => { if (ok) day.right[k] += 1; }); day.dist[res.filter(Boolean).length] += 1;
      await daily.setJSON(b.date, day);
      await daily.setJSON(mark, { at: now(), score: res.filter(Boolean).length, ms: Math.max(0, Math.min(Number(b.ms) || 0, 36e5)) });
      return json({ ok: true, day });
    }

    if (path === "feedback" && req.method === "POST") {
      const rating = Number(b.rating) || 0, comments = String(b.comments || "").trim().slice(0, 1000);
      if (!(rating >= 0 && rating <= 5)) return json({ error: "Rating must be 1 to 5 stars." }, 400);
      if (!rating && !comments) return json({ error: "Add a rating or a comment first." }, 400);
      const id = `${now()}-${crypto.randomBytes(4).toString("hex")}`;
      await feedback.setJSON(id, { at: now(), rating, comments, username: okName(b.user) ? b.user : "", level: Number(b.level) || null });
      return json({ ok: true });
    }

    if (path === "report" && req.method === "POST") {
      const q = BYID[String(b.qid || "")];
      if (!q) return json({ error: "Unknown question." }, 400);
      const note = String(b.note || "").trim().slice(0, 600);
      const id = `${now()}-${crypto.randomBytes(4).toString("hex")}`;
      await feedback.setJSON(id, { kind: "report", at: now(), qid: q.id, note, answer: String(b.answer ?? "").slice(0, 300), username: okName(b.user) ? b.user : "" });
      return json({ ok: true });
    }

    if (path === "stat" && req.method === "POST") {
      // Practice, review, drill, and assessment answers. Scored rounds are tallied on the server already.
      const list = Array.isArray(b.items) ? b.items.slice(0, 10) : [];
      for (const it of list) await tally(String(it.qid || ""), !!it.ok);
      return json({ ok: true });
    }

    if (path === "feedback/list" && req.method === "POST") {
      const bad = await needAdmin(); if (bad) return bad;
      const { blobs } = await feedback.list({ prefix: "" });
      const keys = blobs.map(x => x.key).sort().reverse().slice(0, 300);
      const items = (await Promise.all(keys.map(k => feedback.get(k, { type: "json" })))).filter(Boolean);
      return json({ items });
    }

    if (path === "admin/health" && req.method === "POST") {
      const bad = await needAdmin(); if (bad) return bad;
      const { blobs } = await stats.list({ prefix: "" });
      const rows = (await Promise.all(blobs.map(async x => ({ qid: x.key, ...(await stats.get(x.key, { type: "json" })) }))))
        .filter(r => r.n > 0 && BYID[r.qid]);
      rows.sort((a, c) => c.miss / c.n - a.miss / a.n || c.n - a.n);
      return json({ total: rows.reduce((t, r) => t + r.n, 0), questions: rows.length, rows: rows.slice(0, 60) });
    }

    if (path === "leaderboard" && req.method === "GET") {
      const period = url.searchParams.get("period") === "all" ? "all" : "week";
      const prefix = period === "all" ? "all/" : `week/${week()}/`;
      const { blobs } = await scores.list({ prefix });
      const rows = (await Promise.all(blobs.map(x => scores.get(x.key, { type: "json" })))).filter(r => r && r.pts > 0);
      rows.sort((a, b2) => b2.pts - a.pts);
      const top = rows.slice(0, 50);
      const allPts = period === "all" ? top.map(r => r.pts) : await Promise.all(top.map(async r => { const a = await scores.get(`all/${r.name.toLowerCase()}`, { type: "json" }); return a ? a.pts : r.pts; }));
      return json({ period, week: week(), rows: top.map((r, i) => ({ name: r.name, pts: r.pts, rounds: r.rounds || 0, rank: rankFor(allPts[i]).name })) });
    }

    return json({ error: "Not found." }, 404);
  } catch (e) {
    return json({ error: "Server error. Try again." }, 500);
  }
}
