-- Corrective additive migration for the already-applied dashboard rollout.
-- Customers may read the new booking totals/voucher association alongside the
-- existing customer-visible booking columns, while staff-only columns remain
-- protected by the original column-level grant.
grant select (base_price_cents, discount_cents, voucher_id)
on public.bookings to authenticated;
