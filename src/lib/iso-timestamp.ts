const ISO_TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;

function invalidTimestamp(): never {
  throw new Error("Use a valid ISO 8601 timestamp with a UTC offset.");
}

/** Validate an ISO timestamp with Z or a numeric offset and normalize it for timestamptz RPCs. */
export function parseIsoTimestampToUtcIso(value: string) {
  const match = ISO_TIMESTAMP_PATTERN.exec(value);
  if (!match) return invalidTimestamp();

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const zone = match[8];

  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return invalidTimestamp();
  if (zone !== "Z") {
    const offsetHour = Number(zone.slice(1, 3));
    const offsetMinute = Number(zone.slice(4, 6));
    if (offsetHour > 23 || offsetMinute > 59) return invalidTimestamp();
  }

  const calendarCheck = new Date(0);
  calendarCheck.setUTCFullYear(year, month - 1, day);
  calendarCheck.setUTCHours(hour, minute, second, 0);
  if (
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day ||
    calendarCheck.getUTCHours() !== hour ||
    calendarCheck.getUTCMinutes() !== minute ||
    calendarCheck.getUTCSeconds() !== second
  ) return invalidTimestamp();

  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return invalidTimestamp();
  return instant.toISOString();
}
