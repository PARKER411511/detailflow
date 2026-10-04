import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;

// Load .env.local the same way Next.js does. Explicit process environment
// values remain authoritative and no loaded secret is ever printed.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const publishable = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const key = [publishable, anon].find((value) => value && !value.startsWith("your-") && !value.includes("example")) ?? "";
const customerEmail = (process.env.DETAILFLOW_TEST_CUSTOMER_EMAIL ?? "").trim();
const customerPassword = process.env.DETAILFLOW_TEST_CUSTOMER_PASSWORD ?? "";
const adminEmail = (process.env.DETAILFLOW_TEST_ADMIN_EMAIL ?? "").trim();
const adminPassword = process.env.DETAILFLOW_TEST_ADMIN_PASSWORD ?? "";
function isUnsafePublicKey(value) {
  if (value.startsWith("sb_secret_") || value.includes("service_role")) return true;
  const payload = value.split(".")[1];
  if (!payload) return false;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).role === "service_role"; }
  catch { return false; }
}

const missing = [
  ["NEXT_PUBLIC_SUPABASE_URL", url],
  ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY", key],
  ["DETAILFLOW_TEST_CUSTOMER_EMAIL", customerEmail],
  ["DETAILFLOW_TEST_CUSTOMER_PASSWORD", customerPassword],
  ["DETAILFLOW_TEST_ADMIN_EMAIL", adminEmail],
  ["DETAILFLOW_TEST_ADMIN_PASSWORD", adminPassword],
].filter(([, value]) => !value).map(([name]) => name);

if (missing.length) {
  console.log("Hosted verification skipped; provide two existing isolated test accounts to run it:");
  console.log(`Missing: ${missing.join(", ")}`);
  process.exit(0);
}

if (url.includes("your-project") || key.startsWith("your-") || [publishable, anon].filter(Boolean).some(isUnsafePublicKey)) {
  console.error("Hosted verification requires a real project URL and browser-safe publishable/anon key.");
  process.exit(1);
}

const makeClient = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const customer = makeClient();
const admin = makeClient();

const customerSignIn = await customer.auth.signInWithPassword({ email: customerEmail, password: customerPassword });
if (customerSignIn.error) throw new Error(`Customer sign-in failed: ${customerSignIn.error.message}`);
const { data: customerAdmin, error: customerAdminError } = await customer.rpc("is_admin");
if (customerAdminError) throw new Error(`Customer authorization check failed: ${customerAdminError.message}`);
if (customerAdmin === true) throw new Error("Customer fixture is unexpectedly an admin; use isolated accounts.");
const { data: customerBookings, error: customerBookingsError } = await customer.rpc("admin_list_bookings");
if (customerBookingsError) throw new Error(`Customer isolation check failed: ${customerBookingsError.message}`);
if ((customerBookings ?? []).length !== 0) throw new Error("Customer fixture can read admin bookings.");
console.log("PASS: customer authentication and admin isolation");

const adminSignIn = await admin.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
if (adminSignIn.error) throw new Error(`Admin sign-in failed: ${adminSignIn.error.message}`);
const { data: adminAllowed, error: adminAllowedError } = await admin.rpc("is_admin");
if (adminAllowedError || adminAllowed !== true) throw new Error("Admin fixture is not provisioned in public.admin_members.");
const { error: metricsError } = await admin.rpc("admin_dashboard_metrics");
if (metricsError) throw new Error(`Admin metrics check failed: ${metricsError.message}`);
const { data: bookings, error: bookingsError } = await admin.rpc("admin_list_bookings");
if (bookingsError) throw new Error(`Admin bookings check failed: ${bookingsError.message}`);
console.log(`PASS: admin authorization and read paths (${bookings?.length ?? 0} bookings, metrics available)`);
console.log("Hosted verification performed read-only checks. It created no users, bookings, blocks, or service records.");
