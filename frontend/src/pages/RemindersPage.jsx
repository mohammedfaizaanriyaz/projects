import { Bell, CheckCircle2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import PageHeader from "../components/ui/PageHeader";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";

export default function RemindersPage() {
  const { user } = useApp();
  const userId = user?.user_id;
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState(null);
  const revision = useRef(0);
  const acknowledging = useRef(false);
  const fetching = useRef(false);

  const load = useCallback(async () => {
    if (!userId || acknowledging.current || fetching.current) return;
    const request = ++revision.current;
    fetching.current = true;
    setLoading(true);
    try {
      const data = await api.getDueReminders(userId);
      if (request !== revision.current) return;
      setReminders(data); setError("");
    } catch (error) {
      if (request === revision.current) setError(error.message);
    } finally {
      if (request === revision.current) { fetching.current = false; setLoading(false); }
    }
  }, [userId]);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 30000);
    return () => { window.clearInterval(interval); revision.current += 1; fetching.current = false; };
  }, [load]);

  async function acknowledge(taskId) {
    if (acknowledging.current) return;
    acknowledging.current = true;
    const request = ++revision.current; // Discard a poll started before this write.
    fetching.current = false;
    setPendingId(taskId); setError(""); setLoading(false);
    try {
      await api.acknowledgeReminder(userId, taskId);
      if (request !== revision.current) return;
      setReminders((current) => current.filter((item) => item.task_id !== taskId));
    } catch (error) {
      if (request === revision.current) setError(error.message);
    } finally {
      if (request === revision.current) { acknowledging.current = false; setPendingId(null); }
    }
  }

  return <>
    <PageHeader eyebrow="Attention / live" title="Reminders"
      subtitle="This page checks for due reminders every 30 seconds while it is open. Mark each one handled after reviewing it."
      action={<NeonButton variant="secondary" onClick={load} disabled={loading || pendingId !== null}><RefreshCw size={15} />Refresh</NeonButton>} />
    {error && <div className="inline-error page-error" role="alert">{error}</div>}
    <GlassCard glow><div className="reminder-list">
      {loading && <p role="status">Loading reminders…</p>}
      {reminders.map((reminder) => <div className="reminder-row" key={reminder.task_id}>
        <div className="reminder-row__icon"><Bell size={17} /></div>
        <div><strong>{reminder.title}</strong><span>{reminder.list_name ? `${reminder.list_name} · ` : ""}
          {reminder.reminder_at ? new Date(reminder.reminder_at).toLocaleString() : "Due now"}</span></div>
        <button className="ack-button" disabled={pendingId !== null} onClick={() => acknowledge(reminder.task_id)}>
          <CheckCircle2 size={16} />{pendingId === reminder.task_id ? "Saving…" : "Handled"}
        </button>
      </div>)}
      {!loading && !error && reminders.length === 0 && <div className="empty-state">No due reminders.</div>}
    </div></GlassCard>
  </>;
}
