import { Activity, Flame, Salad, Scale, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import WeightTrend from "../components/charts/WeightTrend";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";

import { useApp } from "../context/AppContext";
import { api } from "../services/api";

const KG_PER_POUND = 0.45359237;

const MICRO_NUTRIENTS = [
  ["fiber_g", "Fibre", "g", 1],
  ["potassium_mg", "Potassium", "mg", 0],
  ["sodium_mg", "Sodium", "mg", 0],
];

function displayNumber(value, decimals = 1) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  if (!Number.isFinite(number)) return null;

  return number.toFixed(decimals).replace(/\.0+$/, "");
}

function displayWeight(value, unit) {
  if (value === null || value === undefined || value === "") {
    return "No record";
  }

  const kilograms = Number(value);

  if (!Number.isFinite(kilograms) || kilograms <= 0) {
    return "No record";
  }

  const displayed = unit === "lb" ? kilograms / KG_PER_POUND : kilograms;

  return `${displayed.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} ${unit}`;
}

function nutrientSummary(totals, key, unit, decimals = 1) {
  const coverage = totals?.coverage?.[key];
  const formatted = displayNumber(totals?.[key], decimals);

  if (coverage?.status === "empty") {
    return {
      value: `0 ${unit}`,
      helper: "No foods logged",
    };
  }

  if (coverage?.status === "unknown") {
    return {
      value: "Unknown",
      helper: `Missing for all ${coverage.missing_count} foods`,
    };
  }

  if (formatted === null) {
    return {
      value: "Unknown",
      helper: "Nutrition value unavailable",
    };
  }

  if (coverage?.status === "partial") {
    return {
      value: `${formatted} ${unit} · Partial`,
      helper:
        `Known for ${coverage.known_count} foods; ` +
        `missing for ${coverage.missing_count}`,
    };
  }

  if (coverage?.status === "complete") {
    return {
      value: `${formatted} ${unit}`,
      helper: `Known for all ${coverage.known_count} foods`,
    };
  }

  return {
    value: `${formatted} ${unit}`,
    helper: "Completeness information unavailable",
  };
}

