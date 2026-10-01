import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/timezone.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const timezoneModule = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("wall-time conversion handles configured zones and DST boundaries", () => {
  const convert = timezoneModule.localDateTimeToUtcIso;
  assert.equal(convert("2026-10-10T08:00", "America/New_York"), "2026-10-10T12:00:00.000Z");
  assert.equal(convert("2026-10-10T08:00", "Asia/Kolkata"), "2026-10-10T02:30:00.000Z");
  assert.equal(convert("2026-03-08T03:30", "America/New_York"), "2026-03-08T07:30:00.000Z");
  assert.equal(convert("2026-11-01T03:00", "America/New_York"), "2026-11-01T08:00:00.000Z");
  assert.throws(() => convert("2026-03-08T02:30", "America/New_York"), /does not exist/);
});
