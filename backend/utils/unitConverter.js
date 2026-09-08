// ============================================================
// MASS UNIT CONVERSION + USDA PORTION RESOLUTION
// ============================================================

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

    const normalized =
        normalizeUnit(unit);

    return Object.prototype
        .hasOwnProperty.call(
            MASS_UNIT_TO_GRAMS,
            normalized
        );
};


const convertMassToGrams = (
    quantity,
    unit
) => {

    const numericQuantity =
        Number(quantity);

    const normalizedUnit =
        normalizeUnit(unit);


    if (
        !Number.isFinite(
            numericQuantity
        ) ||
        numericQuantity <= 0
    ) {
        throw new Error(
            "Quantity must be a positive number"
        );
    }


    if (
        !Object.prototype
            .hasOwnProperty.call(
                MASS_UNIT_TO_GRAMS,
                normalizedUnit
            )
    ) {
        throw new Error(
            "Unsupported mass unit"
        );
    }


    return (
        numericQuantity *
        MASS_UNIT_TO_GRAMS[
            normalizedUnit
        ]
    );
};


// ============================================================
// USDA PORTION OPTIONS
// ============================================================

const getPortionOptions = (
    food
) => {

    const options = [];


    const portions =
        Array.isArray(
            food?.foodPortions
        )
            ? food.foodPortions
            : [];


    portions.forEach(
        (
            portion,
            index
        ) => {

            const gramWeight =
                Number(
                    portion.gramWeight
                );


            if (
                !Number.isFinite(
                    gramWeight
                ) ||
                gramWeight <= 0
            ) {
                return;
            }


            const measureName =
                portion
                    ?.measureUnit
                    ?.name ||
                portion
                    ?.measureUnit
                    ?.abbreviation ||
                "";

            const amount =
                Number(
                    portion.amount
                );

            const modifier =
                portion.modifier ||
                "";

            const portionDescription =
                portion
                    .portionDescription ||
                "";


            let label =
                portionDescription
                    .trim();


            if (!label) {

                label = [
                    Number.isFinite(amount)
                        ? amount
                        : null,

                    modifier ||
                    measureName
                ]
                    .filter(
                        Boolean
                    )
                    .join(" ");
            }


            if (!label) {
                label =
                    `USDA portion ${index + 1}`;
            }


            options.push({
                key:
                    `portion:${
                        portion.id ??
                        index
                    }`,

                label,

                gramWeight:
                    Number(
                        gramWeight
                            .toFixed(3)
                    ),

                source:
                    "USDA food portion"
            });
        }
    );


    const servingSize =
        Number(
            food?.servingSize
        );

    const servingUnit =
        normalizeUnit(
            food?.servingSizeUnit
        );


    if (
        Number.isFinite(
            servingSize
        ) &&
        servingSize > 0 &&
        isMassUnit(
            servingUnit
        )
    ) {

        const servingGrams =
            convertMassToGrams(
                servingSize,
                servingUnit
            );


        options.unshift({
            key:
                "serving",

            label:
                food
                    ?.householdServingFullText ||
                `1 serving (${servingSize} ${food.servingSizeUnit})`,

            gramWeight:
                Number(
                    servingGrams
                        .toFixed(3)
                ),

            source:
                "USDA branded serving"
        });
    }


    return options;
};


// ============================================================
// RESOLVE USER QUANTITY TO GRAMS
// ============================================================

const resolveWeightInGrams = (
    food,
    quantity,
    unit
) => {

    const numericQuantity =
        Number(quantity);


    if (
        !Number.isFinite(
            numericQuantity
        ) ||
        numericQuantity <= 0
    ) {
        throw new Error(
            "Quantity must be a positive number"
        );
    }


    if (isMassUnit(unit)) {

        return Number(
            convertMassToGrams(
                numericQuantity,
                unit
            )
                .toFixed(3)
        );
    }


    const normalizedUnit =
        normalizeUnit(unit);

    const options =
        getPortionOptions(
            food
        );


    const exactOption =
        options.find(
            (option) =>
                normalizeUnit(
                    option.key
                ) ===
                normalizedUnit
        );


    if (exactOption) {

        return Number(
            (
                numericQuantity *
                exactOption.gramWeight
            )
                .toFixed(3)
        );
    }


    if (
        normalizedUnit ===
        "serving"
    ) {

        const serving =
            options.find(
                (option) =>
                    option.key ===
                    "serving"
            );


        if (!serving) {
            throw new Error(
                "This food does not have a usable USDA serving weight"
            );
        }


        return Number(
            (
                numericQuantity *
                serving.gramWeight
            )
                .toFixed(3)
        );
    }


    const aliases = {
        piece: [
            "piece",
            "item",
            "each",
            "whole"
        ],

        unit: [
            "piece",
            "item",
            "each",
            "whole"
        ],

        whole: [
            "whole",
            "piece",
            "item"
        ],

        slice: [
            "slice"
        ],

        egg: [
            "egg"
        ],

        banana: [
            "banana"
        ]
    };


    const words =
        aliases[
            normalizedUnit
        ] || [
            normalizedUnit
        ];


    const matches =
        options.filter(
            (option) => {

                const label =
                    normalizeUnit(
                        option.label
                    );

                return words.some(
                    (word) =>
                        label.includes(
                            word
                        )
                );
            }
        );


    if (
        matches.length === 1
    ) {

        return Number(
            (
                numericQuantity *
                matches[0]
                    .gramWeight
            )
                .toFixed(3)
        );
    }


    const available =
        options
            .map(
                (option) =>
                    `${option.key} (${option.label})`
            )
            .join(", ");


    throw new Error(
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
