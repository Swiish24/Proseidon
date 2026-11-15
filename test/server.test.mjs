// Run: npm test. Exercises the server with in-memory storage and a fake clock.
import assert from "node:assert/strict";
import { handle, isoWeek } from "../netlify/functions/lib/core.mjs";
import { LV, BYID } from "../public/bank.js";

export function memStore() {
  const stores = {};
  return name => {
    const m = stores[name] || (stores[name] = new Map());
    return {
      get: async (k) => (m.has(k) ? JSON.parse(m.get(k)) : null),
      setJSON: async (k, v) => { m.set(k, JSON.stringify(v)); },
      delete: async (k) => { m.delete(k); },
      list: async ({ prefix = "" } = {}) => ({ blobs: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }),
    };
  };
}

const S = memStore();
let clock = Date.UTC(2026, 10, 16, 12, 0, 0);
const now = () => clock;
const call = async (path, body) => {
  const req = new Request("https://x.test/api/" + path, body ? { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {});
  const res = await handle(req, S, now);
  return { status: res.status, ...(await res.json()) };
};
const right = q => (q.type === "type" ? q.acc[0] : q.a);
const wrong = q => (q.type === "type" ? "zzz" : (q.a + 1) % (q.type === "mc" ? 4 : q.s.length));

let r = await call("register", { user: "Dan_W", pin: "1234" });
assert.equal(r.status, 200); const token = r.token;
assert.equal((await call("register", { user: "dan_w", pin: "9999" })).status, 409, "duplicate name blocked");
assert.equal((await call("register", { user: "x", pin: "1234" })).status, 400);
assert.equal((await call("register", { user: "okname", pin: "12a4" })).status, 400);
assert.equal((await call("login", { user: "Dan_W", pin: "0000" })).status, 401);
assert.equal((await call("login", { user: "Dan_W", pin: "1234" })).status, 200);
assert.equal((await call("login", { user: "dan_w", token })).status, 200, "token login, case-insensitive");
assert.equal((await call("login", { user: "nobody1", pin: "1234" })).status, 404);

// lockout after 10 wrong PINs
await call("register", { user: "victim", pin: "1111" });
for (let i = 0; i < 10; i++) await call("login", { user: "victim", pin: "2222" });
assert.equal((await call("login", { user: "victim", pin: "1111" })).status, 429, "locked out");
clock += 16 * 60e3;
assert.equal((await call("login", { user: "victim", pin: "1111" })).status, 200, "unlocks after 15 min");

// sync keeps newest
assert.equal((await call("sync", { user: "Dan_W", token, profile: { lvl: 4, updatedAt: 10 } })).profile.lvl, 4);
assert.equal((await call("sync", { user: "Dan_W", token, profile: { lvl: 1, updatedAt: 5 } })).profile.lvl, 4, "older profile ignored");

// round validation
assert.equal((await call("round/start", { user: "Dan_W", token, level: 4, qids: ["0-1", "4-2", "4-3", "4-4", "4-5"] })).status, 400, "wrong-level question rejected");
const ids = LV[4].q.slice(0, 5).map(q => q.id);
r = await call("round/start", { user: "Dan_W", token, level: 4, qids: ids });
const rid = r.roundId; assert.ok(rid);
assert.equal((await call("round/answer", { user: "Dan_W", token, roundId: rid, i: 0, response: 0 })).status, 409, "must serve before answering");
assert.equal((await call("round/start", { user: "victim", pin: "1111", level: 4, qids: ids })).status, 200);
assert.equal((await call("round/serve", { user: "victim", pin: "1111", roundId: rid, i: 0 })).status, 404, "cannot touch another player's round");

const pts = [];
for (let i = 0; i < 5; i++) {
  await call("round/serve", { user: "Dan_W", token, roundId: rid, i });
  clock += i === 0 ? 500 : i === 1 ? 4000 : i === 2 ? 30000 : 2000;
  const q = BYID[ids[i]];
  const resp = i === 3 ? wrong(q) : right(q);
  const a = await call("round/answer", { user: "Dan_W", token, roundId: rid, i, response: resp });
  assert.equal(a.status, 200); pts.push(a.points);
  if (i === 3) assert.equal(a.correct, false);
  if (i === 4) { assert.equal(a.finished, true); assert.equal(a.bonus, 100, "4/5 clears: bonus 20 x level 5"); }
}
console.log("points per question (fast<1s, 4s, 30s, wrong, 2s):", pts);
assert.equal(pts[0], 50, "under 1s gets no speed bonus");
assert.ok(pts[1] > 50 && pts[2] === Math.round(50 * 1.08), "speed bonus fades, accuracy streak multiplier applies (3 in a row = 1.08)");
assert.equal(pts[3], 0);
assert.equal((await call("round/answer", { user: "Dan_W", token, roundId: rid, i: 5, response: 0 })).status, 404, "finished round closed");

const lb = await call("leaderboard?period=week");
const lbAll = await call("leaderboard?period=all");
console.log("week board:", lb.week, lb.rows, "| all-time:", lbAll.rows);
assert.equal(lb.rows[0].name, "Dan_W"); assert.equal(lb.rows[0].rounds, 1);
assert.equal(lb.rows[0].pts, pts.reduce((a, b) => a + b, 0) + 100);

// new week resets weekly board but not all-time
clock += 8 * 864e5;
assert.equal((await call("leaderboard?period=week")).rows.length, 0);
assert.equal((await call("leaderboard?period=all")).rows.length, 1);
assert.equal(isoWeek(new Date(Date.UTC(2026, 0, 1))), "2026-W01");
console.log("All server tests passed.");

// Usernames with periods and hyphens (real-user report: "emoryy.1")
{
  const reg = async (user) => (await call("register", { user, pin: "2468" })).status;
  assert.equal(await reg("emoryy.1"), 200, "period allowed");
  assert.equal(await reg("jo-ann"), 200, "hyphen allowed");
  assert.equal(await reg(".dot"), 400, "cannot start with a period");
  assert.equal(await reg("dot."), 400, "cannot end with a period");
  assert.equal(await reg("has space"), 400, "spaces blocked");
  assert.equal((await call("login", { user: "Emoryy.1", pin: "2468" })).status, 200, "login is case-insensitive");
  console.log("Username rule tests passed.");
}

// Feedback: anyone can send; only admins can read
{
  const call2 = async (path, body, admins) => { const req = new Request("https://x.test/api/" + path, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }); const res = await handle(req, S, now, { admins }); return { status: res.status, ...(await res.json()) }; };
  assert.equal((await call2("feedback", { rating: 5, comments: "Love the Agora", user: "emoryy.1", level: 3 })).status, 200);
  assert.equal((await call2("feedback", { rating: 0, comments: "" })).status, 400, "empty feedback blocked");
  assert.equal((await call2("feedback", { rating: 9 })).status, 400, "bad rating blocked");
  const tok = (await call2("login", { user: "Dan_W", pin: "4321" === "x" ? "" : "1234" }, "dan_w"));
  assert.equal(tok.isAdmin, true, "admin flag on login");
  assert.equal((await call2("feedback/list", { user: "Dan_W", token: tok.token }, "")).status, 403, "non-admin blocked");
  const list = await call2("feedback/list", { user: "Dan_W", token: tok.token }, "Dan_W, someone");
  assert.equal(list.items.length, 1); assert.equal(list.items[0].comments, "Love the Agora");
  console.log("Feedback tests passed.");
}

