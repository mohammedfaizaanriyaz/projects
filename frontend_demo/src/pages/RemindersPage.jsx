import {
  Bell,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

import {
  useEffect,
  useState
} from "react";

import GlassCard
  from "../components/ui/GlassCard";

import NeonButton
  from "../components/ui/NeonButton";

import PageHeader
  from "../components/ui/PageHeader";

import {
  useApp
} from "../context/AppContext";

import {
  api
} from "../services/api";

export default function RemindersPage() {
  const {
    user
  } =
    useApp();

  const [
    reminders,
    setReminders
  ] =
    useState([]);

  const [
    error,
    setError
  ] =
    useState("");

  const [
    loading,
    setLoading
  ] =
    useState(false);

  async function load() {
    if (
      !user?.user_id
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data =
        await api
          .getDueReminders(
            user.user_id
          );

      setReminders(
        data
      );
    } catch (error) {
      setError(
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const interval =
      window.setInterval(
        load,
        30000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [user?.user_id]);

  async function acknowledge(
    taskId
  ) {
    try {
      setError("");

      await api
        .acknowledgeReminder(
          user.user_id,
          taskId
        );

      setReminders(
        (current) =>
          current.filter(
            (item) =>
              item.task_id !==
              taskId
          )
      );
    } catch (error) {
      setError(
        error.message
      );
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Attention / live"
        title="Reminders"
        subtitle="Due reminders are polled every 30 seconds and acknowledged only after you handle them."
        action={
          <NeonButton
            variant="secondary"
            onClick={
              load
            }
            disabled={
              loading
            }
          >
            <RefreshCw
              size={15}
            />
            Refresh
          </NeonButton>
        }
      />

      {error && (
        <div className="inline-error page-error">
          {error}
        </div>
      )}

      <GlassCard glow>
        <div className="reminder-list">
          {reminders.map(
            (reminder) => (
              <div
                className="reminder-row"
                key={
                  reminder.task_id
                }
              >
                <div className="reminder-row__icon">
                  <Bell
                    size={17}
                  />
                </div>

                <div>
                  <strong>
                    {
                      reminder.title
                    }
                  </strong>

                  <span>
                    {reminder.list_name
                      ? `${reminder.list_name} · `
                      : ""}
                    {reminder.reminder_at
                      ? String(
                          reminder.reminder_at
                        ).replace(
                          "T",
                          " "
                        )
                      : "Due now"}
                  </span>
                </div>

                <button
                  className="ack-button"
                  onClick={() =>
                    acknowledge(
                      reminder.task_id
                    )
                  }
                >
                  <CheckCircle2
                    size={16}
                  />
                  Handled
                </button>
              </div>
            )
          )}

          {!loading &&
            reminders.length ===
              0 && (
              <div className="empty-state">
                No due reminders.
              </div>
            )}
        </div>
      </GlassCard>
    </>
  );
}
