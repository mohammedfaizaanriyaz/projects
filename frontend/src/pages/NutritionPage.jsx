import {
  AlertCircle, Check, ChevronRight, LoaderCircle,
  PlusCircle, Search, Sparkles
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import PageHeader from "../components/ui/PageHeader";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";

const LABELS = {
  calories: "Calories",
  protein_g: "Protein",
  carbs_g: "Carbs",
  fat_g: "Fat",
  saturated_fat_g: "Saturated fat",
  fiber_g: "Fibre",
  sugar_g: "Sugar",
  potassium_mg: "Potassium",
  sodium_mg: "Sodium",
  calcium_mg: "Calcium",
  iron_mg: "Iron",
  magnesium_mg: "Magnesium",
  phosphorus_mg: "Phosphorus",
  zinc_mg: "Zinc",
  vitamin_c_mg: "Vitamin C"
};

const BASE_UNITS = [
  { value: "g", label: "grams" },
  { value: "kg", label: "kilograms" },
  { value: "oz", label: "ounces" },
  { value: "lb", label: "pounds" }
];

function inputKey(fdcId, quantity, unit) {
  return JSON.stringify([String(fdcId), String(quantity), unit]);
}

function nutrientUnit(key) {
  if (key === "calories") return "kcal";
  return key.endsWith("_mg") ? "mg" : "g";
}

export default function NutritionPage() {
  const {
    user,
    selectedProfileId,
    selectedProfile,
    nutritionDate,
    saveNutritionLog
  } = useApp();

  const profileReady =
    selectedProfileId != null &&
    selectedProfile &&
    Number(selectedProfile.profile_id) === Number(selectedProfileId);

  if (!profileReady) {
    return (
      <GlassCard>
        <p role="status">Select a profile and wait for its details to load.</p>
      </GlassCard>
    );
  }

  // Changing the account, profile or date creates a fresh workspace.
  return (
    <NutritionWorkspace
      key={JSON.stringify([
        user?.user_id,
        selectedProfileId,
        nutritionDate
      ])}
      profile={selectedProfile}
      nutritionDate={nutritionDate}
      saveNutritionLog={saveNutritionLog}
    />
  );
}

function NutritionWorkspace({ profile, nutritionDate, saveNutritionLog }) {
  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [unit, setUnit] = useState("g");
  const [mealType, setMealType] = useState("breakfast");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [busy, setBusy] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const requestVersion = useRef(0);
  const pending = useRef(false);
  const saveLocked = useRef(false);

  useLayoutEffect(() => {
    requestVersion.current += 1;

    return () => {
      requestVersion.current += 1;
      pending.current = false;
      saveLocked.current = false;
    };
  }, []);

  const availableUnits = [
    ...BASE_UNITS,
    ...(details?.portions || []).map((portion) => ({
      value: portion.key,
      label: portion.label
    }))
  ];

  const currentKey = selected
    ? inputKey(selected.fdcId, quantity, unit)
    : null;

  const calculationIsCurrent =
    calculation != null &&
    calculation.key === currentKey &&
    calculation.version === requestVersion.current;

  const currentCalculation = calculationIsCurrent
    ? calculation.data
    : null;

  const canSave = Boolean(currentCalculation) && !busy && !saving;

  // Clear the result and invalidate any outstanding calculation.
  function invalidateCalculation() {
    requestVersion.current += 1;
    pending.current = false;
    setCalculation(null);
    setBusy("");
    setError("");
    setSuccess("");
  }

  function changeQuery(value) {
    if (saveLocked.current) return;

    invalidateCalculation();
    setQuery(value);
    setResults([]);
    setSearched(false);
    setSelected(null);
    setDetails(null);
    setUnit("g");
  }

  function changeQuantity(value) {
    if (saveLocked.current) return;

    invalidateCalculation();
    setQuantity(value);
  }

  function changeUnit(value) {
    if (saveLocked.current) return;

    invalidateCalculation();
    setUnit(value);
  }

  function startRequest(kind) {
    const version = ++requestVersion.current;
    pending.current = true;
    setBusy(kind);
    setCalculation(null);
    setError("");
    setSuccess("");
    return version;
  }

  function finishRequest(version) {
    if (requestVersion.current !== version) return;

    pending.current = false;
    setBusy("");
  }

  async function search(event) {
    event.preventDefault();
    if (pending.current || saveLocked.current || !query.trim()) return;

    const searchText = query.trim();
    const version = startRequest("search");

    setResults([]);
    setSearched(false);
    setSelected(null);
    setDetails(null);
    setUnit("g");

    try {
      const data = await api.searchNutrition(searchText);
      if (requestVersion.current !== version) return;

      setResults(data.foods || []);
      setSearched(true);
    } catch (error) {
      if (requestVersion.current === version) {
        setError(error.message || "Could not search for foods.");
      }
    } finally {
      finishRequest(version);
    }
  }

  async function choose(food) {
    if (pending.current || saveLocked.current) return;

    const version = startRequest("details");
    setSelected(food);
    setDetails(null);
    setUnit("g");

    try {
      const data = await api.getFoodDetails(food.fdcId);
      if (requestVersion.current !== version) return;

      setDetails(data);
    } catch (error) {
      if (requestVersion.current === version) {
        setError(error.message || "Could not load this food.");
      }
    } finally {
      finishRequest(version);
    }
  }

  async function calculate() {
    if (pending.current || saveLocked.current) return;

    invalidateCalculation();

    if (!selected || !details) {
      setError("Select a food and wait for its details to load.");
      return;
    }

    const numericQuantity = Number(quantity);

    if (!Number.isFinite(numericQuantity) || numericQuantity < 0.001 || numericQuantity > 999999999.999) {
      setError("Enter a quantity from 0.001 to 999999999.999.");
      return;
    }

    // Capture the inputs before starting the request.
    const snapshot = {
      fdcId: selected.fdcId,
      quantity: numericQuantity,
      unit
    };
    const key = inputKey(selected.fdcId, quantity, unit);
    const version = startRequest("calculate");

    try {
      const data = await api.calculateNutrition(snapshot);
      if (requestVersion.current !== version) return;

      // Only accept a response for the requested inputs.
      if (
        !data?.food ||
        !data?.input ||
        !data?.nutrition ||
        String(data.food.fdcId) !== String(snapshot.fdcId) ||
        Number(data.input.quantity) !== snapshot.quantity ||
        data.input.unit !== snapshot.unit
      ) {
        throw new Error(
          "The calculation did not match your inputs. Please try again."
        );
      }

      setCalculation({ data, key, version, snapshot });
    } catch (error) {
      if (requestVersion.current === version) {
        setError(error.message || "Could not calculate nutrition.");
      }
    } finally {
      finishRequest(version);
    }
  }

  async function addToDay() {
    if (saveLocked.current || pending.current) return;

    if (
      !calculation ||
      calculation.key !== currentKey ||
      calculation.version !== requestVersion.current
    ) {
      setError("Calculate the current food quantity before saving.");
      return;
    }

    const { data, snapshot, version } = calculation;
    const targetMeal = mealType;
    const targetDate = nutritionDate;

    saveLocked.current = true;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await saveNutritionLog({
        fdcId: snapshot.fdcId,
        food_name: data.food.description,
        quantity: snapshot.quantity,
        unit: snapshot.unit,
        weight_grams: data.input.weightGrams,
        meal_type: targetMeal,
        logged_date: targetDate,
        nutrition: data.nutrition
      });

      if (requestVersion.current === version) {
        setSuccess(
          `${data.food.description} added to ${targetMeal} for ${targetDate}.`
        );
      }
    } catch (error) {
      if (requestVersion.current === version) {
        setError(error.message || "Could not save this food.");
      }
    } finally {
      if (requestVersion.current === version) {
        saveLocked.current = false;
        setSaving(false);
      }
    }
  }

  // A per-100 g preview is separate from a calculated, saveable result.
  const nutrition =
    currentCalculation?.nutrition || details?.nutrientsPer100g || null;

  const quantityDisabled =
    saving || busy === "search" || busy === "details";

  return (
    <>
      <PageHeader
        eyebrow="Nutrition / USDA"
        title="Nutrition calculator"
        subtitle={`Search USDA, calculate the exact quantity, then add it to ${profile.profile_name}'s daily log.`}
      />

      <div className="nutrition-layout">
        <GlassCard className="nutrition-search-card" glow>
          <div className="card-heading">
            <div>
              <span className="eyebrow-small">Step 1</span>
              <h3>Find food</h3>
            </div>
          </div>

          <form className="nutrition-search" onSubmit={search}>
            <div className="field-input">
              <Search size={16} />
              <input
                aria-label="Search foods"
                maxLength={120}
                value={query}
                disabled={saving}
                onChange={(event) => changeQuery(event.target.value)}
                placeholder="Chicken breast, banana, rice..."
              />
            </div>

            <NeonButton
              type="submit"
              disabled={Boolean(busy) || saving || !query.trim()}
            >
              {busy === "search" ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Search size={16} />
              )}
              Search
            </NeonButton>
          </form>

          <div className="food-results">
            {results.map((food) => (
              <button
                type="button"
                key={food.fdcId}
                disabled={Boolean(busy) || saving}
                className={`food-result ${
                  selected?.fdcId === food.fdcId ? "is-selected" : ""
                }`}
                onClick={() => choose(food)}
              >
                <div className="food-result__icon">
                  {selected?.fdcId === food.fdcId ? (
                    <Check size={15} />
                  ) : (
                    <Sparkles size={15} />
                  )}
                </div>
                <div>
                  <strong>{food.description}</strong>
                  <span>
                    {food.dataType}
                    {food.brandName ? ` · ${food.brandName}` : ""}
                  </span>
                </div>
                <ChevronRight size={16} />
              </button>
            ))}

            {results.length === 0 && (
              <div className="empty-state">
                {busy === "search"
                  ? "Searching..."
                  : searched ? "No foods found. Try another search." : "Search results will appear here."}
              </div>
            )}
          </div>
        </GlassCard>

        <div className="nutrition-right">
          <GlassCard>
            <div className="card-heading">
              <div>
                <span className="eyebrow-small">Step 2</span>
                <h3>Quantity</h3>
              </div>
            </div>

            <div className="quantity-grid">
              <label className="field">
                <span>Quantity</span>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={quantity}
                  disabled={quantityDisabled}
                  onChange={(event) => changeQuantity(event.target.value)}
                />
              </label>

              <label className="field">
                <span>Unit</span>
                <select
                  value={unit}
                  disabled={quantityDisabled}
                  onChange={(event) => changeUnit(event.target.value)}
                >
                  {availableUnits.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <NeonButton
              type="button"
              className="full-width"
              onClick={calculate}
              disabled={Boolean(busy) || saving || !selected || !details}
            >
              {busy === "calculate" ? "Calculating..." : "Calculate"}
            </NeonButton>
          </GlassCard>

          <GlassCard className="nutrition-output-card" glow>
            <div className="card-heading">
              <div>
                <span className="eyebrow-small">Output</span>
                <h3>Nutrients</h3>
              </div>
              <span className="metric-chip">
                {currentCalculation
                  ? `${currentCalculation.input.weightGrams} g`
                  : details
                    ? "per 100 g preview"
                    : "waiting"}
              </span>
            </div>

            {!nutrition ? (
              <div className="empty-state">
                Select a food to view nutrients.
              </div>
            ) : (
              <div className="nutrient-grid">
                {Object.entries(LABELS).map(([key, label]) => (
                  <div
                    key={key}
                    className={`nutrient-tile ${
                      key === "calories" ? "nutrient-tile--hero" : ""
                    }`}
                  >
                    <span>{label}</span>
                    <strong>
                      {nutrition[key] ?? "—"}
                      <small>{nutrientUnit(key)}</small>
                    </strong>
                  </div>
                ))}
              </div>
            )}

            {details && !currentCalculation && (
              <p role="status">
                {busy === "calculate"
                  ? "Calculating your quantity..."
                  : "Preview only. Calculate your current quantity before saving."}
              </p>
            )}

            {currentCalculation && (
              <div className="nutrition-save-panel">
                <label className="field">
                  <span>Add to meal</span>
                  <select
                    value={mealType}
                    disabled={saving}
                    onChange={(event) => {
                      setMealType(event.target.value);
                      setSuccess("");
                    }}
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <NeonButton
                  type="button"
                  onClick={addToDay}
                  disabled={!canSave}
                >
                  <PlusCircle size={16} />
                  {saving ? "Adding..." : `Add to ${nutritionDate}`}
                </NeonButton>
              </div>
            )}

            {error && (
              <div className="inline-error section-gap-top" role="alert">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="inline-success section-gap-top" role="status">
                {success}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </>
  );
}