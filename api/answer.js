/* POST /api/answer  { q, name, email, guess }
   Stores one answer per email per question. A second answer from the same email is refused (409).
   GET  /api/answer?q=q1  returns the question's "epoch". The epoch goes up whenever an admin deletes the answers,
   so a phone that remembers an old answer can tell that it has been cleared and let its owner answer again. */
const QUIZ = require("../quiz-config.js");
const redis = require("./_redis.js");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const json = (res, status, body) => { res.statusCode = status; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(body)); };

const epochOf = async q => (await redis.cmd("GET", "epoch:" + q.id)) || "0";

module.exports = async (req, res) => {
  if (req.method === "GET") {
    if (!redis.configured()) return json(res, 503, { error: "storage_not_configured" });
    const q = QUIZ.find(x => x.id === new URL(req.url, "http://x").searchParams.get("q"));
    if (!q) return json(res, 400, { error: "invalid" });
    res.setHeader("cache-control", "no-store");
    try { return json(res, 200, { epoch: await epochOf(q) }); } catch (e) { return json(res, 500, { error: "storage" }); }
  }
  if (req.method !== "POST") { res.setHeader("allow", "POST"); return json(res, 405, { error: "method" }); }
  if (!redis.configured()) return json(res, 503, { error: "storage_not_configured" });

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== "object") return json(res, 400, { error: "invalid" });

  const q = QUIZ.find(x => x.id === b.q);
  if (!q) return json(res, 400, { error: "invalid" });

  const now = Date.now();
  if (now < Date.parse(q.opens) || now >= Date.parse(q.closes)) return json(res, 403, { error: "closed" });

  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim().toLowerCase();
  const guess = typeof b.guess === "number" ? b.guess : NaN;
  if (name.length < 2 || name.length > 80 || email.length > 120 || !EMAIL.test(email)) return json(res, 400, { error: "invalid" });
  if (!isFinite(guess) || guess < q.min || guess > q.max || (q.kind === "int" && !Number.isInteger(guess))) return json(res, 400, { error: "invalid" });

  try {
    const added = await redis.cmd("HSETNX", "answers:" + q.id, email, JSON.stringify({ q: q.id, name, email, guess, at: now }));
    if (added !== 1) return json(res, 409, { error: "duplicate" });
    return json(res, 200, { ok: true, epoch: await epochOf(q) });
  } catch (e) {
    return json(res, 500, { error: "storage" });
  }
};
