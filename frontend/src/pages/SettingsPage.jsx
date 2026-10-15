import { Ruler, Scale, ShieldCheck } from "lucide-react";
import GlassCard from "../components/ui/GlassCard";
import PageHeader from "../components/ui/PageHeader";
import { useApp } from "../context/AppContext";

export default function SettingsPage() {
  const {
    weightUnit,
    lengthUnit,
    setWeightUnit,
    setLengthUnit,
    unitPreferenceError
  } = useApp();

  return (
    <>
      <PageHeader
        eyebrow="Control center"
        title="Settings"
        subtitle="Unit preferences are stored on this browser and shared across profiles. Height supports ft/in entry in the Fitness goals roadmap; current forms use cm or inches."
      />

      {unitPreferenceError && (
        <div className="inline-error page-error" role="alert">
          {unitPreferenceError}
        </div>
      )}

      <div className="settings-grid">
        <GlassCard>
          <div className="settings-row">
            <Scale size={21} />
            <div>
              <label htmlFor="weight-unit">
                <strong>Weight unit</strong>
              </label>

              <select
                id="weight-unit"
                value={weightUnit}
                onChange={(event) =>
                  setWeightUnit(event.target.value)
                }
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="lb">Pounds (lb)</option>
              </select>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="settings-row">
            <Ruler size={21} />
            <div>
              <label htmlFor="length-unit">
                <strong>Length unit</strong>
              </label>

              <select
                id="length-unit"
                value={lengthUnit}
                onChange={(event) =>
                  setLengthUnit(event.target.value)
                }
              >
                <option value="cm">Centimetres (cm)</option>
                <option value="in">Inches (in)</option>
              </select>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="settings-row">
            <ShieldCheck size={21} />
            <div>
              <strong>Identity</strong>
              <span>Your session is protected. Sign out on shared devices.</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}