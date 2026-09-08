import {
  AlertCircle,
  Check,
  ChevronRight,
  LoaderCircle,
  PlusCircle,
  Search,
  Sparkles
} from "lucide-react";

import {
  useMemo,
  useState
} from "react";

import GlassCard
  from "../components/ui/GlassCard";

import NeonButton
  from "../components/ui/NeonButton";

import PageHeader
  from "../components/ui/PageHeader";

import {
  useApp
} from "../context/AppContext";

import {
  api
} from "../services/api";

const LABELS = {
  calories:
    "Calories",
  protein_g:
    "Protein",
  carbs_g:
    "Carbs",
  fat_g:
    "Fat",
  saturated_fat_g:
    "Saturated fat",
  fiber_g:
    "Fibre",
  sugar_g:
    "Sugar",
  potassium_mg:
    "Potassium",
  sodium_mg:
    "Sodium",
  calcium_mg:
    "Calcium",
  iron_mg:
    "Iron",
  magnesium_mg:
    "Magnesium",
  phosphorus_mg:
    "Phosphorus",
  zinc_mg:
    "Zinc",
  vitamin_c_mg:
    "Vitamin C"
};

const UNITS = {
  calories:
    "kcal",
  protein_g: "g",
  carbs_g: "g",
  fat_g: "g",
  saturated_fat_g:
    "g",
  fiber_g: "g",
  sugar_g: "g",
  potassium_mg:
    "mg",
  sodium_mg:
    "mg",
  calcium_mg:
    "mg",
  iron_mg:
    "mg",
  magnesium_mg:
    "mg",
  phosphorus_mg:
    "mg",
  zinc_mg:
    "mg",
  vitamin_c_mg:
    "mg"
};

