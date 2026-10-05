"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export function SelectMenu({ label, value, options, onChange, hint, disabled = false, ariaLabel }: { label: string; value: string; options: SelectOption[]; onChange: (value: string) => void; hint?: string; disabled?: boolean; ariaLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)));
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listId = useId();
  const labelId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];
  function close(returnFocus = false) { setOpen(false); if (returnFocus) window.requestAnimationFrame(() => triggerRef.current?.focus()); }
  useEffect(() => {
    function onPointer(event: PointerEvent) { if (!rootRef.current?.contains(event.target as Node)) close(); }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);
  useEffect(() => { if (open) window.requestAnimationFrame(() => optionRefs.current[activeIndex]?.focus()); }, [open, activeIndex]);
  function openMenu(index = Math.max(0, options.findIndex((option) => option.value === value))) { setActiveIndex(index); setOpen(true); }
  function moveIndex(direction: 1 | -1 | "home" | "end") { const next = direction === "home" ? 0 : direction === "end" ? options.length - 1 : Math.max(0, Math.min(options.length - 1, activeIndex + direction)); setActiveIndex(next); }
  return <div ref={rootRef} className="dashboard-select">
    <span id={labelId} className="dashboard-control-label">{label}</span>{hint ? <span className="dashboard-control-hint">{hint}</span> : null}
    <button ref={triggerRef} type="button" className="dashboard-select-trigger" aria-labelledby={ariaLabel ? undefined : labelId} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} disabled={disabled} onClick={() => open ? close(true) : openMenu()} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") { event.preventDefault(); openMenu(); } else if (event.key === "ArrowUp") { event.preventDefault(); openMenu(options.length - 1); } }}><span>{selected?.label ?? "Choose an option"}</span><span aria-hidden="true" className={`dashboard-select-chevron ${open ? "is-open" : ""}`}>⌄</span></button>
    {open ? <div id={listId} role="listbox" aria-labelledby={labelId} className="dashboard-select-popover">{options.map((option, index) => <button ref={(element) => { optionRefs.current[index] = element; }} type="button" role="option" aria-selected={option.value === value} disabled={option.disabled} key={option.value} className={`dashboard-select-option ${option.value === value ? "is-selected" : ""}`} onClick={() => { if (option.disabled) return; onChange(option.value); close(true); }} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); moveIndex(1); } else if (event.key === "ArrowUp") { event.preventDefault(); moveIndex(-1); } else if (event.key === "Home") { event.preventDefault(); moveIndex("home"); } else if (event.key === "End") { event.preventDefault(); moveIndex("end"); } else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (!option.disabled) { onChange(option.value); close(true); } } else if (event.key === "Escape") { event.preventDefault(); close(true); } }}><span>{option.label}</span>{option.value === value ? <span aria-hidden="true">✓</span> : null}</button>)}</div> : null}
  </div>;
}

function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function parseDateKey(value: string) { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day, 12); }
function monthDays(month: Date) { const first = new Date(month.getFullYear(), month.getMonth(), 1, 12); first.setDate(1 - first.getDay()); return Array.from({ length: 42 }, (_, index) => { const current = new Date(first); current.setDate(first.getDate() + index); return current; }); }

export function DatePicker({ label, value, onChange, min, max, disabled, hint }: { label: string; value: string; onChange: (value: string) => void; min?: string; max?: string; disabled?: (value: string) => boolean; hint?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dayRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [cursor, setCursor] = useState(() => (value ? parseDateKey(value) : new Date()));
  const [focusIndex, setFocusIndex] = useState(0);
  const titleId = useId();
  const labelId = useId();
  const days = useMemo(() => monthDays(cursor), [cursor]);
  const minDate = min ? parseDateKey(min) : null; const maxDate = max ? parseDateKey(max) : null;
  const displayValue = value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(parseDateKey(value)) : "Choose a date";
  useEffect(() => {
    function close(event: PointerEvent) { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => { if (open) window.requestAnimationFrame(() => dayRefs.current[focusIndex]?.focus()); }, [open, focusIndex, cursor]);
  function isDisabled(day: Date) { const key = dateKey(day); return (minDate !== null && day < minDate) || (maxDate !== null && day > maxDate) || Boolean(disabled?.(key)); }
  function focusIndexFor(month: Date, selectedValue: string) {
    const monthGrid = monthDays(month);
    const selectedIndex = selectedValue ? monthGrid.findIndex((day) => dateKey(day) === selectedValue) : -1;
    if (selectedIndex >= 0) return selectedIndex;
    const firstAvailable = monthGrid.findIndex((day) => day.getMonth() === month.getMonth() && !isDisabled(day));
    return firstAvailable >= 0 ? firstAvailable : 0;
  }
  return <div ref={rootRef} className="dashboard-datepicker">
    <span id={labelId} className="dashboard-control-label">{label}</span>{hint ? <span className="dashboard-control-hint">{hint}</span> : null}
    <button ref={triggerRef} type="button" className="dashboard-select-trigger dashboard-date-trigger" aria-labelledby={labelId} aria-haspopup="dialog" aria-expanded={open} aria-controls={titleId} onClick={() => { const nextCursor = value ? parseDateKey(value) : cursor; if (value) setCursor(nextCursor); setFocusIndex(focusIndexFor(nextCursor, value)); setOpen((current) => !current); }} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); } }}><span>{displayValue}</span><span aria-hidden="true" className="dashboard-calendar-icon">▦</span></button>
    {open ? <div id={titleId} role="dialog" aria-labelledby={`${titleId}-heading`} className="dashboard-date-popover">
      <div className="dashboard-date-heading"><button type="button" aria-label="Previous month" className="dashboard-date-arrow" onClick={() => setCursor((current) => { const nextCursor = new Date(current.getFullYear(), current.getMonth() - 1, 12); setFocusIndex(focusIndexFor(nextCursor, value)); return nextCursor; })}>←</button><strong id={`${titleId}-heading`}>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(cursor)}</strong><button type="button" aria-label="Next month" className="dashboard-date-arrow" onClick={() => setCursor((current) => { const nextCursor = new Date(current.getFullYear(), current.getMonth() + 1, 12); setFocusIndex(focusIndexFor(nextCursor, value)); return nextCursor; })}>→</button></div>
      <div className="dashboard-date-week" aria-hidden="true">{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
      <div className="dashboard-date-grid">{days.map((day, index) => { const key = dateKey(day); const inMonth = day.getMonth() === cursor.getMonth(); const selected = key === value; const spoken = new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(day); return <button ref={(element) => { dayRefs.current[index] = element; }} key={key} type="button" disabled={!inMonth || isDisabled(day)} tabIndex={index === focusIndex ? 0 : -1} aria-label={spoken} aria-pressed={selected} className={`dashboard-date-day ${inMonth ? "" : "is-outside"} ${selected ? "is-selected" : ""}`} onKeyDown={(event) => { const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : event.key === "ArrowDown" ? 7 : event.key === "ArrowUp" ? -7 : event.key === "Home" ? -(index % 7) : event.key === "End" ? 6 - (index % 7) : 0; if (!delta) { if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); } return; } event.preventDefault(); const target = index + delta; if (target >= 0 && target < days.length) { setFocusIndex(target); dayRefs.current[target]?.focus(); } }} onClick={() => { onChange(key); setOpen(false); triggerRef.current?.focus(); }}>{day.getDate()}</button>; })}</div>
      {value ? <button type="button" className="dashboard-date-clear" onClick={() => { onChange(""); setOpen(false); triggerRef.current?.focus(); }}>Clear date</button> : null}
    </div> : null}
  </div>;
}