// V5: reports, question stats, admin health
{
  const call3 = async (path, body, admins = "dan_w") => { const req = new Request("https://x.test/api/" + path, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }); const res = await handle(req, S, now, { admins }); return { status: res.status, ...(await res.json()) }; };
  assert.equal((await call3("report", { qid: "0-1", note: "Option B is also right?", user: "emoryy.1", answer: 2 })).status, 200);
  assert.equal((await call3("report", { qid: "nope" })).status, 400, "unknown question blocked");
  await call3("stat", { items: [{ qid: "0-1", ok: false }, { qid: "0-1", ok: false }, { qid: "0-2", ok: true }] });
  const t = (await call3("login", { user: "Dan_W", pin: "1234" })).token;
  const h = await call3("admin/health", { user: "Dan_W", token: t });
  assert.equal(h.status, 200); assert.equal(h.rows[0].qid, "0-1"); assert.equal(h.rows[0].miss, 2);
  assert.ok(h.rows.some(r => r.qid === ids[0]), "scored-round answers are tallied too");
  assert.equal((await call3("admin/health", { user: "Dan_W", token: t }, "")).status, 403, "non-admin blocked");
  const inbox = await call3("feedback/list", { user: "Dan_W", token: t });
  assert.ok(inbox.items.some(x => x.kind === "report" && x.qid === "0-1"), "report in inbox");
  console.log("V5 server tests passed.");
}
// V6: Daily Five
{
  const { dailyIds, points } = await import("../public/bank.js");
  const call4 = async (path, body) => { const req = new Request("https://x.test/api/" + path, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }); const res = await handle(req, S, now); return { status: res.status, ...(await res.json()) }; };
  const date = new Date(now()).toISOString().slice(0, 10);
  const ids = dailyIds(date);
  assert.equal(ids.length, 5); assert.deepEqual(ids, dailyIds(date), "same set for everyone");
  assert.notDeepEqual(ids, dailyIds("2020-01-02"), "changes by day");
  assert.ok(ids.every((id, k) => BYID[id].type === "mc" && BYID[id].lvl === [0, 2, 4, 6, 9][k]), "easy to hard");
  assert.equal((await call4("daily/stats", { date: "2001-01-01" })).status, 400, "far dates blocked");
  const t = (await call4("login", { user: "Dan_W", pin: "1234" })).token;
  assert.equal((await call4("daily/submit", { date, res: [true, true, false, true, true] })).status >= 400, true, "sign-in needed");
  let r = await call4("daily/submit", { user: "Dan_W", token: t, date, res: [true, true, false, true, true], ms: 70000 });
  assert.equal(r.day.n, 1); assert.deepEqual(r.day.right, [1, 1, 0, 1, 1]); assert.equal(r.day.dist[4], 1);
  r = await call4("daily/submit", { user: "Dan_W", token: t, date, res: [false, false, false, false, false] });
  assert.ok(r.repeat && r.day.n === 1, "one entry per player per day");
  assert.equal((await call4("daily/submit", { user: "Dan_W", token: t, date, res: [1, 2] })).status, 400);
  const st = await call4("daily/stats", { date });
  assert.deepEqual(st.ids, ids); assert.equal(st.day.n, 1);
  assert.equal(points(0, 15000, 1, "fix"), points(0, 1500, 1, "fix"), "drills have no time pressure");
  console.log("V6 server tests passed.");
}

