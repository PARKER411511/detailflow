import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/format.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const formatModule = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("currency keeps whole-dollar prices compact and preserves voucher cents", () => {
  assert.equal(formatModule.formatCurrency(145), "$145");
  assert.equal(formatModule.formatCurrency(108.75), "$108.75");
  assert.equal(formatModule.formatCurrency(108.5), "$108.50");
});

test("voucher through date stays on the prior studio day at local midnight expiry", () => {
  assert.equal(
    formatModule.formatVoucherThrough("2026-10-05T04:00:00.000Z", "America/New_York"),
    "Oct 4, 2026",
  );
});
