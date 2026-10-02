function normalizeDateTime(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return { valid: true, value: null };
  }

  if (typeof value !== "string") {
    return { valid: false, value: null };
  }

  const text = value.trim();

  // Require a UTC timestamp, identified by the final Z.
  const match =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.(\d{3}))?Z$/.exec(
      text
    );

  if (!match) {
    return { valid: false, value: null };
  }

  const date = new Date(text);

  const canonical =
    text.slice(0, 19) +
    "." +
    (match[1] || "000") +
    "Z";

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() < 1000 ||
    date.toISOString() !== canonical
  ) {
    return { valid: false, value: null };
  }

  // MariaDB DATETIME text, with UTC as its agreed meaning.
  return {
    valid: true,
    value: date
      .toISOString()
      .slice(0, 19)
      .replace("T", " ")
  };
}

function formatUtcDateTime(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const text = String(value).replace(" ", "T");

  const date = new Date(
    text.endsWith("Z") ? text : `${text}Z`
  );

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
}

module.exports = {
  normalizeDateTime,
  formatUtcDateTime
};