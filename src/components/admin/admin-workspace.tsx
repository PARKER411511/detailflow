"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { AdminBookingActions } from "@/components/admin/booking-actions";

type Booking = {
  id: string;
  reference: string;
  starts_at: string;
  status: string;
  total_price_cents: number;
  customer_email: string | null;
  service_name: string;
  vehicle_description: string;
};
type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  details: string;
  duration_minutes: number;
  price_cents: number;
  active: boolean;
  display_order: number;
};
type Hour = {
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  closed: boolean;
};
type Customer = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  booking_count: number;
  last_booking_at: string | null;
};
type CustomerBooking = {
  id: string;
  reference: string;
  starts_at: string;
  ends_at: string;
  status: string;
  service_name: string;
  vehicle_description: string;
  total_price_cents: number;
};
type Notice = { kind: "success" | "error"; text: string };
const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const blankService: Omit<ServiceRow, "id"> = {
  slug: "",
  name: "",
  eyebrow: "",
  description: "",
  details: "",
  duration_minutes: 60,
  price_cents: 0,
  active: true,
  display_order: 1,
};

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "The admin request failed.");
  return body;
}

function localDateTimeInput(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .formatToParts(new Date(value))
    .filter((part) => part.type !== "literal")
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function AdminWorkspace({
  initialBookings,
  initialServices,
  studioTimezone,
}: {
  initialBookings: Booking[];
  initialServices: ServiceRow[];
  studioTimezone: string;
}) {
  const [tab, setTab] = useState<
    "bookings" | "services" | "schedule" | "customers"
  >("bookings");
  const bookings = initialBookings;
  const [services, setServices] = useState(initialServices);
  const [hours, setHours] = useState<Hour[]>([]);
  const [blocks, setBlocks] = useState<
    Array<{
      id: string;
      starts_at: string;
      ends_at: string;
      reason: string;
      active: boolean;
    }>
  >([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loadingTab, setLoadingTab] = useState<"schedule" | "customers" | null>(null);
  const [saving, setSaving] = useState<"service" | "hours" | "block" | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    service: "all",
    date: "",
  });
  const [blockForm, setBlockForm] = useState({
    id: null as string | null,
    starts_at: "",
    ends_at: "",
    reason: "",
  });
  function notify(kind: Notice["kind"], text: string) {
    setNotice({ kind, text });
  }
  /* eslint-disable react-hooks/set-state-in-effect -- tab changes intentionally trigger remote admin loads. */
  useEffect(() => {
    if (tab === "schedule") {
      setLoadingTab("schedule");
      void Promise.all([
        requestJson("/api/admin/schedule", { cache: "no-store" }),
        requestJson("/api/admin/blocks", { cache: "no-store" }),
      ])
        .then(([hoursBody, blocksBody]) => {
          setHours(hoursBody.hours ?? []);
          setBlocks(blocksBody.blocks ?? []);
        })
        .catch((error: unknown) => notify("error", error instanceof Error ? error.message : "Unable to load schedule."))
        .finally(() => setLoadingTab((current) => (current === "schedule" ? null : current)));
    }
    if (tab === "customers") {
      setLoadingTab("customers");
      void requestJson("/api/admin/customers", { cache: "no-store" })
        .then((body) => setCustomers(body.customers ?? []))
        .catch((error: unknown) => notify("error", error instanceof Error ? error.message : "Unable to load customers."))
        .finally(() => setLoadingTab((current) => (current === "customers" ? null : current)));
    }
  }, [tab]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const filteredBookings = useMemo(() => {
    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: studioTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return bookings.filter(
      (booking) =>
        (filters.status === "all" || booking.status === filters.status) &&
        (filters.service === "all" || booking.service_name === filters.service) &&
        (!filters.date ||
          dateFormatter.format(new Date(booking.starts_at)) === filters.date),
    );
  }, [bookings, filters, studioTimezone]);
  async function saveService() {
    if (!editing) return;
    setSaving("service");
    try {
      const body = await requestJson("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      setServices((current) =>
        current.some((item) => item.id === editing.id)
          ? current.map((item) => (item.id === editing.id ? body.service : item))
          : [...current, body.service],
      );
      setEditing(null);
      notify("success", "Service saved.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Unable to save service.");
    } finally {
      setSaving(null);
    }
  }
  async function saveHours(hour: Hour) {
    setSaving("hours");
    try {
      await requestJson("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hour),
      });
      notify("success", "Hours saved.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Unable to save hours.");
    } finally {
      setSaving(null);
    }
  }
  async function saveBlock(event: React.FormEvent) {
    event.preventDefault();
    setSaving("block");
    try {
      const body = await requestJson("/api/admin/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starts_at: blockForm.starts_at,
          ends_at: blockForm.ends_at,
          reason: blockForm.reason,
          id: blockForm.id,
          active: true,
        }),
      });
      setBlocks((current) =>
        blockForm.id
          ? current.map((item) => (item.id === blockForm.id ? body.block : item))
          : [...current, body.block],
      );
      setBlockForm({ id: null, starts_at: "", ends_at: "", reason: "" });
      notify("success", "Blocked interval saved.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Unable to save block.");
    } finally {
      setSaving(null);
    }
  }
  return (
    <div className="mt-10 border-t border-slate-300 bg-white px-1 py-8 sm:px-2 sm:py-10">
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-5">
        {(
          [
            ["bookings", "Bookings"],
            ["services", "Services"],
            ["schedule", "Hours & blocks"],
            ["customers", "Customers"],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            key={value}
            onClick={() => setTab(value)}
            className={`px-4 py-2 text-sm font-semibold ${tab === value ? "bg-[#173e8d] text-white" : "text-slate-500 hover:bg-slate-50"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {loadingTab && (
        <p role="status" className="mt-5 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          Loading {loadingTab === "schedule" ? "hours and blocked intervals" : "customers"}…
        </p>
      )}
      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`mt-5 rounded-md p-3 text-sm ${notice.kind === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}
        >
          {notice.text}
        </p>
      )}
      {tab === "bookings" && (
        <BookingsPanel
          bookings={filteredBookings}
          allBookings={bookings}
          filters={filters}
          setFilters={setFilters}
          studioTimezone={studioTimezone}
        />
      )}
      {tab === "services" && (
        <ServicesPanel
          services={services}
          editing={editing}
          setEditing={setEditing}
          saveService={saveService}
          saving={saving === "service"}
        />
      )}
      {tab === "schedule" && (
        <SchedulePanel
          hours={hours}
          setHours={setHours}
          blocks={blocks}
          setBlocks={setBlocks}
          blockForm={blockForm}
          setBlockForm={setBlockForm}
          saveHours={saveHours}
          saveBlock={saveBlock}
          studioTimezone={studioTimezone}
          saving={saving}
        />
      )}
      {tab === "customers" && (
        <CustomersPanel customers={customers} studioTimezone={studioTimezone} />
      )}
    </div>
  );
}

function BookingsPanel({
  bookings,
  allBookings,
  filters,
  setFilters,
  studioTimezone,
}: {
  bookings: Booking[];
  allBookings: Booking[];
  filters: { status: string; service: string; date: string };
  setFilters: (value: {
    status: string;
    service: string;
    date: string;
  }) => void;
  studioTimezone: string;
}) {
  const services = [
    ...new Set(allBookings.map((booking) => booking.service_name)),
  ];
  const groupedBookings = useMemo(() => {
    const dayFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: studioTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const groups = new Map<string, Booking[]>();
    for (const booking of bookings) {
      const day = dayFormatter.format(new Date(booking.starts_at));
      groups.set(day, [...(groups.get(day) ?? []), booking]);
    }
    return [...groups.entries()];
  }, [bookings, studioTimezone]);
  return (
    <div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <label className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">
          Date
          <input
            type="date"
            value={filters.date}
            onChange={(event) =>
              setFilters({ ...filters, date: event.target.value })
            }
            className="field mt-2 font-normal"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">
          Service
          <select
            value={filters.service}
            onChange={(event) =>
              setFilters({ ...filters, service: event.target.value })
            }
            className="field mt-2 font-normal"
          >
            <option value="all">All services</option>
            {services.map((service) => (
              <option key={service}>{service}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">
          Status
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters({ ...filters, status: event.target.value })
            }
            className="field mt-2 font-normal capitalize"
          >
            <option value="all">All statuses</option>
            {[
              "requested",
              "confirmed",
              "in_service",
              "completed",
              "cancelled",
            ].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-[.12em] text-slate-500">
              <th className="pb-3 pr-4">When</th>
              <th className="pb-3 pr-4">Customer</th>
              <th className="pb-3 pr-4">Service / vehicle</th>
              <th className="pb-3 pr-4">Total</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="py-4 pr-4">
                  <p className="font-semibold text-[#0b1739]">
                    {formatDate(booking.starts_at, studioTimezone)}
                  </p>
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {booking.reference} · Details
                  </Link>
                </td>
                <td className="py-4 pr-4 text-slate-600">
                  {booking.customer_email}
                </td>
                <td className="py-4 pr-4 text-slate-600">
                  {booking.service_name}
                  <br />
                  <span className="text-xs">{booking.vehicle_description}</span>
                </td>
                <td className="py-4 pr-4 text-slate-600">
                  {formatCurrency(booking.total_price_cents / 100)}
                </td>
                <td className="py-4">
                  <AdminBookingActions
                    bookingId={booking.id}
                    status={booking.status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-5 text-xs text-slate-500">
        Showing {bookings.length} of {allBookings.length} records · calendar
        uses the studio’s configured timezone.
      </p>
      <div className="mt-8 border-t border-slate-100 pt-6">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
          Calendar agenda
        </p>
        <div className="mt-4 space-y-6">
          {groupedBookings.length ? (
            groupedBookings.map(([day, dayBookings]) => (
              <section key={day} aria-labelledby={`calendar-${day}`}>
                <h3
                  id={`calendar-${day}`}
                  className="border-b border-slate-100 pb-2 text-sm font-bold text-[#0b1739]"
                >
                  {new Intl.DateTimeFormat("en-US", {
                    timeZone: studioTimezone,
                    dateStyle: "full",
                  }).format(new Date(dayBookings[0].starts_at))}
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dayBookings.map((booking) => (
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      key={`cal-${booking.id}`}
                      className="block rounded-2xl bg-[#eff6ff] p-4 hover:bg-blue-100"
                    >
                      <p className="text-xs font-semibold text-blue-700">
                        {formatDate(booking.starts_at, studioTimezone)}
                      </p>
                      <p className="mt-2 font-semibold text-[#0b1739]">
                        {booking.service_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {booking.status} · {booking.vehicle_description}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
              No appointments match the selected filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ServicesPanel({
  services,
  editing,
  setEditing,
  saveService,
  saving,
}: {
  services: ServiceRow[];
  editing: ServiceRow | null;
  setEditing: (value: ServiceRow | null) => void;
  saveService: () => void;
  saving: boolean;
}) {
  return (
    <div>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Edit active price, duration, copy, and visibility.
        </p>
        <button
          type="button"
          onClick={() => setEditing({ id: "", ...blankService })}
          className="action-primary px-4 py-2 text-sm"
        >
          Add service
        </button>
      </div>
      {editing && (
        <div className="mt-6 grid gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:grid-cols-2">
          <Field
            label="Name"
            value={editing.name}
            onChange={(value) => setEditing({ ...editing, name: value })}
          />
          <Field
            label="Slug"
            value={editing.slug}
            onChange={(value) => setEditing({ ...editing, slug: value })}
          />
          <Field
            label="Eyebrow"
            value={editing.eyebrow}
            onChange={(value) => setEditing({ ...editing, eyebrow: value })}
          />
          <Field
            label="Price ($)"
            value={(editing.price_cents / 100).toFixed(2)}
            onChange={(value) =>
              setEditing({
                ...editing,
                price_cents: Math.round(Number(value) * 100),
              })
            }
          />
          <Field
            label="Duration (minutes)"
            value={String(editing.duration_minutes)}
            onChange={(value) =>
              setEditing({ ...editing, duration_minutes: Number(value) })
            }
          />
          <Field
            label="Display order"
            value={String(editing.display_order)}
            onChange={(value) =>
              setEditing({ ...editing, display_order: Number(value) })
            }
          />
          <Field
            label="Description"
            value={editing.description}
            onChange={(value) => setEditing({ ...editing, description: value })}
            wide
          />
          <Field
            label="Included details"
            value={editing.details}
            onChange={(value) => setEditing({ ...editing, details: value })}
            wide
          />
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={editing.active}
              onChange={(event) =>
                setEditing({ ...editing, active: event.target.checked })
              }
            />{" "}
            Publicly active
          </label>
          <div className="flex items-center gap-4 sm:col-span-2">
            <button
              type="button"
              onClick={saveService}
              disabled={saving}
              className="action-primary px-5 py-3 text-sm"
            >
              {saving ? "Saving…" : "Save service"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-sm font-semibold text-slate-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="mt-7 grid gap-3 md:grid-cols-3">
        {services.map((service) => (
          <button
            type="button"
            key={service.id}
            onClick={() => setEditing(service)}
            className="rounded-2xl border border-slate-200 p-4 text-left hover:border-blue-300"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#0b1739]">{service.name}</p>
              <span
                className={`text-xs font-semibold ${service.active ? "text-emerald-600" : "text-slate-500"}`}
              >
                {service.active ? "Active" : "Hidden"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {service.duration_minutes} min ·{" "}
              {formatCurrency(service.price_cents / 100)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
}) {
  return (
    <label
      className={`text-xs font-semibold uppercase tracking-[.12em] text-slate-500 ${wide ? "sm:col-span-2" : ""}`}
    >
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-2 font-normal normal-case tracking-normal"
      />
    </label>
  );
}

function SchedulePanel({
  hours,
  setHours,
  blocks,
  setBlocks,
  blockForm,
  setBlockForm,
  saveHours,
  saveBlock,
  studioTimezone,
  saving,
}: {
  hours: Hour[];
  setHours: (value: Hour[]) => void;
  blocks: Array<{
    id: string;
    starts_at: string;
    ends_at: string;
    reason: string;
    active: boolean;
  }>;
  setBlocks: React.Dispatch<React.SetStateAction<Array<{ id: string; starts_at: string; ends_at: string; reason: string; active: boolean }>>>;
  blockForm: { id: string | null; starts_at: string; ends_at: string; reason: string };
  setBlockForm: (value: {
    id: string | null;
    starts_at: string;
    ends_at: string;
    reason: string;
  }) => void;
  saveHours: (hour: Hour) => void;
  saveBlock: (event: React.FormEvent) => void;
  studioTimezone: string;
  saving: "service" | "hours" | "block" | null;
}) {
  const [blockBusy, setBlockBusy] = useState<string | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);
  return (
    <div>
      <p className="mt-6 text-sm text-slate-500">
        Opening hours are stored in the configured business timezone and feed
        availability directly.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {hours.map((hour) => (
          <div
            key={hour.weekday}
            className="rounded-2xl border border-slate-200 p-4"
          >
            <p className="font-semibold text-[#0b1739]">
              {dayNames[hour.weekday]}
            </p>
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={hour.closed}
                onChange={(event) =>
                  setHours(
                    hours.map((item) =>
                      item.weekday === hour.weekday
                        ? {
                            ...item,
                            closed: event.target.checked,
                            opens_at: event.target.checked
                              ? null
                              : (item.opens_at ?? "08:00"),
                            closes_at: event.target.checked
                              ? null
                              : (item.closes_at ?? "18:00"),
                          }
                        : item,
                    ),
                  )
                }
              />{" "}
              Closed
            </label>
            {!hour.closed && (
              <>
                <input
                  type="time"
                  aria-label={`${dayNames[hour.weekday]} opening time`}
                  value={hour.opens_at ?? "08:00"}
                  onChange={(event) =>
                    setHours(
                      hours.map((item) =>
                        item.weekday === hour.weekday
                          ? { ...item, opens_at: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className="field mt-3 px-2 py-2 text-sm"
                />
                <input
                  type="time"
                  aria-label={`${dayNames[hour.weekday]} closing time`}
                  value={hour.closes_at ?? "18:00"}
                  onChange={(event) =>
                    setHours(
                      hours.map((item) =>
                        item.weekday === hour.weekday
                          ? { ...item, closes_at: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className="field mt-2 px-2 py-2 text-sm"
                />
              </>
            )}
            <button
              type="button"
              onClick={() => saveHours(hour)}
              disabled={saving !== null}
              className="mt-3 text-xs font-semibold text-blue-600 disabled:opacity-50"
            >
              {saving === "hours" ? "Saving…" : "Save hours"}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-10 border-t border-slate-100 pt-7">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
          Blocked intervals
        </p>
        <form onSubmit={saveBlock} className="mt-4 grid gap-3 sm:grid-cols-3">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600 sm:col-span-3">
            {blockForm.id ? "Edit blocked interval" : "Add blocked interval"}
          </p>
          <label className="text-xs font-semibold text-slate-500">
            Starts
            <input
              required
              type="datetime-local"
              value={blockForm.starts_at}
              onChange={(event) =>
                setBlockForm({ ...blockForm, starts_at: event.target.value })
              }
              className="field mt-2 font-normal"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Ends
            <input
              required
              type="datetime-local"
              value={blockForm.ends_at}
              onChange={(event) =>
                setBlockForm({ ...blockForm, ends_at: event.target.value })
              }
              className="field mt-2 font-normal"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Reason
            <input
              required
              value={blockForm.reason}
              onChange={(event) =>
                setBlockForm({ ...blockForm, reason: event.target.value })
              }
              className="field mt-2 font-normal"
            />
          </label>
          <button
            type="submit"
            disabled={saving !== null}
            className="action-primary px-4 py-3 text-sm sm:col-span-3 sm:justify-self-start"
          >
            {saving === "block" ? "Saving…" : blockForm.id ? "Save blocked interval" : "Add blocked interval"}
          </button>
        </form>
        {blockError && <p className="mt-3 text-xs text-rose-600">{blockError}</p>}
        {blocks.length ? (
          <div className="mt-5 divide-y divide-slate-100">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <span className="font-medium text-[#0b1739]">
                  {formatDate(block.starts_at, studioTimezone)} → {formatDate(block.ends_at, studioTimezone)}
                </span>
                <span className="text-slate-500">
                  {block.reason} · {block.active ? "Active" : "Released"}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setBlockForm({
                        id: block.id,
                        starts_at: localDateTimeInput(block.starts_at, studioTimezone),
                        ends_at: localDateTimeInput(block.ends_at, studioTimezone),
                        reason: block.reason,
                      })
                    }
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  {block.active && (
                    <button
                      type="button"
                      disabled={blockBusy === block.id}
                      onClick={async () => {
                        setBlockBusy(block.id);
                        setBlockError(null);
                        try {
                          await requestJson("/api/admin/blocks", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: block.id,
                              starts_at: block.starts_at,
                              ends_at: block.ends_at,
                              reason: block.reason,
                              active: false,
                            }),
                          });
                          setBlocks((current) =>
                            current.map((item) =>
                              item.id === block.id ? { ...item, active: false } : item,
                            ),
                          );
                        } catch (error) {
                          setBlockError(error instanceof Error ? error.message : "Unable to release block.");
                        } finally {
                          setBlockBusy(null);
                        }
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-40"
                    >
                      {blockBusy === block.id ? "Releasing…" : "Release"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-slate-500">No blocked intervals.</p>
        )}
      </div>
    </div>
  );
}

function CustomersPanel({ customers, studioTimezone }: { customers: Customer[]; studioTimezone: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, CustomerBooking[]>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleHistory(customerId: string) {
    setError(null);
    if (expanded === customerId) {
      setExpanded(null);
      return;
    }
    setExpanded(customerId);
    if (history[customerId]) return;
    setLoading(customerId);
    try {
      const body = await requestJson(`/api/admin/customers/${customerId}`, {
        cache: "no-store",
      });
      setHistory((current) => ({ ...current, [customerId]: body.bookings ?? [] }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load booking history.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <p className="mt-6 text-sm text-slate-500">
        Customer profiles and booking history from the protected admin RPC.
      </p>
      {customers.length ? (
        <div className="mt-6 divide-y divide-slate-100">
          {customers.map((customer) => (
            <div key={customer.id}>
              <div className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-semibold text-[#0b1739]">
                    {customer.full_name || "Unnamed customer"}
                  </p>
                  <p className="text-sm text-slate-500">{customer.email}</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>
                    {customer.booking_count} booking
                    {customer.booking_count === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs">
                    {customer.last_booking_at
                      ? `Last ${formatDate(customer.last_booking_at, studioTimezone)}`
                      : "No history"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleHistory(customer.id)}
                  className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-600 hover:border-blue-300 sm:w-auto"
                >
                  {expanded === customer.id ? "Hide history" : "View history"}
                </button>
              </div>
              {expanded === customer.id && (
              <div className="rounded-2xl bg-slate-50 p-4">
                {loading === customer.id ? (
                  <p className="text-sm text-slate-500">Loading booking history…</p>
                ) : history[customer.id]?.length ? (
                  <div className="space-y-3">
                    {history[customer.id].map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/admin/bookings/${booking.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm hover:ring-2 hover:ring-blue-200"
                      >
                        <span>
                          <span className="font-semibold text-[#0b1739]">{booking.service_name}</span>
                          <span className="ml-2 text-xs text-slate-500">{booking.reference}</span>
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDate(booking.starts_at, studioTimezone)} · {booking.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No booking history.</p>
                )}
              </div>
            )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
          No customers found.
        </p>
      )}
      {error && <p className="mt-4 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

