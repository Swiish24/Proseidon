// Cloudflare host. Static files come from public/; /api/* goes to one Durable Object,
// which keeps players, rounds, scores, and feedback in its built-in storage.
import { DurableObject } from "cloudflare:workers";
import { handle } from "../netlify/functions/lib/core.mjs";

export class Store extends DurableObject {
  async fetch(req) {
    const st = this.ctx.storage;
    const store = name => ({
      get: async (k) => (await st.get(`${name}:${k}`)) ?? null,
      setJSON: async (k, v) => { await st.put(`${name}:${k}`, v); },
      delete: async (k) => { await st.delete(`${name}:${k}`); },
      list: async ({ prefix = "" } = {}) => {
        const m = await st.list({ prefix: `${name}:${prefix}` });
        return { blobs: [...m.keys()].map(key => ({ key: key.slice(name.length + 1) })) };
      },
    });
    return handle(req, store, undefined, { admins: this.env.ADMIN_USERS || "" });
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) return env.STORE.get(env.STORE.idFromName("main")).fetch(req);
    return env.ASSETS.fetch(req);
  },
};
