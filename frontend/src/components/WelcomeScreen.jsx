import { Activity } from "lucide-react";

export default function WelcomeScreen() {
  return (
    <div className="welcome">
      <div className="welcome-glow glow-left" />
      <div className="welcome-glow glow-right" />

      <div className="welcome-brand">
        <div className="brand-icon">
          <Activity />
        </div>

        <div>
          <h1>
            Weight
            <span>
              Track
            </span>
          </h1>

          <p>
            Track • Improve •
            Achieve
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================