export default function NutritionPage() {
  const {
    selectedProfile,
    nutritionDate,
    saveNutritionLog
  } =
    useApp();

  const [
    query,
    setQuery
  ] =
    useState("");

  const [
    quantity,
    setQuantity
  ] =
    useState("100");

  const [
    unit,
    setUnit
  ] =
    useState("g");

  const [
    mealType,
    setMealType
  ] =
    useState(
      "breakfast"
    );

  const [
    results,
    setResults
  ] =
    useState([]);

  const [
    selected,
    setSelected
  ] =
    useState(null);

  const [
    details,
    setDetails
  ] =
    useState(null);

  const [
    calculation,
    setCalculation
  ] =
    useState(null);

  const [
    busy,
    setBusy
  ] =
    useState(false);

  const [
    saving,
    setSaving
  ] =
    useState(false);

  const [
    error,
    setError
  ] =
    useState("");

  const [
    success,
    setSuccess
  ] =
    useState("");

  const availableUnits =
    useMemo(() => {
      const base = [
        {
          value: "g",
          label: "grams"
        },
        {
          value: "kg",
          label:
            "kilograms"
        },
        {
          value: "oz",
          label: "ounces"
        },
        {
          value: "lb",
          label: "pounds"
        }
      ];

      if (
        !details?.portions
      ) {
        return base;
      }

      return [
        ...base,
        ...details.portions.map(
          (portion) => ({
            value:
              portion.key,
            label:
              portion.label
          })
        )
      ];
    }, [details]);

  async function search(
    event
  ) {
    event.preventDefault();

    if (
      !query.trim()
    ) {
      return;
    }

    try {
      setBusy(true);
      setError("");
      setSuccess("");
      setCalculation(
        null
      );

      const data =
        await api
          .searchNutrition(
            query.trim()
          );

      setResults(
        data.foods || []
      );

      setSelected(null);
      setDetails(null);
    } catch (error) {
      setError(
        error.message
      );
    } finally {
      setBusy(false);
    }
  }

  async function choose(
    food
  ) {
    try {
      setBusy(true);
      setError("");
      setSuccess("");
      setSelected(food);
      setCalculation(
        null
      );

      const data =
        await api
          .getFoodDetails(
            food.fdcId
          );

      setDetails(data);
      setUnit("g");
    } catch (error) {
      setError(
        error.message
      );
    } finally {
      setBusy(false);
    }
  }

  async function calculate() {
    if (!selected) {
      setError(
        "Select a USDA food first."
      );
      return;
    }

    try {
      setBusy(true);
      setError("");
      setSuccess("");

      const data =
        await api
          .calculateNutrition({
            fdcId:
              selected.fdcId,
            quantity:
              Number(
                quantity
              ),
            unit
          });

      setCalculation(
        data
      );
    } catch (error) {
      setError(
        error.message
      );
    } finally {
      setBusy(false);
    }
  }

  async function addToDay() {
    if (
      !calculation
    ) {
      setError(
        "Calculate the food first."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await saveNutritionLog({
        fdcId:
          calculation.food
            .fdcId,

        food_name:
          calculation.food
            .description,

        quantity:
          calculation.input
            .quantity,

        unit:
          calculation.input
            .unit,

        weight_grams:
          calculation.input
            .weightGrams,

        meal_type:
          mealType,

        logged_date:
          nutritionDate,

        nutrition:
          calculation
            .nutrition
      });

      setSuccess(
        `${calculation.food.description} added to ${mealType} for ${nutritionDate}.`
      );
    } catch (error) {
      setError(
        error.message
      );
    } finally {
      setSaving(false);
    }
  }

  const nutrition =
    calculation?.nutrition ||
    details
      ?.nutrientsPer100g ||
    null;

  return (
    <>
      <PageHeader
        eyebrow="Nutrition / USDA"
        title="Nutrition calculator"
        subtitle={`Search USDA, calculate the exact quantity, then add it to ${selectedProfile?.profile_name || "your profile"}'s daily log.`}
      />

      <div className="nutrition-layout">
        <GlassCard
          className="nutrition-search-card"
          glow
        >
          <div className="card-heading">
            <div>
              <span className="eyebrow-small">
                Step 1
              </span>
              <h3>
                Find food
              </h3>
            </div>
          </div>

          <form
            className="nutrition-search"
            onSubmit={
              search
            }
          >
            <div className="field-input">
              <Search
                size={16}
              />
              <input
                value={
                  query
                }
                onChange={(
                  event
                ) =>
                  setQuery(
                    event.target
                      .value
                  )
                }
                placeholder="Chicken breast, banana, rice..."
              />
            </div>

            <NeonButton
              type="submit"
              disabled={
                busy
              }
            >
              {busy ? (
                <LoaderCircle
                  className="spin"
                  size={
                    16
                  }
                />
              ) : (
                <Search
                  size={
                    16
                  }
                />
              )}
              Search
            </NeonButton>
          </form>

          <div className="food-results">
            {results.map(
              (food) => (
                <button
                  key={
                    food.fdcId
                  }
                  className={`food-result ${
                    selected
                      ?.fdcId ===
                    food.fdcId
                      ? "is-selected"
                      : ""
                  }`}
                  onClick={() =>
                    choose(
                      food
                    )
                  }
                >
                  <div className="food-result__icon">
                    {selected
                      ?.fdcId ===
                    food.fdcId ? (
                      <Check
                        size={
                          15
                        }
                      />
                    ) : (
                      <Sparkles
                        size={
                          15
                        }
                      />
                    )}
                  </div>

                  <div>
                    <strong>
                      {
                        food.description
                      }
                    </strong>
                    <span>
                      {
                        food.dataType
                      }
                      {food.brandName
                        ? ` · ${food.brandName}`
                        : ""}
                    </span>
                  </div>

                  <ChevronRight
                    size={16}
                  />
                </button>
              )
            )}

            {results.length ===
              0 && (
              <div className="empty-state">
                Search results
                will appear here.
              </div>
            )}
          </div>
        </GlassCard>

        <div className="nutrition-right">
          <GlassCard>
            <div className="card-heading">
              <div>
                <span className="eyebrow-small">
                  Step 2
                </span>
                <h3>
                  Quantity
                </h3>
              </div>
            </div>

            <div className="quantity-grid">
              <label className="field">
                <span>
                  Quantity
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={
                    quantity
                  }
                  onChange={(
                    event
                  ) =>
                    setQuantity(
                      event.target
                        .value
                    )
                  }
                />
              </label>

              <label className="field">
                <span>
                  Unit
                </span>
                <select
                  value={
                    unit
                  }
                  onChange={(
                    event
                  ) =>
                    setUnit(
                      event.target
                        .value
                    )
                  }
                >
                  {availableUnits.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            <NeonButton
              className="full-width"
              onClick={
                calculate
              }
              disabled={
                busy ||
                !selected
              }
            >
              Calculate
            </NeonButton>
          </GlassCard>

          <GlassCard
            className="nutrition-output-card"
            glow
          >
            <div className="card-heading">
              <div>
                <span className="eyebrow-small">
                  Output
                </span>
                <h3>
                  Nutrients
                </h3>
              </div>

              <span className="metric-chip">
                {calculation
                  ? `${calculation.input?.weightGrams ?? "—"} g`
                  : details
                  ? "per 100 g"
                  : "waiting"}
              </span>
            </div>

            {!nutrition ? (
              <div className="empty-state">
                Select a food to
                view nutrients.
              </div>
            ) : (
              <div className="nutrient-grid">
                {Object.entries(
                  LABELS
                ).map(
                  ([
                    key,
                    label
                  ]) => (
                    <div
                      className={`nutrient-tile ${
                        key ===
                        "calories"
                          ? "nutrient-tile--hero"
                          : ""
                      }`}
                      key={
                        key
                      }
                    >
                      <span>
                        {label}
                      </span>
                      <strong>
                        {nutrition[
                          key
                        ] ??
                          "—"}
                        <small>
                          {
                            UNITS[
                              key
                            ]
                          }
                        </small>
                      </strong>
                    </div>
                  )
                )}
              </div>
            )}

            {calculation && (
              <div className="nutrition-save-panel">
                <label className="field">
                  <span>
                    Add to meal
                  </span>
                  <select
                    value={
                      mealType
                    }
                    onChange={(
                      event
                    ) =>
                      setMealType(
                        event.target
                          .value
                      )
                    }
                  >
                    <option value="breakfast">
                      Breakfast
                    </option>
                    <option value="lunch">
                      Lunch
                    </option>
                    <option value="dinner">
                      Dinner
                    </option>
                    <option value="snack">
                      Snack
                    </option>
                    <option value="other">
                      Other
                    </option>
                  </select>
                </label>

                <NeonButton
                  onClick={
                    addToDay
                  }
                  disabled={
                    saving
                  }
                >
                  <PlusCircle
                    size={16}
                  />
                  {saving
                    ? "Adding..."
                    : `Add to ${nutritionDate}`}
                </NeonButton>
              </div>
            )}

            {error && (
              <div className="inline-error section-gap-top">
                <AlertCircle
                  size={16}
                />
                {error}
              </div>
            )}

            {success && (
              <div className="inline-success section-gap-top">
                {success}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </>
  );
}