// V7: accuracy streak carries across rounds; stretch questions unlock at 8
{
  const { LV: L7, BYID: B7, streakMult } = await import("../public/bank.js");
  const c5 = async (path, body) => { const req = new Request("https://x.test/api/" + path, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }); const res = await handle(req, S, now); return { status: res.status, ...(await res.json()) }; };
  await c5("register", { user: "streaky", pin: "2222" });
  const tk = (await c5("login", { user: "streaky", pin: "2222" })).token;
  const mcs = l => L7[l].q.filter(q => q.type === "mc").map(q => q.id);
  const stretchIds = mcs(2).slice(0, 4).concat(mcs(3)[0]);
  assert.equal((await c5("round/start", { user: "streaky", token: tk, level: 2, qids: stretchIds })).status, 400, "stretch locked under 8");
  assert.equal((await c5("round/start", { user: "streaky", token: tk, level: 2, qids: mcs(2).slice(0, 4).concat(L7[2].q.find(q => q.scenic).id) })).status, 400, "scenic items stay out of rounds");
  let last;
  for (let round = 0; round < 2; round++) {
    const ids = mcs(2).slice(round * 5, round * 5 + 5);
    const rid = (await c5("round/start", { user: "streaky", token: tk, level: 2, qids: ids })).roundId;
    for (let i = 0; i < 5; i++) { await c5("round/serve", { user: "streaky", token: tk, roundId: rid, i }); clock += 3000; last = await c5("round/answer", { user: "streaky", token: tk, roundId: rid, i, response: B7[ids[i]].a }); }
  }
  assert.equal(last.astreak, 10, "streak carries across rounds");
  const rid = (await c5("round/start", { user: "streaky", token: tk, level: 2, qids: stretchIds })).roundId;
  assert.ok(rid, "stretch unlocked at 8+");
  for (let i = 0; i < 5; i++) { await c5("round/serve", { user: "streaky", token: tk, roundId: rid, i }); clock += 3000; const q = B7[stretchIds[i]]; last = await c5("round/answer", { user: "streaky", token: tk, roundId: rid, i, response: i === 4 ? (q.a + 1) % 4 : q.a }); }
  assert.equal(last.stretch, true); assert.equal(last.astreak, 14, "missing a stretch question keeps the streak");
  assert.ok(streakMult(26) === 2 && streakMult(100) === 2, "multiplier caps at 2x");
  console.log("V7 server tests passed.");
}

// V8: guests can submit the Daily Five once
{
  const c6 = async (path, body) => { const req = new Request("https://x.test/api/" + path, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }); const res = await handle(req, S, now); return { status: res.status, ...(await res.json()) }; };
  const date = new Date(now()).toISOString().slice(0, 10);
  let r = await c6("daily/submit", { guest: "g0123456789abcdef", date, res: [true, true, true, true, true] });
  assert.equal(r.status, 200); const n = r.day.n;
  r = await c6("daily/submit", { guest: "g0123456789abcdef", date, res: [true, true, true, true, true] });
  assert.ok(r.repeat && r.day.n === n, "one per guest");
  assert.equal((await c6("daily/submit", { guest: "bad-id", date, res: [true, true, true, true, true] })).status >= 400, true, "bad guest id blocked");
  console.log("V8 server tests passed.");
}
