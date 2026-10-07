function inputError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    error.expose = true;
    return error;
}

const MASS_UNIT_TO_GRAMS = {
    g: 1,
    gram: 1,
    grams: 1,
    kg: 1000,
    kilogram: 1000,
    kilograms: 1000,
    oz: 28.349523125,
    ounce: 28.349523125,
    ounces: 28.349523125,
    lb: 453.59237,
    lbs: 453.59237,
    pound: 453.59237,
    pounds: 453.59237,
    mg: 0.001,
    milligram: 0.001,
    milligrams: 0.001
};

const normalizeUnit = (unit) => {
    return String(unit || "")
        .trim()
        .toLowerCase()
        .replace(/\./g, "")
        .replace(/\s+/g, " ");
};

const isMassUnit = (unit) => {
    return Object.prototype.hasOwnProperty.call(
        MASS_UNIT_TO_GRAMS,
        normalizeUnit(unit)
    );
};

function positiveQuantity(quantity) {
    if (
        (typeof quantity !== "number" && typeof quantity !== "string") ||
        (typeof quantity === "string" && !quantity.trim())
    ) {
        throw inputError("Quantity must be 0.001 to 999999999.999 with at most 3 decimal places");
    }

    const number = Number(quantity);

    if (!Number.isFinite(number) || number < 0.001 || number > 999999999.999 ||
        Math.abs(number * 1000 - Math.round(number * 1000)) > 0.0001) {
        throw inputError("Quantity must be 0.001 to 999999999.999 with at most 3 decimal places");
    }

    return number;
}

function boundedGrams(value) {
    if (!Number.isFinite(value) || value < 0.001 || value > 999999999.999) {
        throw inputError("Converted weight must be between 0.001 and 999999999.999 grams");
    }
    return Number(value.toFixed(3));
}

const canonicalUnit = (value) => {
    const text = normalizeUnit(value);
    const aliases = { tablespoon: "tbsp", tablespoons: "tbsp", teaspoon: "tsp", teaspoons: "tsp", cups: "cup", pieces: "piece", slices: "slice", eggs: "egg" };
    return aliases[text] || text;
};

const convertMassToGrams = (quantity, unit) => {
    const numericQuantity = positiveQuantity(quantity);
    const normalizedUnit = normalizeUnit(unit);

    if (!isMassUnit(normalizedUnit)) {
        throw inputError("Unsupported mass unit");
    }

    return boundedGrams(numericQuantity * MASS_UNIT_TO_GRAMS[normalizedUnit]);
};

// USDA PORTION OPTIONS
const getPortionOptions = (food) => {
    const options = [];
    const portions = Array.isArray(food?.foodPortions)
        ? food.foodPortions
        : [];

    portions.forEach((portion, index) => {
        const gramWeight = Number(portion.gramWeight);

        if (!Number.isFinite(gramWeight) || gramWeight <= 0) {
            return;
        }

        const measureName =
            portion?.measureUnit?.name ||
            portion?.measureUnit?.abbreviation ||
            "";

        const amount = Number(portion.amount);
        const modifier = portion.modifier || "";
        const portionDescription = portion.portionDescription || "";

        let label = portionDescription.trim();

        if (!label) {
            label = [
                Number.isFinite(amount) ? amount : null,
                modifier || measureName
            ].filter(Boolean).join(" ");
        }

        if (!label) {
            label = `USDA portion ${index + 1}`;
        }

        options.push({
            key: `portion:${portion.id ?? index}`,
            label,
            gramWeight: Number(gramWeight.toFixed(3)),
            amount: Number.isFinite(amount) && amount > 0 ? amount : null,
            measureUnit: canonicalUnit(measureName),
            source: "USDA food portion"
        });
    });

    const servingSize = Number(food?.servingSize);
    const servingUnit = normalizeUnit(food?.servingSizeUnit);

    if (
        Number.isFinite(servingSize) &&
        servingSize > 0 &&
        isMassUnit(servingUnit)
    ) {
        const servingGrams = convertMassToGrams(servingSize, servingUnit);

        options.unshift({
            key: "serving",
            label:
                food?.householdServingFullText ||
                `1 serving (${servingSize} ${food.servingSizeUnit})`,
            gramWeight: Number(servingGrams.toFixed(3)),
            source: "USDA branded serving"
        });
    }

    return options;
};

// RESOLVE USER QUANTITY TO GRAMS
const resolveWeightInGrams = (food, quantity, unit) => {
    const numericQuantity = positiveQuantity(quantity);

    if (typeof unit !== "string" || !unit.trim()) {
        throw inputError("Unit is required");
    }

    if (isMassUnit(unit)) {
        return Number(
            convertMassToGrams(numericQuantity, unit).toFixed(3)
        );
    }

    const normalizedUnit = normalizeUnit(unit);
    const options = getPortionOptions(food);

    const exactOption = options.find(
        (option) => normalizeUnit(option.key) === normalizedUnit
    );

    if (exactOption) {
        return boundedGrams(numericQuantity * exactOption.gramWeight);
    }

    if (normalizedUnit === "serving") {
        throw inputError(
            "This food does not have a usable USDA serving weight"
        );
    }

    // Only match an explicit USDA measure and divide by its reported amount.
    // Description substring guesses can confuse "2 tbsp" with one tablespoon.
    const matches = options.filter((option) => option.amount &&
        option.measureUnit === canonicalUnit(normalizedUnit));
    if (matches.length === 1) {
        return boundedGrams(numericQuantity * matches[0].gramWeight / matches[0].amount);
    }

    const available = options.map(
        (option) => `${option.key} (${option.label})`
    ).join(", ");

    throw inputError(
        available
            ? `Unit "${unit}" is ambiguous or unavailable for this food. Use g, kg, oz, lb, or one of: ${available}`
            : `Unit "${unit}" is unavailable for this food. Use g, kg, oz, or lb.`
    );
};

module.exports = {
    normalizeUnit,
    isMassUnit,
    convertMassToGrams,
    getPortionOptions,
    resolveWeightInGrams
};