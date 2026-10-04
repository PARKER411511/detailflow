"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Service } from "@/data/services";
import { formatCurrency, formatTimeZoneLabel } from "@/lib/format";

type Slot = { starts_at: string; ends_at: string; label: string };
export function BookingForm({
  services,
  initialService,
  userEmail,
  studioTimezone,
  bookingHorizonDays,
  configured = true,
}: {
  services: Service[];
  initialService?: string;
  userEmail?: string | null;
  studioTimezone: string;
  bookingHorizonDays: number;
  configured?: boolean;
}) {
  const router = useRouter();
  const [serviceSlug, setServiceSlug] = useState(
    initialService ?? services[0]?.slug ?? "",
  );
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const availabilityRequest = useRef(0);
  const selectedService = useMemo(
    () => services.find((item) => item.slug === serviceSlug),
    [serviceSlug, services],
  );
  const vehicle = [vehicleYear.trim(), vehicleMake.trim(), vehicleModel.trim()].filter(Boolean).join(" ");
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + bookingHorizonDays);
  const dateString = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: studioTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .reduce<Record<string, string>>((result, part) => {
        result[part.type] = part.value;
        return result;
      }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  async function loadSlots(value: string, requestedService = serviceSlug) {
    const requestId = ++availabilityRequest.current;
    setDate(value);
    setSelectedSlot("");
    setSlots([]);
    setMessage(null);
    if (!value || !requestedService) return;
    setLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/availability?date=${encodeURIComponent(value)}&service=${encodeURIComponent(requestedService)}`,
        { cache: "no-store" },
      );
      const body = await response.json();
      if (requestId !== availabilityRequest.current) return;
      if (!response.ok)
        throw new Error(configured ? (body.error ?? "Availability could not be loaded.") : "Appointments unavailable in this preview.");
      setSlots(body.slots ?? []);
      if (!body.slots?.length)
        setMessage({
          type: "error",
          text: "No openings on this date. Try another day.",
        });
    } catch (error) {
      if (requestId !== availabilityRequest.current) return;
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Availability could not be loaded.",
      });
    } finally {
      if (requestId === availabilityRequest.current) setLoadingSlots(false);
    }
  }
  /* eslint-disable react-hooks/set-state-in-effect -- restore the explicitly saved, unsent booking draft after auth navigation. */
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = window.sessionStorage.getItem("detailflow-booking-draft");
    } catch {
      return;
    }
    if (!raw) return;
    const requestId = ++availabilityRequest.current;
    try {
      const draft = JSON.parse(raw) as {
        serviceSlug?: string;
        date?: string;
        selectedSlot?: string;
        vehicle?: string;
        vehicleYear?: string;
        vehicleMakeModel?: string;
        vehicleMake?: string;
        vehicleModel?: string;
        notes?: string;
      };
      const restoredService = services.some((item) => item.slug === draft.serviceSlug)
        ? draft.serviceSlug
        : services[0]?.slug;
      if (!restoredService) return;
      setServiceSlug(restoredService);
      setVehicleYear(draft.vehicleYear ?? "");
      setVehicleMake(draft.vehicleMake ?? draft.vehicleMakeModel ?? draft.vehicle ?? "");
      setVehicleModel(draft.vehicleModel ?? "");
      setNotes(draft.notes ?? "");
      if (draft.date) {
        setDate(draft.date);
        setLoadingSlots(true);
        void fetch(
          `/api/availability?date=${encodeURIComponent(draft.date)}&service=${encodeURIComponent(restoredService)}`,
          { cache: "no-store" },
        )
          .then(async (response) => ({ response, body: await response.json() }))
          .then(({ response, body }) => {
            if (requestId !== availabilityRequest.current) return;
            if (!response.ok) throw new Error(body.error ?? "Availability could not be loaded.");
            setSlots(body.slots ?? []);
            if (draft.selectedSlot && (body.slots ?? []).some((slot: Slot) => slot.starts_at === draft.selectedSlot)) {
              setSelectedSlot(draft.selectedSlot);
            } else if (draft.selectedSlot) {
              setMessage({ type: "error", text: "Your previous time is no longer available. Choose a new opening." });
            }
          })
          .catch((error: unknown) => {
            if (requestId !== availabilityRequest.current) return;
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Availability could not be loaded." });
          })
          .finally(() => {
            if (requestId === availabilityRequest.current) setLoadingSlots(false);
          });
      }
    } catch {
      try {
        window.sessionStorage.removeItem("detailflow-booking-draft");
      } catch {
        // Storage can be blocked by the browser; the form remains usable.
      }
    }
  }, [services]);
  /* eslint-enable react-hooks/set-state-in-effect */
  function saveDraft() {
    try {
      window.sessionStorage.setItem(
        "detailflow-booking-draft",
        JSON.stringify({ serviceSlug, date, selectedSlot, vehicle, vehicleYear, vehicleMake, vehicleModel, notes }),
      );
    } catch {
      // Auth navigation still works when browser storage is unavailable.
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!userEmail) {
      setMessage({
        type: "error",
        text: "Sign in before confirming your appointment. Your selections will stay on this page.",
      });
      return;
    }
    if (!selectedSlot) {
      setMessage({ type: "error", text: "Choose an available time first." });
      return;
    }
    if (!reviewing) {
      setReviewing(true);
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_slug: serviceSlug,
          starts_at: selectedSlot,
          vehicle,
          notes,
        }),
      });
      const body = await response.json();
      if (response.status === 409) {
        setSelectedSlot("");
        if (date) await loadSlots(date);
        throw new Error("That opening was just taken. Choose another available time.");
      }
      if (!response.ok)
        throw new Error(body.error ?? "We could not create that appointment.");
      router.push(
        `/booking/confirmation?reference=${encodeURIComponent(body.reference)}`,
      );
      try {
        window.sessionStorage.removeItem("detailflow-booking-draft");
      } catch {
        // A successful booking does not depend on clearing the local draft.
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "We could not create that appointment.",
      });
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-9">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
              Step 1
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#0b1739]">
              Choose your service
            </h2>
          </div>
          <span className="text-xs text-slate-500">1 / 3</span>
        </div>
        <div className="grid gap-3">
          {services.map((service) => (
            <label
              key={service.slug}
              className={`cursor-pointer rounded-md border p-5 transition focus-within:ring-2 focus-within:ring-blue-600 ${serviceSlug === service.slug ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200"}`}
            >
              <input
                type="radio"
                name="service"
                value={service.slug}
                checked={serviceSlug === service.slug}
                onChange={(event) => {
                  availabilityRequest.current += 1;
                  setServiceSlug(event.target.value);
                  setDate("");
                  setSlots([]);
                  setSelectedSlot("");
                }}
                className="sr-only"
              />
              <span className="flex items-start justify-between gap-4">
                <span>
                  <span className="block font-semibold text-[#0b1739]">
                    {service.name}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-500">
                    {service.duration} · {service.details}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-[#0b1739]">
                  {formatCurrency(service.price)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
              Step 2
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#0b1739]">
              Find a time
            </h2>
          </div>
          <span className="text-xs text-slate-500">2 / 3</span>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Preferred date
          <input
            type="date"
            required
            min={dateString(minDate)}
            max={dateString(maxDate)}
            value={date}
            onChange={(event) => loadSlots(event.target.value)}
            className="mt-2 field"
          />
        </label>
        {!configured && (
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Appointments unavailable in this preview; date and time selection is shown for layout only.
          </p>
        )}
        {date && (
          <div className="mt-5">
            <p className="text-sm font-medium text-slate-700">
              Available start times{" "}
              <span className="font-normal text-slate-500">
                · {formatTimeZoneLabel(studioTimezone)}
              </span>
            </p>
            {loadingSlots ? (
              <p className="mt-4 text-sm text-slate-500">
                {configured ? "Checking studio availability…" : "Checking availability…"}
              </p>
            ) : slots.length ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {slots.map((slot) => (
                  <label
                    key={slot.starts_at}
                    className={`cursor-pointer rounded-md border px-4 py-3 text-center text-sm font-medium focus-within:ring-2 focus-within:ring-blue-600 ${selectedSlot === slot.starts_at ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700 hover:border-blue-300"}`}
                  >
                    <input
                      type="radio"
                      name="slot"
                      value={slot.starts_at}
                      checked={selectedSlot === slot.starts_at}
                      onChange={(event) => setSelectedSlot(event.target.value)}
                      className="sr-only"
                    />
                    {slot.label}
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-500">
                {configured ? "No openings on this date. Try another day." : "Portfolio demo — appointments are unavailable in this preview."}
              </p>
            )}
          </div>
        )}
      </div>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
              Step 3
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#0b1739]">
              Tell us about the car
            </h2>
          </div>
          <span className="text-xs text-slate-500">3 / 3</span>
        </div>
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Year
              <input
                name="vehicle-year"
                inputMode="numeric"
                value={vehicleYear}
                onChange={(event) => setVehicleYear(event.target.value)}
                placeholder="2024"
                className="mt-2 field placeholder:text-slate-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Make
              <input
                required
                name="vehicle-make"
                value={vehicleMake}
                onChange={(event) => setVehicleMake(event.target.value)}
                placeholder="Porsche"
                className="mt-2 field placeholder:text-slate-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Model
              <input
                required
                name="vehicle-model"
                value={vehicleModel}
                onChange={(event) => setVehicleModel(event.target.value)}
                placeholder="911 Carrera"
                className="mt-2 field placeholder:text-slate-500"
              />
            </label>
          </div>
          <label className="text-sm font-medium text-slate-700">
            Anything we should know?
            <textarea
              name="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Paint concerns, access notes, or anything else…"
              className="mt-2 field placeholder:text-slate-500"
            />
          </label>
        </div>
      </div>
      {reviewing && (
        <div className="rounded-md border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
            Review your appointment
          </p>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Service</p>
              <p className="mt-1 font-semibold text-[#0b1739]">
                {selectedService?.name} ·{" "}
                {selectedService ? formatCurrency(selectedService.price) : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Start</p>
              <p className="mt-1 font-semibold text-[#0b1739]">
                {selectedSlot
                  ? new Date(selectedSlot).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: studioTimezone,
                    })
                  : "Choose a time"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Vehicle</p>
              <p className="mt-1 font-semibold text-[#0b1739]">{vehicle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReviewing(false)}
            className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Edit selections
          </button>
        </div>
      )}
      {message && (
        <div
          role="status"
          className={`rounded-md p-4 text-sm leading-6 ${message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}
        >
          {message.text}
        </div>
      )}
      {!userEmail && (
        <div className="rounded-md border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-slate-600">
          Sign in to continue with your appointment request.{" "}
          <Link
            href={`/login?next=${encodeURIComponent("/booking?resume=1")}`}
            onClick={saveDraft}
            className="font-semibold text-blue-700 hover:text-blue-900"
          >
            Sign in or create an account ↗
          </Link>
        </div>
      )}
      <button
        type="submit"
        disabled={submitting || !selectedService}
        className="action-primary w-full px-6 py-4 disabled:cursor-not-allowed"
      >
        {submitting
          ? "Confirming…"
          : reviewing
            ? "Confirm appointment"
            : "Review and continue"}
        <span aria-hidden className="ml-3">
          ↗
        </span>
      </button>
    </form>
  );
}
