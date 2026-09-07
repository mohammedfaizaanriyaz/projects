import {
  Activity,
  Flame,
  ListChecks,
  Salad,
  Scale,
  Sparkles
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import WeightTrend
  from "../components/charts/WeightTrend";

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

import {
  api
} from "../services/api";

function displayNumber(
  value,
  decimals = 1
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return "0";
  }

  return number
    .toFixed(decimals)
    .replace(
      /\.0+$/,
      ""
    );
}

export default function DashboardPage({
  onNavigate
}) {
  const {
    user,
    selectedProfile,
    weightHistory,
    nutritionTotals,
    nutritionDate
  } =
    useApp();

  const [
    taskSummary,
    setTaskSummary
  ] =
    useState({
      total: 0,
      completed: 0,
      lists: 0
    });

  useEffect(() => {
    async function loadTasks() {
      if (
        !user?.user_id
      ) {
        return;
      }

      try {
        const lists =
          await api
            .getTaskLists(
              user.user_id
            );

        const taskArrays =
          await Promise.all(
            lists.map(
              (list) =>
                api.getTasks(
                  user.user_id,
                  list.list_id
                )
            )
          );

        const tasks =
          taskArrays.flat();

        setTaskSummary({
          lists:
            lists.length,
          total:
            tasks.length,
          completed:
            tasks.filter(
              (task) =>
                task
                  .is_completed
            ).length
        });
      } catch {
        // The dedicated Tasks page
        // will surface request errors.
      }
    }

    loadTasks();
  }, [user?.user_id]);

  const latestWeight =
    useMemo(() => {
      if (
        weightHistory.length ===
        0
      ) {
        return null;
      }

      return weightHistory[
        weightHistory.length -
          1
      ];
    }, [weightHistory]);

  const totals =
    nutritionTotals?.totals ||
    {};

  return (
    <>
      <PageHeader
        eyebrow="Command center"
        title={`Welcome, ${user?.name || ""}`}
        subtitle="Your real profile, weight history, tasks and daily nutrition in one place."
        action={
          <NeonButton
            onClick={() =>
              onNavigate(
                "nutrition"
              )
            }
          >
            <Sparkles
              size={16}
            />
            Add food
          </NeonButton>
        }
      />

      <section className="hero-strip">
        <div className="hero-strip__copy">
          <span>
            VYRA / LIVE DATA
          </span>

          <h2>
            Track the inputs.
            <br />
            See the pattern.
          </h2>

          <p>
            USDA nutrition,
            profile data, weight
            history, tasks and
            reminders now flow
            through your backend
            account instead of a
            localStorage identity.
          </p>
        </div>

        <div className="hero-orbit">
          <div className="hero-orbit__core">
            <Sparkles
              size={26}
            />
          </div>
          <span className="orbit orbit--1" />
          <span className="orbit orbit--2" />
          <span className="orbit orbit--3" />
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          icon={Flame}
          label="Today's calories"
          value={`${displayNumber(totals.calories, 0)} kcal`}
          helper={`${totals.item_count || 0} logged foods`}
          accent="orange"
        />

        <StatCard
          icon={Salad}
          label="Protein"
          value={`${displayNumber(totals.protein_g)} g`}
          helper="Today's total"
          accent="violet"
        />

        <StatCard
          icon={Activity}
          label="Carbs"
          value={`${displayNumber(totals.carbs_g)} g`}
          helper="Today's total"
          accent="cyan"
        />

        <StatCard
          icon={Salad}
          label="Fat"
          value={`${displayNumber(totals.fat_g)} g`}
          helper="Today's total"
          accent="pink"
        />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-grid__wide">
          <WeightTrend
            records={
              weightHistory
            }
          />
        </div>

        <GlassCard
          className="daily-nutrition-card"
          glow
        >
          <div className="card-heading">
            <div>
              <span className="eyebrow-small">
                Daily nutrition
              </span>
              <h3>
                {nutritionDate}
              </h3>
            </div>

            <button
              className="text-button"
              onClick={() =>
                onNavigate(
                  "meal-history"
                )
              }
            >
              Open log
            </button>
          </div>

          <div className="daily-nutrition-matrix">
            <div>
              <span>
                Fibre
              </span>
              <strong>
                {displayNumber(
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
                {displayNumber(
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
                {displayNumber(
                  totals.sodium_mg,
                  0
                )}{" "}
                mg
              </strong>
            </div>

            <div>
              <span>
                Logged
              </span>
              <strong>
                {totals.item_count ||
                  0}{" "}
                items
              </strong>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="card-heading">
            <div>
              <span className="eyebrow-small">
                Selected profile
              </span>
              <h3>
                {
                  selectedProfile
                    ?.profile_name
                }
              </h3>
            </div>

            <button
              className="text-button"
              onClick={() =>
                onNavigate(
                  "profiles"
                )
              }
            >
              Manage
            </button>
          </div>

          <div className="feature-list">
            <div>
              <strong>
                Latest weight
              </strong>
              <span>
                {latestWeight
                  ? `${latestWeight.weight_kg} kg`
                  : "No record"}
              </span>
            </div>

            <div>
              <strong>
                Activity
              </strong>
              <span>
                {selectedProfile
                  ?.activity_level
                  ?.replaceAll(
                    "_",
                    " "
                  ) ||
                  "Not specified"}
              </span>
            </div>

            <div>
              <strong>
                Tasks
              </strong>
              <span>
                {
                  taskSummary.completed
                }
                /
                {
                  taskSummary.total
                }{" "}
                completed
              </span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="dashboard-cta">
          <Scale
            size={25}
          />
          <h3>
            One source of truth
          </h3>
          <p>
            Account identity comes
            from the secure backend
            cookie. MariaDB stores
            your selected profile's
            weight and daily food
            history.
          </p>
        </GlassCard>
      </section>
    </>
  );
}
