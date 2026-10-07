import {
  Activity,
  Ruler,
  Scale,
  Target
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

import { displayMeasurement } from "../utils/units";

export default function HealthPage() {
  const {
    selectedProfile,
    weightHistory,
    weightUnit,
    lengthUnit
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
        eyebrow="Health / overview"
        title="Health overview"
        subtitle="A neutral overview of the data stored in your selected profile."
      />

      <section className="stats-grid">
        <StatCard
          icon={Scale}
          label="Current weight"
          value={
            latest
              ? displayMeasurement(latest.weight_kg, weightUnit)
              : "No record"
          }
          helper="Latest weight record"
          accent="cyan"
        />

        <StatCard
          icon={Ruler}
          label="Height"
          value={
            selectedProfile
              ?.height_cm
              ? displayMeasurement(selectedProfile.height_cm, lengthUnit)
              : "Not set"
          }
          helper="Profile value"
          accent="violet"
        />

        <StatCard
          icon={Activity}
          label="Activity"
          value={
            selectedProfile
              ?.activity_level
              ?.replaceAll(
                "_",
                " "
              ) ||
            "Not specified"
          }
          helper="Profile setting"
          accent="pink"
        />

        <StatCard
          icon={Target}
          label="Target weight"
          value={
            selectedProfile
              ?.target_weight_kg
              ? displayMeasurement(selectedProfile.target_weight_kg, weightUnit)
              : "Optional"
          }
          helper="No judgment attached"
          accent="orange"
        />
      </section>

      <GlassCard glow>
        <div className="card-heading">
          <div>
            <span className="eyebrow-small">
              Profile details
            </span>
            <h3>
              {
                selectedProfile
                  ?.profile_name
              }
            </h3>
          </div>
        </div>

        <div className="detail-grid">
          {[
            [
              "Date of birth",
              selectedProfile
                ?.dob ||
                "—"
            ],
            [
              "Gender",
              selectedProfile
                ?.gender ||
                "—"
            ],
            [
              "Waist",
              selectedProfile
                ?.waist_cm
                ? displayMeasurement(selectedProfile.waist_cm, lengthUnit)
                : "—"
            ],
            [
              "Chest",
              selectedProfile
                ?.chest_cm
                ? displayMeasurement(selectedProfile.chest_cm, lengthUnit)
                : "—"
            ],
            [
              "Neck",
              selectedProfile
                ?.neck_cm
                ? displayMeasurement(selectedProfile.neck_cm, lengthUnit)
                : "—"
            ],
            [
              "Hip",
              selectedProfile
                ?.hip_cm
                ? displayMeasurement(selectedProfile.hip_cm, lengthUnit)
                : "—"
            ]
          ].map(
            ([
              label,
              value
            ]) => (
              <div
                key={
                  label
                }
                className="detail-tile"
              >
                <span>
                  {label}
                </span>
                <strong>
                  {value}
                </strong>
              </div>
            )
          )}
        </div>
      </GlassCard>
    </>
  );
}
