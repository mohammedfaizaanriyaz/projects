import { Edit3, Trash2 } from "lucide-react";
import { displayLength, formatFullDate } from "../utils/weightUtils";

export default function ProfileCard({
  profile,
  lengthUnit,
  onLengthUnitChange,
  onEdit,
  onDelete,
}) {
  if (!profile) {
    return null;
  }

  return (
    <article className="card">
      <div className="card-header">
        <div>
          <span className="eyebrow">BODY PROFILE</span>

          <h2>Personal Details</h2>
        </div>

        <div className="card-actions">
          <button
            onClick={onEdit}
            aria-label="Edit profile"
            title="Edit profile"
          >
            <Edit3 />
          </button>

          <button
            className="danger"
            onClick={onDelete}
            aria-label="Delete profile"
            title="Delete profile"
          >
            <Trash2 />
          </button>
        </div>
      </div>

      <div className="unit-selector detail-unit">
        <button
          className={lengthUnit === "cm" ? "selected" : ""}
          onClick={() => onLengthUnitChange("cm")}
        >
          cm
        </button>

        <button
          className={lengthUnit === "inch" ? "selected" : ""}
          onClick={() => onLengthUnitChange("inch")}
        >
          inch
        </button>
      </div>

      <div className="details-grid">
        <Detail name="Name" value={profile.profile_name} />

        <Detail name="DOB" value={formatFullDate(profile.dob)} />

        <Detail name="Gender" value={profile.gender} />

        <Detail
          name="Height"
          value={displayLength(profile.height_cm, lengthUnit)}
        />

        <Detail
          name="Waist"
          value={displayLength(profile.waist_cm, lengthUnit)}
        />

        <Detail
          name="Chest"
          value={displayLength(profile.chest_cm, lengthUnit)}
        />

        <Detail
          name="Neck"
          value={displayLength(profile.neck_cm, lengthUnit)}
        />

        <Detail name="Hip" value={displayLength(profile.hip_cm, lengthUnit)} />
      </div>
    </article>
  );
}

function Detail({ name, value }) {
  return (
    <div className="detail">
      <span>{name}</span>

      <strong>{value || "—"}</strong>
    </div>
  );
}

// ============================================================
// HISTORY
// ============================================================
