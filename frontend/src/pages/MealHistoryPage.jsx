import { Activity, Flame, RefreshCw, Salad, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { useApp } from "../context/AppContext";

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack", "other"];

const MICRO_NUTRIENTS = [
  ["fiber_g", "Fibre", "g", 1],
  ["potassium_mg", "Potassium", "mg", 0],
  ["sodium_mg", "Sodium", "mg", 0],
  ["calcium_mg", "Calcium", "mg", 0],
  ["iron_mg", "Iron", "mg", 1]
];

function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;

  return parsed.toFixed(decimals).replace(/\.0+$/, "");
}

// Display a single food's value without changing missing data to zero.
function foodValue(value, unit, decimals = 1) {
  const formatted = formatNumber(value, decimals);
  return formatted === null ? "Unknown" : `${formatted} ${unit}`;
}

// Display an aggregate using the backend's completeness information.
function nutrientSummary(totals, key, unit, decimals = 1) {
  const coverage = totals?.coverage?.[key];
  const formatted = formatNumber(totals?.[key], decimals);

  if (coverage?.status === "empty") {
    return {
      value: `0 ${unit}`,
      helper: "No foods logged"
    };
  }

  if (coverage?.status === "unknown") {
    return {
      value: "Unknown",
      helper: `Missing for all ${coverage.missing_count} foods`
    };
  }

  if (formatted === null) {
    return {
      value: "Unknown",
      helper: "Nutrition value unavailable"
    };
  }

  if (coverage?.status === "partial") {
    return {
      value: `${formatted} ${unit} · Partial`,
      helper:
        `Known for ${coverage.known_count} foods; ` +
        `missing for ${coverage.missing_count}`
    };
  }

  if (coverage?.status === "complete") {
    return {
      value: `${formatted} ${unit}`,
      helper: `Known for all ${coverage.known_count} foods`
    };
  }

  // Do not claim completeness if an older API omits coverage.
  return {
    value: `${formatted} ${unit}`,
    helper: "Completeness information unavailable"
  };
}

export default function MealHistoryPage() {
  const {
    nutritionDate,
    setNutritionDate,
    nutritionLogs,
    nutritionTotals,
    refreshNutritionDay,
    deleteNutritionLog,
    dataStatus
  } = useApp();

  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const actionLocked = useRef(false);

  const logs = nutritionLogs || [];
  const totals = nutritionTotals?.totals || {};

  const calories = nutrientSummary(totals, "calories", "kcal", 0);
  const protein = nutrientSummary(totals, "protein_g", "g");
  const carbs = nutrientSummary(totals, "carbs_g", "g");
  const fat = nutrientSummary(totals, "fat_g", "g");

  const hasMissingNutrition = Object.values(
    totals.coverage || {}
  ).some((coverage) =>
    coverage.status === "partial" || coverage.status === "unknown"
  );

  async function runAction(action) {
    if (actionLocked.current) return;

    actionLocked.current = true;
    setPending(true);
    setError("");

    try {
      await action();
    } catch (error) {
      setError(error.message || "The action could not be completed.");
    } finally {
      actionLocked.current = false;
      setPending(false);
    }
  }

  function remove(logId) {
    if (actionLocked.current) return;

    if (!window.confirm("Remove this food from the daily log?")) {
      return;
    }

    return runAction(() => deleteNutritionLog(logId));
  }

  function changeDate(value) {
    if (!value || actionLocked.current) return;

    setError("");
    setNutritionDate(value);
  }

  return (
    <>
      <PageHeader
        eyebrow="Nutrition / daily log"
        title="Daily nutrition"
        subtitle="Totals include known nutrient values. Missing information is marked below."
        action={
          <div className="history-date-controls">
            <input
              type="date"
              aria-label="Nutrition log date"
              value={nutritionDate}
              disabled={pending}
              onChange={(event) => changeDate(event.target.value)}
            />

            <NeonButton
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => runAction(() => refreshNutritionDay())}
            >
              <RefreshCw size={15} />
              {pending ? "Working..." : "Refresh"}
            </NeonButton>
          </div>
        }
      />

      {error && (
        <div className="inline-error page-error" role="alert">
          {error}
        </div>
      )}

      {hasMissingNutrition && (
        <GlassCard>
          <p>
            Some foods have missing nutrient information.
            “Partial” totals include only known values.
            “Unknown” means no value is available—it does not mean zero.
          </p>
        </GlassCard>
      )}

      <section className="stats-grid">
        <StatCard
          icon={Flame}
          label="Calories"
          value={calories.value}
          helper={calories.helper}
          accent="orange"
        />

        <StatCard
          icon={Salad}
          label="Protein"
          value={protein.value}
          helper={protein.helper}
          accent="violet"
        />

        <StatCard
          icon={Activity}
          label="Carbs"
          value={carbs.value}
          helper={carbs.helper}
          accent="cyan"
        />

        <StatCard
          icon={Salad}
          label="Fat"
          value={fat.value}
          helper={fat.helper}
          accent="pink"
        />
      </section>

      <GlassCard className="daily-micro-card" glow>
        <div className="daily-nutrition-matrix daily-nutrition-matrix--wide">
          {MICRO_NUTRIENTS.map(([key, label, unit, decimals]) => {
            const summary = nutrientSummary(totals, key, unit, decimals);

            return (
              <div key={key}>
                <span>{label}</span>
                <strong>{summary.value}</strong>
                <small>{summary.helper}</small>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <div className="meal-history-stack">
        {MEAL_ORDER.map((mealType) => {
          const items = logs.filter((item) => item.meal_type === mealType);
          if (items.length === 0) return null;

          const mealTotals = nutritionTotals?.meals?.[mealType];
          const mealCalories = nutrientSummary(
            mealTotals,
            "calories",
            "kcal",
            0
          );

          return (
            <GlassCard key={mealType}>
              <div className="card-heading">
                <div>
                  <span className="eyebrow-small">Meal</span>
                  <h3 className="capitalize">{mealType}</h3>
                </div>

                <span className="metric-chip">
                  {mealCalories.value}
                </span>
              </div>

              <p>{mealCalories.helper}</p>

              <div className="meal-list">
                {items.map((item) => (
                  <div
                    className="meal-row meal-row--history"
                    key={item.log_id}
                  >
                    <div className="meal-row__icon">
                      <Salad size={15} />
                    </div>

                    <div>
                      <strong>{item.food_name}</strong>
                      <span>
                        {item.unit?.startsWith("portion:") || item.unit === "serving" ? `${item.weight_grams} g · ${item.quantity} USDA portion(s)` : `${item.quantity} ${item.unit}`}
                        {" · Calories: "}
                        {foodValue(item.calories, "kcal", 0)}
                        {" · Protein: "}
                        {foodValue(item.protein_g, "g")}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="icon-button"
                      disabled={pending}
                      onClick={() => remove(item.log_id)}
                      aria-label={`Remove ${item.food_name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          );
        })}

        {dataStatus.nutrition === "loading" && <p role="status">Loading foods for {nutritionDate}…</p>}
        {dataStatus.nutrition === "ready" && logs.length === 0 && (
          <GlassCard glow>
            <div className="empty-state">
              No foods logged for {nutritionDate}.
              Use Nutrition Calculator → Calculate → Add to meal.
            </div>
          </GlassCard>
        )}
      </div>
    </>
  );
}