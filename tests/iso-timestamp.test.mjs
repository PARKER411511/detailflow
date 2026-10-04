import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/iso-timestamp.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const timestampModule = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const normalize = timestampModule.parseIsoTimestampToUtcIso;

test("availability offset timestamps normalize for create and reschedule RPC payloads", () => {
  const availabilitySlot = {
    starts_at: "2026-10-06T12:00:00+00:00",
    ends_at: "2026-10-06T14:30:00+00:00",
  };
  assert.equal(normalize(availabilitySlot.starts_at), "2026-10-06T12:00:00.000Z");
  assert.equal(normalize(availabilitySlot.ends_at), "2026-10-06T14:30:00.000Z");

  const rescheduleSlot = "2026-10-07T08:00:00-04:00";
  assert.equal(normalize(rescheduleSlot), "2026-10-07T12:00:00.000Z");
});

test("strict timestamp validation accepts Z and rejects non-ISO or invalid dates", () => {
  assert.equal(normalize("2026-10-06T12:00:00Z"), "2026-10-06T12:00:00.000Z");
  assert.equal(normalize("2026-10-06T12:00:00.125+05:30"), "2026-10-06T06:30:00.125Z");

  for (const value of [
    "2026-10-06T12:00:00",
    "2026-10-06 12:00:00+00:00",
    "2026-10-06T12:00Z",
    "2026-02-30T12:00:00+00:00",
    "2026-10-06T25:00:00+00:00",
    "2026-10-06T12:00:00+24:00",
    "2026-10-06T12:00:00+0000",
    "2026-10-06T12:00:00.1234+00:00",
    "2026-10-06T12:00:00.123456789Z",
  ]) {
    assert.throws(() => normalize(value), /valid ISO 8601 timestamp/);
  }
});
