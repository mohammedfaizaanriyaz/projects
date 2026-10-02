import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import PageHeader from "../components/ui/PageHeader";
import { api } from "../services/api";

const EMPTY_INGREDIENT = {
  food: "",
  quantity: "100",
  unit: "g"
};

const NUTRIENTS = [
  ["calories", "Calories", "kcal"],
  ["protein_g", "Protein", "g"],
  ["carbs_g", "Carbs", "g"],
  ["fat_g", "Fat", "g"],
  ["saturated_fat_g", "Saturated fat", "g"],
  ["fiber_g", "Fibre", "g"],
  ["sugar_g", "Sugar", "g"],
  ["potassium_mg", "Potassium", "mg"],
  ["sodium_mg", "Sodium", "mg"],
  ["calcium_mg", "Calcium", "mg"],
  ["iron_mg", "Iron", "mg"],
  ["magnesium_mg", "Magnesium", "mg"],
  ["phosphorus_mg", "Phosphorus", "mg"],
  ["zinc_mg", "Zinc", "mg"],
  ["vitamin_c_mg", "Vitamin C", "mg"]
];

const NUTRIENT_LABELS = Object.fromEntries(
  NUTRIENTS.map(([key, label]) => [key, label])
);

function nutrientNames(keys = []) {
  return keys.map((key) => NUTRIENT_LABELS[key] || key).join(", ");
}

function totalDisplay(data, key, unit) {
  if (!data) return "—";

  const value = data.totals?.[key];

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "Unknown";
  }

  const partial = data.incompleteNutrients?.includes(key);

  return `${value} ${unit}${partial ? " · Partial" : ""}`;
}

