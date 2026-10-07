import { Activity, Calculator, Info, Scale } from "lucide-react";

import GlassCard from "../components/ui/GlassCard";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { useApp } from "../context/AppContext";

const KG_PER_POUND = 0.45359237;
const CM_PER_INCH = 2.54;

function numericValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function displayMeasurement(value, unit, divisor = 1) {
  const parsed = numericValue(value);

  if (parsed === null || parsed <= 0) {
    return "—";
  }

  return `${formatNumber(parsed / divisor)} ${unit}`;
}

export default function BodyMetricsPage() {
  const {
    weightHistory,
    selectedProfile,
    selectedProfileId,
    weightUnit,
    lengthUnit,
  } = useApp();

  const profileReady =
    selectedProfileId != null &&
    selectedProfile != null &&
    Number(selectedProfile.profile_id) === Number(selectedProfileId);

  const records = Array.isArray(weightHistory) ? weightHistory : [];
  const latest = profileReady ? records[records.length - 1] : null;

  const preferredWeightUnit = weightUnit === "lb" ? "lb" : "kg";
  const preferredLengthUnit = lengthUnit === "in" ? "in" : "cm";

  const bmi = numericValue(latest?.bmi);
  const bodyFat = numericValue(latest?.body_fat_percentage);

  const validBMI = bmi !== null && bmi > 0;
  const validBodyFat = bodyFat !== null && bodyFat > 0 && bodyFat < 100;

  return (
    <>
      <PageHeader
        eyebrow="Health / calculations"
        title="Body metrics"
        subtitle="Your latest recorded metrics, displayed in your preferred units."
      />

      <section className="stats-grid">
        <StatCard
          icon={Scale}
          label="Weight"
          value={displayMeasurement(
            latest?.weight_kg,
            preferredWeightUnit,
            preferredWeightUnit === "lb" ? KG_PER_POUND : 1,
          )}
          helper="Latest record"
          accent="cyan"
        />

        <StatCard
          icon={Calculator}
          label="BMI"
          value={validBMI ? formatNumber(bmi) : "—"}
          helper={
            validBMI
              ? latest?.bmi_category || "Category unavailable"
              : "No calculated value"
          }
          accent="violet"
        />

        <StatCard
          icon={Activity}
          label="Body fat"
          value={validBodyFat ? `${formatNumber(bodyFat)}%` : "—"}
          helper="Estimate from the latest record"
          accent="pink"
        />

        <StatCard
          icon={Info}
          label="Height"
          value={displayMeasurement(
            profileReady ? selectedProfile.height_cm : null,
            preferredLengthUnit,
            preferredLengthUnit === "in" ? CM_PER_INCH : 1,
          )}
          helper="Current profile value"
          accent="orange"
        />
      </section>

      <GlassCard className="info-banner">
        <Info size={20} />

        <div>
          <strong>Understanding these values</strong>
          <p>
            Weight, BMI and body fat come from your latest weight record. Height
            comes from your current profile. Changing your preferred units
            changes how measurements appear; BMI and body-fat percentages stay
            the same.
          </p>
          <p>
            Adult BMI categories apply from age 20. Missing calculations are
            shown as “—”. These estimates are not a medical diagnosis.
          </p>
        </div>
      </GlassCard>
    </>
  );
}
