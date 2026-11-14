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
assert.ok(pts[1] > 50 && pts[2] === Math.round(50 * 1.2), "speed bonus fades, streak multiplier applies");
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
