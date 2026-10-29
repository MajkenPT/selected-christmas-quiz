/* GET /api/book   the Christmas book. Returns every episode's date and lock state, but the text and the title only
   for episodes that have unlocked, so nothing is revealed early.
   Preview (for checking the layout): /book?date=2026-12-09&key=<ADMIN_TOKEN> pretends it is that day. */
const crypto = require("crypto");
const STORY = require("./_story.js");

const YEAR = 2026;
const UNLOCK_TIME = "07:00:00+01:00"; /* Danish time, the morning the link is mailed */
const MONTHS = { DECEMBER: "12" };

const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };

function parse(src) {
  const parts = src.split(/\n---\n/);
  const head = parts.shift().split("\n").map(s => s.trim()).filter(Boolean);
  const meta = {
    presents: head[0].replace(/^#\s*/, ""),
    title: head[1].replace(/^#\s*/, ""),
    tagline: head[2].replace(/^\*|\*$/g, ""),
    blurb: head[3].replace(/^\*\*|\*\*$/g, "")
  };
  const episodes = parts.map(part => {
    const lines = part.trim().split("\n");
    const h = lines[0].match(/^##\s+([A-Z]+)\s+(\d+)\s+·\s+EPISODE\s+(\d+)/);
    const day = String(h[2]).padStart(2, "0");
    const ep = {
      no: Number(h[3]),
      date: YEAR + "-" + MONTHS[h[1]] + "-" + day,
      title: lines[1].replace(/^###\s*/, "").trim(),
      tagline: lines[2].replace(/^\*|\*$/g, "").trim(),
      blocks: [], report: {}, outro: []
    };
    ep.unlockAt = new Date(ep.date + "T" + UNLOCK_TIME).toISOString();
    const rest = lines.slice(3).join("\n").trim();
    const reportAt = rest.search(/^\*\*(FINAL )?ELF COMPLIANCE REPORT/m);
    const body = rest.slice(0, reportAt), tail = rest.slice(reportAt).split("\n");
    ep.reportTitle = tail[0].replace(/\*/g, "").trim();
    for (const line of tail.slice(1)) {
      const m = line.trim().match(/^(Rules broken|Rules followed|Christmas spirit|Santa's stress level|Elf certification):\s*(.+)$/);
      if (m) ep.report[m[1]] = m[2]; else if (line.trim()) ep.outro.push(line.trim());
    }
    let letter = false, afterDear = false, prev = ""; /* paragraphs between "DEAR ..." and the next bold card are the letter, shown in italics */
    for (const raw of body.split(/\n\s*\n/)) {
      const x = raw.trim();
      if (!x) continue;
      if (/^\*\*TO BE CONTINUED/.test(x)) continue;
      if (/^\*\*THE END/.test(x)) { ep.blocks.push({ t: "end", x: x.replace(/\*/g, "") }); continue; }
      if (/^\*\*DEAR /.test(x)) { letter = true; afterDear = true; ep.blocks.push({ t: "dear", x: x.replace(/\*/g, "") }); continue; }
      if (/^\*\*[^*]+\*\*$/.test(x)) { letter = false; const c = { t: "card", x: x.replace(/\*/g, "") }; if (afterDear) c.l = 1; if (/wrote:?$/i.test(prev)) c.h = 1; ep.blocks.push(c); prev = x; continue; }
      if (/^\*[^*]+\*$/.test(x)) { ep.blocks.push({ t: "note", x: x.slice(1, -1) }); continue; }
      ep.blocks.push(letter && !/^"/.test(x) ? { t: "p", x, l: 1 } : { t: /^"/.test(x) ? "say" : "p", x });
      prev = x;
    }
    return ep;
  });
  return { meta, episodes };
}

const book = parse(STORY);

module.exports = (req, res) => {
  const url = new URL(req.url, "http://x");
  let now = new Date();
  const previewDate = url.searchParams.get("date"), key = url.searchParams.get("key");
  if (previewDate && /^\d{4}-\d{2}-\d{2}$/.test(previewDate) && process.env.ADMIN_TOKEN && key && same(key, process.env.ADMIN_TOKEN)) {
    now = new Date(previewDate + "T12:00:00+01:00");
  }
  const episodes = book.episodes.map(ep => {
    const unlocked = now >= new Date(ep.unlockAt);
    const out = { no: ep.no, date: ep.date, unlockAt: ep.unlockAt, unlocked };
    if (unlocked) Object.assign(out, { title: ep.title, tagline: ep.tagline, blocks: ep.blocks, reportTitle: ep.reportTitle, report: ep.report, outro: ep.outro });
    return out;
  });
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify({ now: now.toISOString(), meta: book.meta, episodes }));
};
