import { Goal } from "lucide-react";
import { displayWeight } from "../utils/weightUtils";

export default function GoalCard({
  currentWeight,
  targetWeight,
  remaining,
  healthy,
  unit,
}) {
  let percentage = 0;

  if (
    currentWeight &&
    targetWeight
  ) {
    const difference =
      Math.abs(
        currentWeight -
          targetWeight
      );

    percentage =
      Math.max(
        0,
        Math.min(
          100,
          100 -
            difference *
              8
        )
      );
  }

  return (
    <article className="card goal-card">
      <div className="goal-icon">
        <Goal />
      </div>

      <span className="eyebrow">
        YOUR GOAL
      </span>

      <h2>
        {displayWeight(
          targetWeight,
          unit
        )}
      </h2>

      <p>
        {remaining !== null
          ? `${displayWeight(
              remaining,
              unit
            )} remaining`
          : "Set a goal to track progress"}
      </p>

      <div className="progress-ring">
        <svg
          viewBox="0 0 130 130"
        >
          <circle
            cx="65"
            cy="65"
            r="52"
            className="ring-track"
          />

          <circle
            cx="65"
            cy="65"
            r="52"
            className="ring-progress"
            style={{
              strokeDashoffset:
                327 -
                (327 *
                  percentage) /
                  100,
            }}
          />
        </svg>

        <div>
          <strong>
            {Math.round(
              percentage
            )}
            %
          </strong>

          <span>
            progress
          </span>
        </div>
      </div>

      {healthy && (
        <div className="healthy-box">
          <span>
            General healthy BMI
            weight range
          </span>

          <strong>
            {displayWeight(
              healthy.min,
              unit
            )}
            {" – "}
            {displayWeight(
              healthy.max,
              unit
            )}
          </strong>
        </div>
      )}

      <small className="health-note">
        This range is a
        general BMI reference,
        not an appearance
        standard.
      </small>
    </article>
  );
}

// ============================================================
// PROFILE CARD
// ============================================================

