// Proseidon server logic: accounts, scored rounds, leaderboard.
// Storage is injected so this file can be tested without Netlify.
import crypto from "node:crypto";
import { LV, BYID, check, points, rankFor } from "../../../public/bank.js";

const ROUND_TTL = 60 * 60e3;
const LOCK_AFTER = 10;
const LOCK_MS = 15 * 60e3;

const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const okName = u => typeof u === "string" && /^[A-Za-z0-9_]{3,20}$/.test(u);
const okPin = p => typeof p === "string" && /^\d{4}$/.test(p);
const hashPin = (pin, salt) => crypto.scryptSync(pin, salt, 32).toString("hex");
const safeEq = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return `${y}-W${String(w).padStart(2, "0")}`;
}

export async function handle(req, store, now = () => Date.now()) {
  const users = store("users"), rounds = store("rounds"), scores = store("scores");
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
      if (!okName(b.user)) return json({ error: "Use 3 to 20 letters, numbers, or underscores." }, 400);
      if (!okPin(b.pin)) return json({ error: "Your PIN must be 4 digits." }, 400);
      if (await users.get(key, { type: "json" })) return json({ error: "That username is taken. Try another." }, 409);
      const salt = crypto.randomBytes(16).toString("hex");
      const u = { name: b.user, salt, hash: hashPin(b.pin, salt), created: now(), profile: null, tokens: [] };
      const token = newToken(u);
      await users.setJSON(key, u);
      return json({ token, name: u.name, profile: null, allPts: 0, weekPts: 0 });
    }

    if (path === "login" && req.method === "POST") {
      const [u, err] = await auth(); if (err) return err;
      const token = typeof b.token === "string" && u.tokens.includes(b.token) ? b.token : newToken(u);
      await users.setJSON(key, u);
      return json({ token, name: u.name, profile: u.profile, ...(await totals()) });
    }

    if (path === "sync" && req.method === "POST") {
      const [u, err] = await auth(); if (err) return err;
      if (!b.profile || typeof b.profile !== "object") return json({ error: "Missing progress data." }, 400);
      if (JSON.stringify(b.profile).length > 200000) return json({ error: "Progress data too large." }, 413);
      if (!u.profile || (b.profile.updatedAt || 0) >= (u.profile.updatedAt || 0)) { u.profile = b.profile; await users.setJSON(key, u); }
      return json({ ok: true, profile: u.profile });
    }

    if (path === "round/start" && req.method === "POST") {
      const [u, err] = await auth(); if (err) return err;
      const lvl = Number(b.level);
      if (!(Number.isInteger(lvl) && lvl >= 0 && lvl < LV.length)) return json({ error: "Bad level." }, 400);
      const ids = Array.isArray(b.qids) ? b.qids : [];
      if (ids.length !== 5 || new Set(ids).size !== 5 || !ids.every(id => BYID[id] && BYID[id].lvl === lvl)) return json({ error: "Bad questions." }, 400);
      const id = crypto.randomBytes(12).toString("hex");
      await rounds.setJSON(id, { user: key, name: u.name, lvl, ids, i: 0, served: [], streak: 0, right: 0, pts: 0, created: now() });
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
      const q = BYID[r.ids[i]];
      const correct = check(q, b.response);
      const elapsedMs = now() - r.served[i];
      let pts = 0;
      if (correct) { r.streak += 1; r.right += 1; pts = points(r.lvl, elapsedMs, r.streak); } else r.streak = 0;
      r.i += 1;
      const finished = r.i === 5;
      const bonus = finished && r.right >= 4 ? 20 * (r.lvl + 1) : 0;
      r.pts += pts + bonus;
      if (finished) await rounds.delete(rid); else await rounds.setJSON(rid, r);
      if (pts + bonus > 0 || finished) await addPts(u.name, pts + bonus, finished);
      return json({ correct, points: pts, bonus, roundPts: r.pts, elapsedMs, finished, ...(await totals()) });
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
