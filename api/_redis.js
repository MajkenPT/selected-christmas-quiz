/* Minimal Upstash/Vercel KV client over the REST API (no dependencies).
   Env: KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN). */
const URL_ = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

exports.configured = () => !!(URL_() && TOKEN());

exports.cmd = async function (...args) {
  const res = await fetch(URL_(), {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN(), "content-type": "application/json" },
    body: JSON.stringify(args)
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "redis " + res.status);
  return data.result;
};
