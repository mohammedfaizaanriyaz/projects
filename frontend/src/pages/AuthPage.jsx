import {
  Activity,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound
} from "lucide-react";

import {
  useState
} from "react";

import NeonButton
  from "../components/ui/NeonButton";

import {
  useApp
} from "../context/AppContext";

export default function AuthPage() {
  const {
    login,
    register
  } =
    useApp();

  const [
    mode,
    setMode
  ] =
    useState("login");

  const [
    form,
    setForm
  ] =
    useState({
      name: "",
      email: "",
      password: ""
    });

  const [
    error,
    setError
  ] =
    useState("");

  const [
    busy,
    setBusy
  ] =
    useState(false);

  function update(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value
      })
    );
  }

  async function submit(
    event
  ) {
    event.preventDefault();
    if (busy) return;

    try {
      setBusy(true);
      setError("");

      if (
        mode === "login"
      ) {
        await login({
          email:
            form.email,
          password:
            form.password
        });
      } else {
        await register({
          name:
            form.name,
          email:
            form.email,
          password:
            form.password
        });
      }
    } catch (error) {
      setError(
        error.message
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="space-texture" />
      <div className="grid-texture" />

      <section className="auth-hero">
        <div className="brand brand--large">
          <div className="brand__mark">
            <Sparkles
              size={20}
            />
          </div>

          <div>
            <strong>VYRA</strong>
            <span>
              HEALTH OS
            </span>
          </div>
        </div>

        <div>
          <span className="page-eyebrow">
            <Activity
              size={13}
            />
            Your personal
            command center
          </span>

          <h1>
            Health data.
            <br />
            Nutrition.
            <br />
            Routines.
            <br />
            <em>
              One system.
            </em>
          </h1>

          <p>
            A private workspace
            for your profiles,
            weight history,
            tasks, reminders and
            USDA nutrition
            calculations.
          </p>
        </div>
      </section>

      <section className="auth-panel glass-card glass-card--glow">
        <div className="auth-tabs">
          <button
            disabled={busy}
            className={
              mode === "login"
                ? "is-active"
                : ""
            }
            onClick={() =>
              setMode(
                "login"
              )
            }
          >
            Login
          </button>

          <button
            disabled={busy}
            className={
              mode === "register"
                ? "is-active"
                : ""
            }
            onClick={() =>
              setMode(
                "register"
              )
            }
          >
            Register
          </button>
        </div>

        <div className="auth-panel__heading">
          <span className="eyebrow-small">
            Protected session
          </span>

          <h2>
            {mode ===
            "login"
              ? "Welcome back"
              : "Create your account"}
          </h2>

          <p>
            Sign in to access your profiles, health records and daily routines.
          </p>
        </div>

        <form
          className="form-stack"
          onSubmit={
            submit
          }
        >
          {mode ===
            "register" && (
            <label className="field">
              <span>
                Name
              </span>

              <div className="field-input">
                <UserRound
                  size={16}
                />

                <input
                  required
                  autoComplete="name"
                  maxLength={100}
                  disabled={busy}
                  value={
                    form.name
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "name",
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Your name"
                />
              </div>
            </label>
          )}

          <label className="field">
            <span>
              Email
            </span>

            <div className="field-input">
              <Mail
                size={16}
              />

              <input
                required
                type="email"
                autoComplete="username"
                maxLength={255}
                disabled={busy}
                value={
                  form.email
                }
                onChange={(
                  event
                ) =>
                  update(
                    "email",
                    event
                      .target
                      .value
                  )
                }
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="field">
            <span>
              Password
            </span>

            <div className="field-input">
              <LockKeyhole
                size={16}
              />

              <input
                required
                minLength={8}
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                disabled={busy}
                value={
                  form.password
                }
                onChange={(
                  event
                ) =>
                  update(
                    "password",
                    event
                      .target
                      .value
                  )
                }
                placeholder="At least 8 characters"
              />
            </div>
          </label>

          {error && (
            <div className="inline-error" role="alert">
              {error}
            </div>
          )}

          <NeonButton
            type="submit"
            disabled={
              busy
            }
            className="full-width"
          >
            {busy
              ? "Working..."
              : mode ===
                "login"
              ? "Enter VYRA"
              : "Create account"}
          </NeonButton>
        </form>
      </section>
    </main>
  );
}
