// Resolves the Redis REST credentials, whichever way the store was provisioned.
//
// The same Upstash database arrives under different variable names depending on the route
// taken: signing up at upstash.com and pasting the values by hand gives UPSTASH_REDIS_REST_*,
// while provisioning from inside the Vercel dashboard injects them automatically and has
// used KV_REST_API_* for the Vercel KV generation. Hardcoding one spelling means the store
// can be correctly set up and the site still silently falls back to its in-memory stub,
// which is exactly the failure this project has already been bitten by once.
//
// Checked in order; first complete pair wins.
const PAIRS = [
  ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
  ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
  ['REDIS_REST_URL', 'REDIS_REST_TOKEN'],
]

/** @returns {{url: string, token: string, source: string} | null} */
export function resolveRedisEnv(env = process.env) {
  for (const [urlKey, tokenKey] of PAIRS) {
    const url = env[urlKey]
    const token = env[tokenKey]
    if (url && token) return { url, token, source: urlKey }
  }
  return null
}

export { PAIRS as REDIS_ENV_PAIRS }
export default resolveRedisEnv
