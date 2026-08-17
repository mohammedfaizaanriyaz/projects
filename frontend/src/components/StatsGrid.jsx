import { Activity, Ruler, Scale, Target } from "lucide-react";
import Metric from "./Metric";
import { bmiCategory, displayWeight } from "../utils/weightUtils";

export default function StatsGrid({
  currentWeight,
  weightUnit,
  weightChange,
  bmi,
  bodyFat,
  targetWeight,
  remaining,
  weightAction,
}) {
  return (
    <section className="stats">
      <Metric
        label="Current Weight"
        value={displayWeight(currentWeight, weightUnit)}
        icon={<Scale />}
        detail={
          weightChange === null
            ? "No previous entry"
            : `${weightChange > 0 ? "+" : ""}${weightChange} kg from last entry`
        }
      />

      <Metric
        label="BMI"
        value={bmi !== null ? bmi.toFixed(1) : "—"}
        icon={<Activity />}
        detail={bmiCategory(bmi)}
      />

      <Metric
        label="Body Fat"
        value={bodyFat !== null ? `${bodyFat.toFixed(1)}%` : "—"}
        icon={<Ruler />}
        detail={bodyFat === null ? "Add waist & neck measurements" : "Latest estimate"}
      />

      <Metric
        label="Goal"
        value={displayWeight(targetWeight, weightUnit)}
        icon={<Target />}
        detail={
          remaining !== null
            ? weightAction === "goal reached"
              ? "Goal reached"
              : `${displayWeight(remaining, weightUnit)} ${weightAction}`
            : "No target set"
        }
      />
    </section>
  );
}
