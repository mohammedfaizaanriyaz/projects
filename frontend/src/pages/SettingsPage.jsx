import {
  Moon,
  Ruler,
  ShieldCheck
} from "lucide-react";

import {
  useEffect,
  useState
} from "react";

import GlassCard
  from "../components/ui/GlassCard";

import PageHeader
  from "../components/ui/PageHeader";

export default function SettingsPage() {
  const [
    weightUnit,
    setWeightUnit
  ] =
    useState(
      () =>
        localStorage
          .getItem(
            "vyra_weight_unit"
          ) ||
        "kg"
    );

  const [
    lengthUnit,
    setLengthUnit
  ] =
    useState(
      () =>
        localStorage
          .getItem(
            "vyra_length_unit"
          ) ||
        "cm"
    );

  useEffect(() => {
    localStorage.setItem(
      "vyra_weight_unit",
      weightUnit
    );
  }, [weightUnit]);

  useEffect(() => {
    localStorage.setItem(
      "vyra_length_unit",
      lengthUnit
    );
  }, [lengthUnit]);

  return (
    <>
      <PageHeader
        eyebrow="Control center"
        title="Settings"
        subtitle="Local presentation preferences only — login identity still comes from the backend session."
      />

      <div className="settings-grid">
        <GlassCard>
          <div className="settings-row">
            <Ruler
              size={21}
            />
            <div>
              <strong>
                Weight unit
              </strong>
              <select
                value={
                  weightUnit
                }
                onChange={(
                  event
                ) =>
                  setWeightUnit(
                    event.target
                      .value
                  )
                }
              >
                <option value="kg">
                  kg
                </option>
                <option value="lb">
                  lb
                </option>
              </select>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="settings-row">
            <Moon
              size={21}
            />
            <div>
              <strong>
                Length unit
              </strong>
              <select
                value={
                  lengthUnit
                }
                onChange={(
                  event
                ) =>
                  setLengthUnit(
                    event.target
                      .value
                  )
                }
              >
                <option value="cm">
                  cm
                </option>
                <option value="in">
                  inches
                </option>
              </select>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="settings-row">
            <ShieldCheck
              size={21}
            />
            <div>
              <strong>
                Identity
              </strong>
              <span>
                HTTP-only backend
                auth cookie
              </span>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
