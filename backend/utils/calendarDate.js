function invalid(message) {
  throw Object.assign(new Error(message), { statusCode: 400, expose: true });
}

function today(timeZone = "UTC", now = new Date()) {
  if (typeof timeZone !== "string" || timeZone.length > 100) invalid("Invalid time zone");
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now);
    const value = (type) => parts.find((part) => part.type === type).value;
    return `${value("year")}-${value("month")}-${value("day")}`;
  } catch { return invalid("Invalid time zone"); }
}

function calendarDate(value, label = "Date") {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1000) {
    invalid(`${label} must be a YYYY-MM-DD date (year 1000 or later)`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) invalid(`${label} must be a valid calendar date`);
  return value;
}

function observationDate(value, dob, timeZone) {
  const lastDate = today(timeZone);
  const date = calendarDate(value || lastDate, "Recorded date");
  if (date > lastDate) invalid("Recorded date cannot be in the future");
  if (dob && date < dob) invalid("Recorded date cannot be before the date of birth");
  return date;
}

module.exports = { today, calendarDate, observationDate };
