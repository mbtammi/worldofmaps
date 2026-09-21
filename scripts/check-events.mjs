// The event endpoint is public and unauthenticated, so it must reject anything it did not
// expect — an arbitrary `name` would otherwise write arbitrary fields into the Redis hash.
import assert from 'node:assert'
import handler from '../api/event.js'
import { EVENTS } from '../api/event.js'

function call(body, method = 'POST') {
  return new Promise((resolve) => {
    const res = {
      statusCode: null,
      status(c) { this.statusCode = c; return this },
      json(payload) { resolve({ status: this.statusCode, payload }) },
    }
    handler({ method, body }, res)
  })
}

// Valid events are accepted, including when sendBeacon delivers the body as a string.
for (const name of EVENTS) {
  const r = await call({ name, dayIndex: 256 })
  assert.equal(r.status, 200, `${name} should be accepted`)
}
assert.equal((await call(JSON.stringify({ name: 'game_start', dayIndex: 256 }))).status, 200,
  'a string body (sendBeacon) must parse')

// Anything outside the allow-list is rejected before it reaches Redis.
for (const bad of ['plays', 'wins', 'g_1', 'updatedAt', '__proto__', 'drop', '', null]) {
  const r = await call({ name: bad, dayIndex: 256 })
  assert.equal(r.status, 400, `event name ${JSON.stringify(bad)} must be rejected`)
}

// dayIndex is required and must be numeric, so counters can't land on a junk key.
for (const bad of [undefined, 'abc', {}]) {
  const r = await call({ name: 'game_start', dayIndex: bad })
  assert.equal(r.status, 400, `dayIndex ${JSON.stringify(bad)} must be rejected`)
}

assert.equal((await call({}, 'GET')).status, 405, 'GET must not be allowed')
assert.equal((await call(undefined)).status, 400, 'a missing body must not throw')

console.log(`event endpoint OK (${EVENTS.length} allowed, everything else rejected)`)
