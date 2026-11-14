import { getStore } from "@netlify/blobs";
import { handle } from "./lib/core.mjs";

// Netlify host. Admin usernames (comma-separated) come from the ADMIN_USERS environment variable.
export default async (req) => handle(req, (name) => getStore({ name, consistency: "strong" }), undefined, { admins: process.env.ADMIN_USERS || "" });

export const config = { path: "/api/*" };
