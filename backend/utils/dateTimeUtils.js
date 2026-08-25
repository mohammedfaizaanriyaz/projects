// ============================================================
// NORMALIZE DATE + TIME
// Accepts:
//
// 2026-08-25T18:30
//
// OR
//
// 2026-08-25 18:30:00
//
// Returns:
//
// 2026-08-25 18:30:00
// ============================================================

function normalizeDateTime(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return {
            valid: true,
            value: null
        };
    }


    if (typeof value !== "string") {
        return {
            valid: false,
            value: null
        };
    }


    const match =
        value
            .trim()
            .match(
                /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
            );


    if (!match) {
        return {
            valid: false,
            value: null
        };
    }


    const year =
        Number(match[1]);

    const month =
        Number(match[2]);

    const day =
        Number(match[3]);

    const hour =
        Number(match[4]);

    const minute =
        Number(match[5]);

    const second =
        Number(match[6] || 0);


    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day,
                hour,
                minute,
                second
            )
        );


    const isValid =
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day &&
        date.getUTCHours() === hour &&
        date.getUTCMinutes() === minute &&
        date.getUTCSeconds() === second;


    if (!isValid) {
        return {
            valid: false,
            value: null
        };
    }


    const normalized =
        `${match[1]}-${match[2]}-${match[3]} ` +
        `${match[4]}:${match[5]}:` +
        `${String(second).padStart(2, "0")}`;


    return {
        valid: true,
        value: normalized
    };
}


module.exports = {
    normalizeDateTime
};
