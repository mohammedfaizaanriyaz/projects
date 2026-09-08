import {
  Activity,
  Calculator,
  Info,
  Scale
} from "lucide-react";

import GlassCard
  from "../components/ui/GlassCard";

import PageHeader
  from "../components/ui/PageHeader";

import StatCard
  from "../components/ui/StatCard";

import {
  useApp
} from "../context/AppContext";

export default function BodyMetricsPage() {
  const {
    weightHistory,
    selectedProfile
  } =
    useApp();

  const latest =
    weightHistory[
      weightHistory.length -
        1
    ];

  return (
    <>
      <PageHeader
        eyebrow="Health / calculations"
        title="Body metrics"
        subtitle="Numeric health calculations from your backend, with age-aware interpretation."
      />

      <section className="stats-grid">
        <StatCard
          icon={Scale}
          label="Weight"
          value={
            latest
              ? `${latest.weight_kg} kg`
              : "—"
          }
          helper="Latest record"
          accent="cyan"
        />

        <StatCard
          icon={Calculator}
          label="BMI"
          value={
            latest?.bmi ??
            "—"
          }
          helper={
            latest
              ?.bmi_category ||
            "Numeric value"
          }
          accent="violet"
        />

        <StatCard
          icon={Activity}
          label="Body fat"
          value={
            latest
              ?.body_fat_percentage !=
            null
              ? `${latest.body_fat_percentage}%`
              : "—"
          }
          helper="Only when inputs allow calculation"
          accent="pink"
        />

        <StatCard
          icon={Info}
          label="Height"
          value={
            selectedProfile
              ?.height_cm
              ? `${selectedProfile.height_cm} cm`
              : "—"
          }
          helper="Profile value"
          accent="orange"
        />
      </section>

      <GlassCard className="info-banner">
        <Info size={20} />
        <div>
          <strong>
            Age-aware display
          </strong>
          <p>
            If the backend returns
            no BMI category for a
            younger profile, this
            frontend leaves the
            category blank rather
            than applying adult
            labels.
          </p>
        </div>
      </GlassCard>
    </>
  );
}
