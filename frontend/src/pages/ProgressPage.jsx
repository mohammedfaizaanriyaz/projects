import {
  Activity,
  Scale
} from "lucide-react";

import WeightTrend
  from "../components/charts/WeightTrend";

import PageHeader
  from "../components/ui/PageHeader";

import StatCard
  from "../components/ui/StatCard";

import {
  useApp
} from "../context/AppContext";

export default function ProgressPage() {
  const {
    weightHistory
  } =
    useApp();

  const first =
    weightHistory[0];

  const last =
    weightHistory[
      weightHistory.length -
        1
    ];

  const change =
    first &&
    last
      ? Number(
          last.weight_kg
        ) -
        Number(
          first.weight_kg
        )
      : null;

  return (
    <>
      <PageHeader
        eyebrow="Analytics / real data"
        title="Progress"
        subtitle="Trend-focused analytics from the data you actually recorded."
      />

      <section className="stats-grid stats-grid--three">
        <StatCard
          icon={Scale}
          label="Records"
          value={
            weightHistory.length
          }
          helper="Stored weight entries"
          accent="cyan"
        />

        <StatCard
          icon={Activity}
          label="Overall change"
          value={
            change == null
              ? "—"
              : `${change > 0 ? "+" : ""}${change.toFixed(1)} kg`
          }
          helper="From first to latest record"
          accent="violet"
        />

        <StatCard
          icon={Scale}
          label="Latest"
          value={
            last
              ? `${last.weight_kg} kg`
              : "—"
          }
          helper="Most recent record"
          accent="pink"
        />
      </section>

      <WeightTrend
        records={
          weightHistory
        }
      />
    </>
  );
}
