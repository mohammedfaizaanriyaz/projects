import {
  Activity,
  Flame,
  RefreshCw,
  Salad,
  Trash2
} from "lucide-react";

import GlassCard
  from "../components/ui/GlassCard";

import NeonButton
  from "../components/ui/NeonButton";

import PageHeader
  from "../components/ui/PageHeader";

import StatCard
  from "../components/ui/StatCard";

import {
  useApp
} from "../context/AppContext";

function number(
  value,
  decimals = 1
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return "0";
  }

  return parsed
    .toFixed(decimals)
    .replace(
      /\.0+$/,
      ""
    );
}

const MEAL_ORDER = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "other"
];

export default function MealHistoryPage() {
  const {
    nutritionDate,
    setNutritionDate,
    nutritionLogs,
    nutritionTotals,
    refreshNutritionDay,
    deleteNutritionLog
  } =
    useApp();

  const totals =
    nutritionTotals?.totals ||
    {};

  async function remove(
    logId
  ) {
    if (
      !window.confirm(
        "Remove this food from the daily log?"
      )
    ) {
      return;
    }

    await deleteNutritionLog(
      logId
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Nutrition / daily log"
        title="Daily nutrition"
        subtitle="Calories, macros and micronutrients are summed from the USDA foods you actually log."
        action={
          <div className="history-date-controls">
            <input
              type="date"
              value={
                nutritionDate
              }
              onChange={(
                event
              ) =>
                setNutritionDate(
                  event.target
                    .value
                )
              }
            />

            <NeonButton
              variant="secondary"
              onClick={() =>
                refreshNutritionDay()
              }
            >
              <RefreshCw
                size={15}
              />
              Refresh
            </NeonButton>
          </div>
        }
      />

      <section className="stats-grid">
        <StatCard
          icon={Flame}
          label="Calories"
          value={`${number(totals.calories, 0)} kcal`}
          helper={`${totals.item_count || 0} foods`}
          accent="orange"
        />

        <StatCard
          icon={Salad}
          label="Protein"
          value={`${number(totals.protein_g)} g`}
          helper="Daily total"
          accent="violet"
        />

        <StatCard
          icon={Activity}
          label="Carbs"
          value={`${number(totals.carbs_g)} g`}
          helper="Daily total"
          accent="cyan"
        />

        <StatCard
          icon={Salad}
          label="Fat"
          value={`${number(totals.fat_g)} g`}
          helper={`Fibre ${number(totals.fiber_g)} g`}
          accent="pink"
        />
      </section>

      <GlassCard
        className="daily-micro-card"
        glow
      >
        <div className="daily-nutrition-matrix daily-nutrition-matrix--wide">
          <div>
            <span>
              Fibre
            </span>
            <strong>
              {number(
                totals.fiber_g
              )}{" "}
              g
            </strong>
          </div>

          <div>
            <span>
              Potassium
            </span>
            <strong>
              {number(
                totals.potassium_mg,
                0
              )}{" "}
              mg
            </strong>
          </div>

          <div>
            <span>
              Sodium
            </span>
            <strong>
              {number(
                totals.sodium_mg,
                0
              )}{" "}
              mg
            </strong>
          </div>

          <div>
            <span>
              Calcium
            </span>
            <strong>
              {number(
                totals.calcium_mg,
                0
              )}{" "}
              mg
            </strong>
          </div>

          <div>
            <span>
              Iron
            </span>
            <strong>
              {number(
                totals.iron_mg
              )}{" "}
              mg
            </strong>
          </div>
        </div>
      </GlassCard>

      <div className="meal-history-stack">
        {MEAL_ORDER.map(
          (mealType) => {
            const items =
              nutritionLogs.filter(
                (item) =>
                  item.meal_type ===
                  mealType
              );

            if (
              items.length ===
              0
            ) {
              return null;
            }

            const mealTotal =
              nutritionTotals
                ?.meals?.[
                mealType
              ];

            return (
              <GlassCard
                key={
                  mealType
                }
              >
                <div className="card-heading">
                  <div>
                    <span className="eyebrow-small">
                      Meal
                    </span>
                    <h3 className="capitalize">
                      {mealType}
                    </h3>
                  </div>

                  <span className="metric-chip">
                    {number(
                      mealTotal
                        ?.calories,
                      0
                    )}{" "}
                    kcal
                  </span>
                </div>

                <div className="meal-list">
                  {items.map(
                    (item) => (
                      <div
                        className="meal-row meal-row--history"
                        key={
                          item.log_id
                        }
                      >
                        <div className="meal-row__icon">
                          <Salad
                            size={
                              15
                            }
                          />
                        </div>

                        <div>
                          <strong>
                            {
                              item.food_name
                            }
                          </strong>

                          <span>
                            {
                              item.quantity
                            }{" "}
                            {
                              item.unit
                            }{" "}
                            ·{" "}
                            {number(
                              item.calories,
                              0
                            )}{" "}
                            kcal ·{" "}
                            {number(
                              item.protein_g
                            )}{" "}
                            g protein
                          </span>
                        </div>

                        <button
                          className="icon-button"
                          onClick={() =>
                            remove(
                              item.log_id
                            )
                          }
                          aria-label={`Remove ${item.food_name}`}
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
              </GlassCard>
            );
          }
        )}

        {nutritionLogs.length ===
          0 && (
          <GlassCard
            glow
          >
            <div className="empty-state">
              No foods logged for
              {` ${nutritionDate}`}.
              Use Nutrition
              Calculator → Calculate
              → Add to meal.
            </div>
          </GlassCard>
        )}
      </div>
    </>
  );
}
