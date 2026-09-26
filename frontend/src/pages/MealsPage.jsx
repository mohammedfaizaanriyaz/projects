import {
  Plus,
  Sparkles,
  Trash2
} from "lucide-react";

import {
  useState
} from "react";

import GlassCard
  from "../components/ui/GlassCard";

import NeonButton
  from "../components/ui/NeonButton";

import PageHeader
  from "../components/ui/PageHeader";

import {
  api
} from "../services/api";

export default function MealsPage() {
  const [
    ingredient,
    setIngredient
  ] =
    useState({
      food: "",
      quantity: "100",
      unit: "g"
    });

  const [
    ingredients,
    setIngredients
  ] =
    useState([]);

  const [
    result,
    setResult
  ] =
    useState(null);

  const [
    error,
    setError
  ] =
    useState("");

  const [
    busy,
    setBusy
  ] =
    useState(false);

  function addIngredient(
    event
  ) {
    event.preventDefault();

    if (
      !ingredient.food.trim()
    ) {
      return;
    }

    setIngredients(
      (current) => [
        ...current,
        {
          food:
            ingredient.food.trim(),
          quantity:
            Number(
              ingredient.quantity
            ),
          unit:
            ingredient.unit
        }
      ]
    );

    setIngredient({
      food: "",
      quantity: "100",
      unit: "g"
    });

    setResult(null);
  }

  async function calculateMeal() {
    if (
      ingredients.length ===
      0
    ) {
      setError(
        "Add at least one ingredient."
      );
      return;
    }

    try {
      setBusy(true);
      setError("");

      const data =
        await api
          .analyzeRecipe(
            ingredients
          );

      setResult(data);
    } catch (error) {
      setError(
        error.message
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Nutrition / recipe"
        title="Meal builder"
        subtitle="Add ingredients and let the backend total their USDA nutrition."
      />

      {error && (
        <div className="inline-error page-error">
          {error}
        </div>
      )}

      <div className="two-column-grid two-column-grid--wide-left">
        <GlassCard
          glow
        >
          <form
            className="ingredient-form"
            onSubmit={
              addIngredient
            }
          >
            <input
              required
              value={
                ingredient.food
              }
              onChange={(
                event
              ) =>
                setIngredient(
                  (
                    current
                  ) => ({
                    ...current,
                    food:
                      event.target
                        .value
                  })
                )
              }
              placeholder="Ingredient name"
            />

            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={
                ingredient.quantity
              }
              onChange={(
                event
              ) =>
                setIngredient(
                  (
                    current
                  ) => ({
                    ...current,
                    quantity:
                      event.target
                        .value
                  })
                )
              }
            />

            <select
              value={
                ingredient.unit
              }
              onChange={(
                event
              ) =>
                setIngredient(
                  (
                    current
                  ) => ({
                    ...current,
                    unit:
                      event.target
                        .value
                  })
                )
              }
            >
              <option value="g">
                g
              </option>
              <option value="kg">
                kg
              </option>
              <option value="oz">
                oz
              </option>
              <option value="lb">
                lb
              </option>
            </select>

            <NeonButton
              type="submit"
            >
              <Plus
                size={15}
              />
              Add
            </NeonButton>
          </form>

          <div className="meal-list">
            {ingredients.map(
              (
                item,
                index
              ) => (
                <div
                  className="meal-row"
                  key={`${item.food}-${index}`}
                >
                  <div className="meal-row__icon">
                    <Sparkles
                      size={
                        15
                      }
                    />
                  </div>

                  <div>
                    <strong>
                      {
                        item.food
                      }
                    </strong>
                    <span>
                      {
                        item.quantity
                      }{" "}
                      {
                        item.unit
                      }
                    </span>
                  </div>

                  <button
                    className="icon-button"
                    onClick={() =>
                      setIngredients(
                        (
                          current
                        ) =>
                          current.filter(
                            (
                              _,
                              i
                            ) =>
                              i !==
                              index
                          )
                      )
                    }
                  >
                    <Trash2
                      size={
                        15
                      }
                    />
                  </button>
                </div>
              )
            )}
          </div>

          <NeonButton
            className="full-width section-gap"
            onClick={
              calculateMeal
            }
            disabled={
              busy ||
              ingredients.length ===
                0
            }
          >
            {busy
              ? "Calculating..."
              : "Calculate meal"}
          </NeonButton>
        </GlassCard>

        <GlassCard className="meal-total-card">
          <span className="eyebrow-small">
            Total
          </span>

          <h3>
            Meal nutrition
          </h3>

          <strong className="big-number">
            {result?.totals
              ?.calories ??
              "—"}
          </strong>

          <span className="big-number-unit">
            kcal
          </span>

          <div className="feature-list">
            <div>
              <strong>
                Protein
              </strong>
              <span>
                {result?.totals
                  ?.protein_g ??
                  "—"}{" "}
                g
              </span>
            </div>

            <div>
              <strong>
                Carbs
              </strong>
              <span>
                {result?.totals
                  ?.carbs_g ??
                  "—"}{" "}
                g
              </span>
            </div>

            <div>
              <strong>
                Fat
              </strong>
              <span>
                {result?.totals
                  ?.fat_g ??
                  "—"}{" "}
                g
              </span>
            </div>

            <div>
              <strong>
                Potassium
              </strong>
              <span>
                {result?.totals
                  ?.potassium_mg ??
                  "—"}{" "}
                mg
              </span>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
