/* GET    /api/answers?q=q1[&format=csv]   lists the answers for one question, so the draw can be made.
   DELETE /api/answers?q=q1                 deletes all answers for one question (clean-up after tests / after the draw).
   DELETE /api/answers?q=q1&email=a@b.dk&email=c@d.dk   deletes just those answers.
   Both need the header  Authorization: Bearer <ADMIN_TOKEN>. ADMIN_TOKEN is an environment variable;
   it is not the 1234 code from the admin panel. */
const crypto = require("crypto");
const QUIZ = require("../quiz-config.js");
const redis = require("./_redis.js");

const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const csvCell = v => '"' + String(v).replace(/"/g, '""') + '"';

module.exports = async (req, res) => {
  const token = process.env.ADMIN_TOKEN;
  const given = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !same(given, token)) { res.statusCode = 401; return res.end("Unauthorized"); }
  if (!redis.configured()) { res.statusCode = 503; return res.end("Storage not configured"); }

  const url = new URL(req.url, "http://x");
  const q = QUIZ.find(x => x.id === url.searchParams.get("q"));
  if (!q) { res.statusCode = 400; return res.end("Unknown question"); }

  if (req.method === "DELETE") {
    const emails = url.searchParams.getAll("email").map(e => e.trim().toLowerCase()).filter(Boolean).slice(0, 500);
    res.setHeader("content-type", "application/json");
    if (url.searchParams.has("email") && !emails.length) { res.statusCode = 400; return res.end(JSON.stringify({ error: "invalid" })); }
    if (!emails.length) {
      await redis.cmd("DEL", "answers:" + q.id);
      await redis.cmd("DEL", "ids:" + q.id);
      return res.end(JSON.stringify({ ok: true, all: true }));
    }
    const records = await redis.cmd("HMGET", "answers:" + q.id, ...emails);
    const ids = records.filter(Boolean).map(r => JSON.parse(r).id).filter(Boolean);
    const deleted = await redis.cmd("HDEL", "answers:" + q.id, ...emails);
    if (ids.length) await redis.cmd("SREM", "ids:" + q.id, ...ids);
    return res.end(JSON.stringify({ ok: true, deleted }));
  }

  const flat = await redis.cmd("HGETALL", "answers:" + q.id);
  const rows = [];
  for (let i = 1; i < flat.length; i += 2) rows.push(JSON.parse(flat[i]));
  rows.sort((a, b) => a.at - b.at);

  if (url.searchParams.get("format") === "csv") {
    res.setHeader("content-type", "text/csv; charset=utf-8");
    return res.end(["name,email,guess,answered_at"].concat(rows.map(r => [r.name, r.email, r.guess, new Date(r.at).toISOString()].map(csvCell).join(","))).join("\n"));
  }
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(rows));
};