export default function DashboardPage({ onNavigate }) {
  const {
    user,
    selectedProfile,
    weightHistory,
    nutritionTotals,
    nutritionDate,
    weightUnit,
  } = useApp();

  const [taskSummary, setTaskSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const userId = user?.user_id;

    if (!userId) {
      setTaskSummary(null);
      return;
    }

    setTaskSummary({
      userId,
      loading: true,
      error: "",
      total: 0,
      completed: 0,
    });

    async function loadTasks() {
      try {
        const lists = await api.getTaskLists(userId);
        if (cancelled) return;

        const taskArrays = await Promise.all(
          lists.map((list) => api.getTasks(userId, list.list_id)),
        );

        if (cancelled) return;

        const tasks = taskArrays.flat();

        setTaskSummary({
          userId,
          loading: false,
          error: "",
          total: tasks.length,
          completed: tasks.filter(
            (task) => task.is_completed === true || task.is_completed === 1,
          ).length,
        });
      } catch (error) {
        if (cancelled) return;

        setTaskSummary({
          userId,
          loading: false,
          error: error.message || "Could not load task totals.",
          total: 0,
          completed: 0,
        });
      }
    }

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, [user?.user_id]);

  const records = weightHistory || [];
  const latestWeight = records.length > 0 ? records[records.length - 1] : null;

  const unit = weightUnit === "lb" ? "lb" : "kg";

  // Only display totals that identify the selected date.
  const receivedTotals = nutritionTotals?.totals;
  const totalsReady = receivedTotals?.logged_date === nutritionDate;
  const totals = totalsReady ? receivedTotals : {};

  function summary(key, nutrientUnit, decimals = 1) {
    if (!totalsReady) {
      return {
        value: "—",
        helper: "Waiting for nutrition totals",
      };
    }

    return nutrientSummary(totals, key, nutrientUnit, decimals);
  }

  const calories = summary("calories", "kcal", 0);
  const protein = summary("protein_g", "g");
  const carbs = summary("carbs_g", "g");
  const fat = summary("fat_g", "g");

  const hasMissingNutrition = Object.values(totals.coverage || {}).some(
    (coverage) =>
      coverage.status === "partial" || coverage.status === "unknown",
  );

  const currentTasks =
    user?.user_id != null &&
    Number(taskSummary?.userId) === Number(user.user_id)
      ? taskSummary
      : null;

  return (
    <>
      <PageHeader
        eyebrow="Command center"
        title={`Welcome, ${user?.name || ""}`}
        subtitle="Your profile, weight history, tasks and selected day's nutrition."
        action={
          <NeonButton type="button" onClick={() => onNavigate("nutrition")}>
            <Sparkles size={16} />
            Add food
          </NeonButton>
        }
      />

      <section className="hero-strip">
        <div className="hero-strip__copy">
          <span>VYRA / LIVE DATA</span>
          <h2>
            Track the inputs.
            <br />
            See the pattern.
          </h2>
          <p>
            Review your weight trends, logged meals and tasks. Nutrition
            summaries below are for {nutritionDate}.
          </p>
        </div>

        <div className="hero-orbit" aria-hidden="true">
          <div className="hero-orbit__core">
            <Sparkles size={26} />
          </div>
          <span className="orbit orbit--1" />
          <span className="orbit orbit--2" />
          <span className="orbit orbit--3" />
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          icon={Flame}
          label={`Calories · ${nutritionDate}`}
          value={calories.value}
          helper={calories.helper}
          accent="orange"
        />
        <StatCard
          icon={Salad}
          label={`Protein · ${nutritionDate}`}
          value={protein.value}
          helper={protein.helper}
          accent="violet"
        />
        <StatCard
          icon={Activity}
          label={`Carbs · ${nutritionDate}`}
          value={carbs.value}
          helper={carbs.helper}
          accent="cyan"
        />
        <StatCard
          icon={Salad}
          label={`Fat · ${nutritionDate}`}
          value={fat.value}
          helper={fat.helper}
          accent="pink"
        />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-grid__wide">
          <WeightTrend records={records} />
        </div>

        <GlassCard className="daily-nutrition-card" glow>
          <div className="card-heading">
            <div>
              <span className="eyebrow-small">Selected day's nutrition</span>
              <h3>{nutritionDate}</h3>
            </div>

            <button
              type="button"
              className="text-button"
              onClick={() => onNavigate("meal-history")}
            >
              Open log
            </button>
          </div>

          {hasMissingNutrition && (
            <p>
              Partial totals include only known values. Unknown means missing
              information, not zero.
            </p>
          )}

          <div className="daily-nutrition-matrix">
            {MICRO_NUTRIENTS.map(([key, label, nutrientUnit, decimals]) => {
              const nutrient = summary(key, nutrientUnit, decimals);

              return (
                <div key={key}>
                  <span>{label}</span>
                  <strong>{nutrient.value}</strong>
                  <small>{nutrient.helper}</small>
                </div>
              );
            })}

            <div>
              <span>Logged</span>
              <strong>
                {totalsReady ? `${totals.item_count} items` : "—"}
              </strong>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="card-heading">
            <div>
              <span className="eyebrow-small">Selected profile</span>
              <h3>{selectedProfile?.profile_name || "Loading profile…"}</h3>
            </div>

            <button
              type="button"
              className="text-button"
              onClick={() => onNavigate("profiles")}
            >
              Manage
            </button>
          </div>

          <div className="feature-list">
            <div>
              <strong>Latest weight</strong>
              <span>{displayWeight(latestWeight?.weight_kg, unit)}</span>
            </div>

            <div>
              <strong>Activity</strong>
              <span>
                {selectedProfile?.activity_level?.replaceAll("_", " ") ||
                  "Not specified"}
              </span>
            </div>

            <div>
              <strong>Tasks</strong>
              <span>
                {!currentTasks || currentTasks.loading
                  ? "Loading…"
                  : currentTasks.error
                    ? "Unavailable"
                    : `${currentTasks.completed}/${currentTasks.total} completed`}
              </span>
            </div>
          </div>

          {currentTasks?.error && (
            <div className="inline-error section-gap-top" role="alert">
              {currentTasks.error}
            </div>
          )}
        </GlassCard>

        <GlassCard className="dashboard-cta">
          <Scale size={25} />
          <h3>Keep your records together</h3>
          <p>
            Add weight entries, review your progress, and keep each profile’s
            food history organised by date.
          </p>
        </GlassCard>
      </section>
    </>
  );
}
