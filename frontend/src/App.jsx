import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";
const USER_ID = 2;

const emptyForm = {
    weight_kg: "",
    waist_cm: "",
    neck_cm: "",
    hip_cm: "",
    recorded_at: "",
    note: ""
};

function App() {
    const [user, setUser] = useState(null);
    const [weightEntries, setWeightEntries] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formMessage, setFormMessage] = useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            setLoading(true);
            setError("");

            const [userResponse, weightResponse, goalResponse] =
                await Promise.all([
                    fetch(`${API_URL}/api/users/${USER_ID}`),
                    fetch(
                        `${API_URL}/api/users/${USER_ID}/weight-entries`
                    ),
                    fetch(
                        `${API_URL}/api/users/${USER_ID}/weight-goals`
                    )
                ]);

            if (
                !userResponse.ok ||
                !weightResponse.ok ||
                !goalResponse.ok
            ) {
                throw new Error("Failed to load dashboard");
            }

            setUser(await userResponse.json());
            setWeightEntries(await weightResponse.json());
            setGoals(await goalResponse.json());
        } catch (error) {
            console.error(error);
            setError(
                "Could not connect to the backend. Make sure server.js is running."
            );
        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setFormMessage("");

            const response = await fetch(
                `${API_URL}/api/users/${USER_ID}/weight-entries`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        weight_kg: form.weight_kg,
                        waist_cm: form.waist_cm || null,
                        neck_cm: form.neck_cm || null,
                        hip_cm: form.hip_cm || null,
                        recorded_at: form.recorded_at || null,
                        note: form.note || null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to save weight"
                );
            }

            setForm(emptyForm);
            setShowForm(false);

            await loadDashboard();
        } catch (error) {
            setFormMessage(error.message);
        } finally {
            setSaving(false);
        }
    }

    const latestEntry = weightEntries[0] || null;
    const activeGoal = goals[0] || null;

    if (loading) {
        return (
            <main className="loading-screen">
                <div className="loader"></div>
                <p>Loading your progress...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="loading-screen">
                <p className="error-message">{error}</p>
                <button
                    className="primary-button"
                    onClick={loadDashboard}
                >
                    Try Again
                </button>
            </main>
        );
    }

    return (
        <main className="app">
            <header className="header">
                <div>
                    <p className="eyebrow">MY PROGRESS</p>
                    <h1>Weight Tracker</h1>
                    <p className="welcome">
                        Welcome back, {user?.name}
                    </p>
                </div>

                <button
                    className="primary-button add-button"
                    onClick={() => setShowForm(true)}
                >
                    + Add New Weight
                </button>
            </header>

            <section className="current-section">
                <div>
                    <p className="section-label">CURRENT WEIGHT</p>

                    <div className="weight-value">
                        {latestEntry?.weight_kg || "â€”"}
                        <span>kg</span>
                    </div>

                    <p className="recorded-date">
                        Last recorded:{" "}
                        {latestEntry?.recorded_at || "No records"}
                    </p>
                </div>

                <div className="goal-summary">
                    <p>Target</p>
                    <strong>
                        {activeGoal?.target_weight_kg || "â€”"} kg
                    </strong>

                    <p>Remaining</p>
                    <strong className="turquoise">
                        {activeGoal?.remaining_weight_kg ?? "â€”"} kg
                    </strong>
                </div>
            </section>

            <section className="stats-grid">
                <StatCard
                    title="BMI"
                    value={latestEntry?.bmi || "â€”"}
                    subtitle={latestEntry?.bmi_category}
                />

                <StatCard
                    title="Body Fat"
                    value={
                        latestEntry?.body_fat_percentage !== null &&
                        latestEntry?.body_fat_percentage !== undefined
                            ? `${latestEntry.body_fat_percentage}%`
                            : "â€”"
                    }
                />

                <StatCard
                    title="Fat Mass"
                    value={
                        latestEntry?.fat_mass_kg !== null &&
                        latestEntry?.fat_mass_kg !== undefined
                            ? `${latestEntry.fat_mass_kg} kg`
                            : "â€”"
                    }
                />

                <StatCard
                    title="Lean Mass"
                    value={
                        latestEntry?.lean_mass_kg !== null &&
                        latestEntry?.lean_mass_kg !== undefined
                            ? `${latestEntry.lean_mass_kg} kg`
                            : "â€”"
                    }
                />
            </section>

            <section className="content-grid">
                <article className="panel goal-panel">
                    <div className="panel-heading">
                        <div>
                            <p className="section-label">
                                WEIGHT GOAL
                            </p>
                            <h2>Your Target</h2>
                        </div>

                        <span className="status-badge">
                            {activeGoal?.status || "No goal"}
                        </span>
                    </div>

                    {activeGoal ? (
                        <div className="goal-content">
                            <div className="progress-circle">
                                <span>
                                    {activeGoal.remaining_weight_kg}
                                </span>
                                <small>kg left</small>
                            </div>

                            <div className="goal-information">
                                <p>
                                    Current
                                    <strong>
                                        {
                                            activeGoal.current_weight_kg
                                        }{" "}
                                        kg
                                    </strong>
                                </p>

                                <p>
                                    Target
                                    <strong>
                                        {
                                            activeGoal.target_weight_kg
                                        }{" "}
                                        kg
                                    </strong>
                                </p>

                                <p>
                                    Action
                                    <strong>
                                        {
                                            activeGoal.required_action
                                        }
                                    </strong>
                                </p>

                                <p>
                                    Target date
                                    <strong>
                                        {activeGoal.target_date ||
                                            "Not set"}
                                    </strong>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p>No active goal found.</p>
                    )}
                </article>

                <article className="panel profile-panel">
                    <p className="section-label">PROFILE</p>
                    <h2>Personal Details</h2>

                    <div className="profile-list">
                        <p>
                            Name
                            <strong>{user?.name}</strong>
                        </p>

                        <p>
                            Date of birth
                            <strong>{user?.date_of_birth}</strong>
                        </p>

                        <p>
                            Gender
                            <strong>{user?.gender}</strong>
                        </p>

                        <p>
                            Height
                            <strong>{user?.height_cm} cm</strong>
                        </p>
                    </div>
                </article>
            </section>

            <section className="panel history-panel">
                <div className="panel-heading">
                    <div>
                        <p className="section-label">HISTORY</p>
                        <h2>Weight Records</h2>
                    </div>

                    <span>{weightEntries.length} entries</span>
                </div>

                {weightEntries.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Weight</th>
                                    <th>BMI</th>
                                    <th>Body Fat</th>
                                    <th>Waist</th>
                                    <th>Note</th>
                                </tr>
                            </thead>

                            <tbody>
                                {weightEntries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>{entry.recorded_at}</td>
                                        <td className="weight-cell">
                                            {entry.weight_kg} kg
                                        </td>
                                        <td>{entry.bmi}</td>
                                        <td>
                                            {entry.body_fat_percentage !==
                                            null
                                                ? `${entry.body_fat_percentage}%`
                                                : "â€”"}
                                        </td>
                                        <td>
                                            {entry.waist_cm !== null
                                                ? `${entry.waist_cm} cm`
                                                : "â€”"}
                                        </td>
                                        <td>{entry.note || "â€”"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>No weight records found.</p>
                )}
            </section>

            {showForm && (
                <div
                    className="modal-background"
                    onMouseDown={() => setShowForm(false)}
                >
                    <div
                        className="modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="modal-heading">
                            <div>
                                <p className="section-label">
                                    NEW RECORD
                                </p>
                                <h2>Add New Weight</h2>
                            </div>

                            <button
                                className="close-button"
                                onClick={() => setShowForm(false)}
                            >
                                Ã—
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <FormField
                                    label="Weight (kg)"
                                    name="weight_kg"
                                    type="number"
                                    value={form.weight_kg}
                                    onChange={handleChange}
                                    required
                                    step="0.01"
                                />

                                <FormField
                                    label="Date and time"
                                    name="recorded_at"
                                    type="datetime-local"
                                    value={form.recorded_at}
                                    onChange={handleChange}
                                />

                                <FormField
                                    label="Waist (cm)"
                                    name="waist_cm"
                                    type="number"
                                    value={form.waist_cm}
                                    onChange={handleChange}
                                    step="0.01"
                                />

                                <FormField
                                    label="Neck (cm)"
                                    name="neck_cm"
                                    type="number"
                                    value={form.neck_cm}
                                    onChange={handleChange}
                                    step="0.01"
                                />

                                {user?.gender === "female" && (
                                    <FormField
                                        label="Hip (cm)"
                                        name="hip_cm"
                                        type="number"
                                        value={form.hip_cm}
                                        onChange={handleChange}
                                        step="0.01"
                                    />
                                )}
                            </div>

                            <label className="form-field">
                                Note
                                <textarea
                                    name="note"
                                    value={form.note}
                                    onChange={handleChange}
                                    placeholder="Example: Morning weight"
                                />
                            </label>

                            {formMessage && (
                                <p className="form-error">
                                    {formMessage}
                                </p>
                            )}

                            <div className="form-buttons">
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() =>
                                        setShowForm(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save Weight"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

function StatCard({ title, value, subtitle }) {
    return (
        <article className="stat-card">
            <p>{title}</p>
            <h3>{value}</h3>
            {subtitle && <span>{subtitle}</span>}
        </article>
    );
}

function FormField({
    label,
    name,
    type,
    value,
    onChange,
    required,
    step
}) {
    return (
        <label className="form-field">
            {label}

            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                step={step}
                min="0"
            />
        </label>
    );
}

export default App;