export default function MealsPage() {
  const [ingredient, setIngredient] = useState({ ...EMPTY_INGREDIENT });
  const [ingredients, setIngredients] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const requestVersion = useRef(0);
  const pending = useRef(false);

  useLayoutEffect(() => {
    requestVersion.current += 1;

    return () => {
      requestVersion.current += 1;
      pending.current = false;
    };
  }, []);

  function invalidateResult() {
    requestVersion.current += 1;
    pending.current = false;
    setResult(null);
    setBusy(false);
    setError("");
  }

  function updateIngredient(field, value) {
    setIngredient((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function addIngredient(event) {
    event.preventDefault();

    const food = ingredient.food.trim();
    const quantity = Number(ingredient.quantity);

    if (!food) {
      setError("Enter an ingredient name.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Enter a quantity greater than zero.");
      return;
    }

    invalidateResult();

    setIngredients((current) => [
      ...current,
      { food, quantity, unit: ingredient.unit }
    ]);

    setIngredient({ ...EMPTY_INGREDIENT });
  }

  function removeIngredient(index) {
    invalidateResult();
    setIngredients((current) => current.filter((_, i) => i !== index));
  }

  async function calculateMeal() {
    if (pending.current) return;

    invalidateResult();

    if (ingredients.length === 0) {
      setError("Add at least one ingredient.");
      return;
    }

    const snapshot = ingredients.map((item) => ({ ...item }));
    const key = JSON.stringify(snapshot);
    const version = ++requestVersion.current;

    pending.current = true;
    setBusy(true);

    try {
      const data = await api.analyzeRecipe(snapshot);

      if (requestVersion.current !== version) return;

      if (
        !data?.totals ||
        !Array.isArray(data.ingredients) ||
        !Array.isArray(data.incompleteNutrients)
      ) {
        throw new Error("The meal response is incomplete. Please try again.");
      }

      setResult({ data, key, version });
    } catch (error) {
      if (requestVersion.current === version) {
        setError(error.message || "Could not calculate this meal.");
      }
    } finally {
      if (requestVersion.current === version) {
        pending.current = false;
        setBusy(false);
      }
    }
  }

  const resultIsCurrent =
    result != null &&
    result.version === requestVersion.current &&
    result.key === JSON.stringify(ingredients);

  const data = resultIsCurrent ? result.data : null;
  const incompleteNutrients = data?.incompleteNutrients || [];
  const hasAutomaticMatches = data?.ingredients.some(
    (item) => item.match?.autoSelected
  );

  return (
    <>
      <PageHeader
        eyebrow="Nutrition / recipe"
        title="Meal builder"
        subtitle="Calculate your ingredients, review matched foods, and check for missing nutrient information."
      />

      {error && (
        <div className="inline-error page-error" role="alert">
          {error}
        </div>
      )}

      <div className="two-column-grid two-column-grid--wide-left">
        <GlassCard glow>
          <form className="ingredient-form" onSubmit={addIngredient}>
            <input
              required
              aria-label="Ingredient name"
              value={ingredient.food}
              onChange={(event) =>
                updateIngredient("food", event.target.value)
              }
              placeholder="Ingredient name"
            />

            <input
              required
              aria-label="Ingredient quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={ingredient.quantity}
              onChange={(event) =>
                updateIngredient("quantity", event.target.value)
              }
            />

            <select
              aria-label="Ingredient unit"
              value={ingredient.unit}
              onChange={(event) =>
                updateIngredient("unit", event.target.value)
              }
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="oz">oz</option>
              <option value="lb">lb</option>
            </select>

            <NeonButton type="submit">
              <Plus size={15} />
              Add
            </NeonButton>
          </form>

          <p>
            Only ingredients added to the list are included in the totals.
          </p>

          <div className="meal-list">
            {ingredients.map((item, index) => (
              <div className="meal-row" key={`${item.food}-${index}`}>
                <div className="meal-row__icon">
                  <Sparkles size={15} />
                </div>

                <div>
                  <strong>{item.food}</strong>
                  <span>{item.quantity} {item.unit}</span>
                </div>

                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove ${item.food}`}
                  onClick={() => removeIngredient(index)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            {ingredients.length === 0 && (
              <div className="empty-state">
                Add ingredients to build your meal.
              </div>
            )}
          </div>

          <NeonButton
            type="button"
            className="full-width section-gap"
            onClick={calculateMeal}
            disabled={busy || ingredients.length === 0}
          >
            {busy ? "Calculating..." : "Calculate meal"}
          </NeonButton>

          {data && (
            <div className="section-gap">
              <h3>Foods used in this calculation</h3>

              {hasAutomaticMatches && (
                <p>
                  Ingredients entered by name use the first USDA search
                  result. Check the food, brand, and preparation below.
                  An automatic match may differ from what you intended.
                </p>
              )}

              {data.ingredients.map((item, index) => {
                const food = item.food;
                const match = item.match;
                const missing = item.missingNutrients || [];
                const alternatives = match?.alternatives || [];
                const requested =
                  match?.requested || ingredients[index]?.food;

                return (
                  <div
                    className="section-gap"
                    key={`${food.fdcId}-${index}`}
                  >
                    <strong>
                      {requested || `Ingredient ${index + 1}`}
                    </strong>

                    <p>
                      {match?.autoSelected
                        ? "Automatically matched to: "
                        : "Calculated using: "}
                      <strong>{food.description}</strong>
                    </p>

                    <p>
                      FDC ID: {food.fdcId}
                      {food.dataType ? ` · ${food.dataType}` : ""}
                      {food.brandName
                        ? ` · Brand: ${food.brandName}`
                        : food.brandOwner
                          ? ` · Brand owner: ${food.brandOwner}`
                          : ""}
                    </p>

                    <p>
                      Quantity: {item.input.quantity} {item.input.unit}
                      {" · "}
                      {item.input.weightGrams} g
                    </p>

                    {missing.length > 0 && (
                      <p>
                        <strong>Missing nutrient information: </strong>
                        {nutrientNames(missing)}.
                      </p>
                    )}

                    {alternatives.length > 0 && (
                      <details>
                        <summary>Other matches—not used in these totals</summary>
                        <ul>
                          {alternatives.map((alternative) => (
                            <li key={alternative.fdcId}>
                              {alternative.description}
                              {" · FDC ID: "}
                              {alternative.fdcId}
                              {alternative.brandName
                                ? ` · ${alternative.brandName}`
                                : ""}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                );
              })}

              <p>
                If a match is wrong, remove the ingredient and add a more
                specific name, then recalculate. You can also use Nutrition
                Calculator to select an exact food and log it individually.
              </p>
            </div>
          )}
        </GlassCard>

        <GlassCard className="meal-total-card">
          <span className="eyebrow-small">Total</span>
          <h3>Meal nutrition</h3>

          <strong className="big-number">
            {totalDisplay(data, "calories", "kcal")}
          </strong>

          {data && incompleteNutrients.length > 0 && (
            <div className="section-gap">
              <p>
                <strong>Some nutrient information is missing.</strong>
              </p>
              <p>
                “Partial” includes only the ingredients with known values.
                “Unknown” means no total is available; it does not mean zero.
              </p>
              <p>
                Affected nutrients: {nutrientNames(incompleteNutrients)}.
              </p>
            </div>
          )}

          <div className="feature-list">
            {NUTRIENTS.filter(([key]) => key !== "calories").map(
              ([key, label, unit]) => (
                <div key={key}>
                  <strong>{label}</strong>
                  <span>{totalDisplay(data, key, unit)}</span>
                </div>
              )
            )}
          </div>

          {!data && (
            <p role="status">
              {busy
                ? "Calculating the listed ingredients..."
                : "Calculate the current ingredient list to see its totals."}
            </p>
          )}

          {data && (
            <p className="section-gap">
              Source: {data.source || "USDA FoodData Central"}
            </p>
          )}
        </GlassCard>
      </div>
    </>
  );
}