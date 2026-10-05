"use client";

import { useEffect, useState } from "react";
import { DatePicker, SelectMenu } from "@/components/dashboard/controls";
import { formatCurrency, formatVoucherThrough } from "@/lib/format";

type Customer = { id: string; email: string; full_name: string };
type Service = { id: string; name: string };
type Voucher = { id: string; customer_id: string; customer_email: string; code: string; discount_kind: "fixed" | "percent"; discount_value: number; service_name: string | null; expires_at: string; status: string; redeemed_at: string | null };

export function VoucherManager({ services, studioTimezone }: { services: Service[]; studioTimezone: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"fixed" | "percent">("fixed");
  const [value, setValue] = useState("25");
  const [expires, setExpires] = useState("");
  const [serviceId, setServiceId] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true); setLoadError(null);
    try {
      const [customerResponse, voucherResponse] = await Promise.all([fetch("/api/admin/customers", { cache: "no-store" }), fetch("/api/admin/vouchers", { cache: "no-store" })]);
      const customerBody = await customerResponse.json().catch(() => ({})); const voucherBody = await voucherResponse.json().catch(() => ({}));
      if (!customerResponse.ok || !voucherResponse.ok) throw new Error("Unable to load the voucher ledger.");
      setCustomers(customerBody.customers ?? []); setVouchers(voucherBody.vouchers ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load the voucher ledger.");
      setCustomers([]); setVouchers([]);
    } finally { setLoading(false); }
  }
  /* eslint-disable react-hooks/set-state-in-effect -- hydrate the protected ledger after mount. */
  useEffect(() => { void load(); }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function issue(event: React.FormEvent) {
    event.preventDefault(); setMessage(null);
    if (!customerId || !code || !expires) { setMessage("Choose a customer, code, and expiry date."); return; }
    const amount = Number(value); if (!Number.isFinite(amount) || amount <= 0 || (kind === "percent" && amount > 100)) { setMessage("Enter a valid discount."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/vouchers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer_id: customerId, code, discount_kind: kind, discount_value: kind === "fixed" ? Math.round(amount * 100) : Math.round(amount), expires_on: expires, service_id: serviceId === "all" ? null : serviceId }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { setMessage(body.error ?? "Unable to issue voucher."); return; }
      setMessage("Voucher issued to the selected customer."); setCode(""); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to issue voucher."); }
    finally { setBusy(false); }
  }
  async function revoke(id: string) { try { const response = await fetch("/api/admin/vouchers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? "Unable to revoke voucher."); } await load(); setMessage("Voucher revoked."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to revoke voucher."); } }

  const todayInStudio = new Intl.DateTimeFormat("en-CA", { timeZone: studioTimezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  return <div className="admin-voucher-manager"><form onSubmit={issue} className="admin-voucher-form"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Issue a credit</p><h2>Assign a voucher</h2></div><span className="admin-panel-note">One active appointment per voucher</span></div><div className="admin-voucher-fields"><SelectMenu label="Customer" value={customerId} onChange={setCustomerId} options={[{ value: "", label: customers.length ? "Choose a customer" : "No registered customers found", disabled: !customers.length }, ...customers.map((customer) => ({ value: customer.id, label: customer.full_name ? `${customer.full_name} · ${customer.email}` : customer.email }))]} /><label className="dashboard-field-label">Code<input className="field" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="DETAIL25" maxLength={40} /></label><SelectMenu label="Discount" value={kind} onChange={(next) => setKind(next as "fixed" | "percent")} options={[{ value: "fixed", label: "Fixed dollar amount" }, { value: "percent", label: "Percentage" }]} /><label className="dashboard-field-label">Value<input className="field" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} /></label><DatePicker label="Expires through" value={expires} onChange={setExpires} min={todayInStudio} hint={`Studio time · ${studioTimezone}`} /><SelectMenu label="Eligible service" value={serviceId} onChange={setServiceId} options={[{ value: "all", label: "Any active service" }, ...services.map((service) => ({ value: service.id, label: service.name }))]} /></div><button type="submit" disabled={busy || loading} className="dashboard-primary-action">{busy ? "Issuing…" : "Issue voucher"} <span aria-hidden="true">↗</span></button>{message ? <p role="status" className="dashboard-alert">{message}</p> : null}</form><section className="admin-voucher-list" aria-labelledby="voucher-list-heading"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Wallet ledger</p><h2 id="voucher-list-heading">Issued vouchers</h2></div><span className="admin-panel-note">{loading ? "Loading…" : `${vouchers.length} record${vouchers.length === 1 ? "" : "s"}`}</span></div>{loadError ? <p role="alert" className="dashboard-alert dashboard-alert-error">{loadError}</p> : vouchers.length ? <div className="dashboard-list-card">{vouchers.map((voucher) => <div key={voucher.id} className="dashboard-list-row"><div><div className="dashboard-list-title"><strong>{voucher.code}</strong><span className={`dashboard-voucher-status ${voucher.status !== "active" || voucher.redeemed_at ? "is-muted" : ""}`}>{voucher.redeemed_at ? "Used" : voucher.status === "active" && new Date(voucher.expires_at) > new Date() ? "Active" : voucher.status === "revoked" ? "Revoked" : "Expired"}</span></div><p>{voucher.customer_email} · {voucher.discount_kind === "fixed" ? formatCurrency(voucher.discount_value / 100) : `${voucher.discount_value}%`} off{voucher.service_name ? ` · ${voucher.service_name}` : ""}</p><small>Through {formatVoucherThrough(voucher.expires_at, studioTimezone)}</small></div>{voucher.status === "active" && !voucher.redeemed_at ? <button type="button" className="dashboard-danger-link" onClick={() => void revoke(voucher.id)}>Revoke</button> : null}</div>)}</div> : loading ? <p className="dashboard-panel-copy">Loading voucher ledger…</p> : <div className="dashboard-empty-state compact"><h3>No vouchers issued yet.</h3><p>Issue a customer-specific credit when you need one.</p></div>}</section></div>;
}
