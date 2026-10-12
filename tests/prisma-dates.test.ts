import assert from "node:assert/strict";
import test from "node:test";
import { timestamp, withDates } from "../src/lib/prisma";

test("timestamp writes retain UTC and millisecond precision", () => {
  assert.equal(timestamp(new Date("2026-10-12T23:00:49.903+05:30")), "2026-10-12 17:30:49.903");
  assert.throws(() => timestamp(new Date("invalid")), RangeError);
});

test("database dates retain their original ISO response shape, including nested rows", () => {
  const result = withDates({
    createdAt: "2026-10-12 17:30:49.903",
    updatedAt: "2026-10-12 17:30:49",
    emailVerified: null,
    messages: [{ createdAt: "2026-10-12 17:30:49.1", content: "unchanged" }],
    _count: { messages: 1 },
    tags: ["peace"],
  });
  assert.equal(result.createdAt.toISOString(), "2026-10-12T17:30:49.903Z");
  assert.equal(result.updatedAt.toISOString(), "2026-10-12T17:30:49.000Z");
  assert.equal(result.messages[0].createdAt.toISOString(), "2026-10-12T17:30:49.100Z");
  assert.equal(result.emailVerified, null);
  assert.deepEqual(result._count, { messages: 1 });
  assert.deepEqual(result.tags, ["peace"]);
  assert.equal(withDates(null), null);
  assert.deepEqual(withDates([]), []);
  assert.throws(() => withDates({ createdAt: "not a timestamp" }), /Invalid database timestamp/);
});
