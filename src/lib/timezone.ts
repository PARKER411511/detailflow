import { parseIsoTimestampToUtcIso } from "./iso-timestamp";

type WallParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

const wallFormatterCache = new Map<string, Intl.DateTimeFormat>();

function wallFormatter(timeZone: string) {
  let formatter = wallFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    wallFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

function partsFor(instant: Date, timeZone: string): WallParts {
  const values = Object.fromEntries(
    wallFormatter(timeZone)
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<keyof WallParts, number>;
  return values;
}

function wallEpoch(parts: WallParts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

function parseLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Use a local date and time in YYYY-MM-DDTHH:MM format.");
  const parts: WallParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: 0,
  };
  if (parts.year < 1000 || parts.month < 1 || parts.month > 12 || parts.hour > 23 || parts.minute > 59) {
    throw new Error("That local date and time is invalid.");
  }
  const calendarCheck = new Date(0);
  calendarCheck.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  calendarCheck.setUTCHours(parts.hour, parts.minute, 0, 0);
  if (
    calendarCheck.getUTCFullYear() !== parts.year ||
    calendarCheck.getUTCMonth() !== parts.month - 1 ||
    calendarCheck.getUTCDate() !== parts.day
  ) {
    throw new Error("That local date and time is invalid.");
  }
  return parts;
}

function offsetAt(instant: Date, timeZone: string) {
  return wallEpoch(partsFor(instant, timeZone)) - instant.getTime();
}

/** Convert a datetime-local wall time; choose the earlier instant on fall-back and reject spring-forward gaps. */
export function localDateTimeToUtcIso(value: string, timeZone: string) {
  if (value.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(value)) {
    return parseIsoTimestampToUtcIso(value);
  }

  const local = parseLocal(value);
  const targetWall = wallEpoch(local);
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    offsets.add(offsetAt(new Date(targetWall + hours * 60 * 60 * 1000), timeZone));
  }
  const candidates = [...offsets]
    .map((offset) => new Date(targetWall - offset))
    .filter((candidate) => wallEpoch(partsFor(candidate, timeZone)) === targetWall)
    .sort((left, right) => left.getTime() - right.getTime());
  if (candidates.length === 0) throw new Error("That local time does not exist in the studio timezone.");
  return candidates[0].toISOString();
}
