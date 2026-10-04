import process from "node:process";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;

// Match Next.js env-file precedence (.env, .env.local, and mode files) while
// preserving values explicitly supplied by the shell/CI environment.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const publishable = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const strict = process.argv.includes("--strict");
function isUnsafePublicKey(value) {
  if (value.startsWith("sb_secret_") || value.includes("service_role")) return true;
  const payload = value.split(".")[1];
  if (!payload) return false;
  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(decoded).role === "service_role";
  } catch {
    return false;
  }
}

let validUrl = false;
try {
  const parsed = new URL(url);
  validUrl = parsed.protocol === "https:" || parsed.hostname === "localhost";
} catch {
  validUrl = false;
}

const publicKey = [publishable, anon].find((value) => value && !value.startsWith("your-") && !value.includes("example")) ?? "";
const unsafeKey = [publishable, anon].filter(Boolean).some(isUnsafePublicKey);
const configured = Boolean(
  validUrl &&
    !url.includes("your-project") &&
    publicKey &&
    !publicKey.startsWith("your-") &&
    !publicKey.includes("example") &&
    !unsafeKey,
);

console.log(`NEXT_PUBLIC_SUPABASE_URL: ${validUrl ? "set" : "missing or invalid"}`);
console.log(
  `Public browser key: ${configured ? (publishable ? "publishable key set" : "legacy anon key set") : "missing"}`,
);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${serviceRole ? "set (server-only)" : "not set (optional)"}`);
if (unsafeKey) console.log("ERROR: A NEXT_PUBLIC_SUPABASE_* variable contains a server-only key; remove it before building.");

if (!configured) {
  console.log("Configure .env.local from .env.example before using hosted Auth, bookings, or admin data.");
  if (strict || unsafeKey) process.exitCode = 1;
} else {
  console.log("DetailFlow Supabase configuration is ready for local development.");
}
