import { useMemo, useState } from "react";
import { Calculator, Target } from "lucide-react";
import GlassCard from "../components/ui/GlassCard";
import PageHeader from "../components/ui/PageHeader";
import NeonButton from "../components/ui/NeonButton";
import { useApp } from "../context/AppContext";
import { ACTIVITY_FACTORS, GOALS, calculateAdultTargets, recommendGoal, validateOverrides } from "../utils/goals";

const descriptions = {
  fat_loss: "A modest calorie reduction while supporting exercise and recovery.",
  recomposition: "Maintain energy intake while improving strength and fitness.",
  muscle_gain: "A small energy surplus to support progressive training.",
};
const keys = [["targetCalories", "Calories", "kcal"], ["proteinG", "Protein", "g"], ["carbsG", "Carbohydrates", "g"], ["fatG", "Fat", "g"]];
function readPreference(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}
function savePreference(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

export default function GoalsPage() {
  const { user, selectedProfile, selectedProfileId, weightHistory, weightUnit } = useApp();
  const key = `vyra_goals_${user?.user_id ?? "anon"}_${selectedProfileId ?? "none"}`;
  const [stored, setStored] = useState(() => readPreference(key, {}));
  const [message, setMessage] = useState("");
  const currentWeight = weightHistory?.at(-1)?.weight_kg;
  const [goal, setGoal] = useState(stored.goal || recommendGoal());
  const [trainingFrequency, setTrainingFrequency] = useState(stored.trainingFrequency ?? "3");
  const [dietaryPreference, setDietaryPreference] = useState(stored.dietaryPreference || "no_preference");
  const [targetWeight, setTargetWeight] = useState(stored.targetWeight ?? "");
  const [overrides, setOverrides] = useState(stored.overrides || {});
  const profile = selectedProfile;
  const values = useMemo(() => calculateAdultTargets({
    dob: profile?.dob ? String(profile.dob).slice(0,10) : "",
    sex: profile?.gender,
    heightCm: profile?.height_cm,
    weightKg: currentWeight,
    activityLevel: profile?.activity_level,
    goal,
  }), [profile?.dob, profile?.gender, profile?.height_cm, profile?.activity_level, currentWeight, goal]);
  const overrideCheck = useMemo(() => validateOverrides(overrides, values), [overrides, values]);
  const unitFactor = weightUnit === "lb" ? 0.45359237 : 1;
  function save() {
    setMessage("");
    if (!Number.isInteger(Number(trainingFrequency)) || Number(trainingFrequency) < 0 || Number(trainingFrequency) > 14) {
      setMessage("Training frequency must be between 0 and 14 sessions per week."); return;
    }
    if (targetWeight !== "" && (!Number.isFinite(Number(targetWeight)) || Number(targetWeight) <= 0 || Number(targetWeight) * unitFactor > 300)) {
      setMessage("Enter a plausible positive target weight."); return;
    }
    if (Object.keys(overrides).some(k => overrides[k] !== "" && overrides[k] != null) && !overrideCheck.valid) {
      setMessage(overrideCheck.error); return;
    }
    const next = { goal, trainingFrequency, dietaryPreference, targetWeight, overrides: overrideCheck.valid ? overrideCheck.values : {} };
    if (savePreference(key, next)) { setStored(next); setMessage("Goal choices saved to this browser for the selected profile."); }
    else setMessage("Browser storage is blocked. Your choices could not be saved.");
  }
  return <>
    <PageHeader eyebrow="Health / goals" title="Fitness goals" subtitle="Personalized adult estimates and adjustable starting targets. Your settings are saved on this browser."/>
    <div className="two-column-grid">
      <GlassCard glow>
        <div className="card-heading"><div><span className="eyebrow-small">Step 1</span><h3>Choose your focus</h3></div><Target size={18}/></div>
        <div className="form-stack">
          <p className="goals-note">Suggested starting option: <strong>{GOALS[recommendGoal()]}</strong>. This is a neutral default, not a judgment based on your body size.</p>
          {Object.entries(GOALS).map(([id,label]) => <label className="goal-choice" key={id}><input type="radio" name="fitness-goal" checked={goal === id} onChange={() => { setGoal(id); setOverrides({}); }} /><span><strong>{label}</strong><small>{descriptions[id]}</small></span></label>)}
          <label className="field"><span>Training sessions per week (0–14)</span><input type="number" min="0" max="14" step="1" value={trainingFrequency} onChange={e=>setTrainingFrequency(e.target.value)}/></label>
          <label className="field"><span>Dietary preference</span><select value={dietaryPreference} onChange={e=>setDietaryPreference(e.target.value)}><option value="no_preference">No preference</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="other">Other / self-directed</option></select></label>
          <label className="field"><span>Optional target weight ({weightUnit})</span><input type="number" min="0.01" step="0.1" value={targetWeight} onChange={e=>setTargetWeight(e.target.value)} /></label>
          <p className="goals-note">For a different activity level, height or starting weight, update your Profile, Measurements or Weight page. Those values power the estimate below.</p>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="card-heading"><div><span className="eyebrow-small">Step 2</span><h3>Daily energy and macros</h3></div><Calculator size={18}/></div>
        {!values.available ? <div className="empty-state" role="status">{values.reason}</div> : <>
          <div className="goals-estimates"><div><span>BMR estimate</span><strong>{values.bmr} kcal/day</strong></div><div><span>Maintenance (TDEE)</span><strong>{values.tdee} kcal/day</strong></div></div>
          <p className="goals-note">{values.equation}</p><p className="goals-note">{values.note}</p>
          <p className="goals-note">Activity multiplier: {values.activityFactor}. Training frequency is for your own planning; activity level drives the multiplier, so training sessions are not counted twice.</p>
          <div className="form-grid">
            {keys.map(([field,label,unit]) => <label key={field} className="field"><span>{label} ({unit}/day)</span><input type="number" min="0" step="1" placeholder={String(values[field])} value={overrides[field] ?? ""} onChange={e=>setOverrides(prev=>({...prev,[field]:e.target.value}))} /><small className="goals-note">Estimated: {values[field]} {unit} · {overrides[field] !== "" && overrides[field] != null ? "Manual override" : "Calculation"}</small></label>)}
          </div>
          <p className="goals-note">Blank fields use the calculated recommendation. Macro overrides are independent and may not sum to your calorie target.</p>
        </>}
        <div className="form-actions goals-actions"><NeonButton type="button" onClick={save}>Save goal preferences</NeonButton></div>
        {message && <p role="status" className="goals-note">{message}</p>}
      </GlassCard>
    </div>
    <GlassCard className="section-gap-top"><p className="goals-note">Estimates are educational starting points, not prescriptions or medical diagnoses. The calculator does not set calorie targets for profiles under 20 or with missing/implausible information. It cannot account for pregnancy, illness, medication, or specialized nutritional needs.</p></GlassCard>
  </>;
}
