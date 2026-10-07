import { Check, Circle, Plus, Trash2, Pencil } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import PageHeader from "../components/ui/PageHeader";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";

// Prevent duplicate actions and ignore results after unmount.
function useSafeAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lifecycle = useRef(0);
  const locked = useRef(false);

  useLayoutEffect(() => {
    lifecycle.current += 1;

    return () => {
      lifecycle.current += 1;
      locked.current = false;
    };
  }, []);

  async function run(action) {
    if (locked.current) return;

    const generation = lifecycle.current;
    const isCurrent = () => lifecycle.current === generation;

    locked.current = true;
    setBusy(true);
    setError("");

    try {
      await action(isCurrent);
    } catch (error) {
      if (isCurrent()) {
        setError(error.message || "Something went wrong.");
      }
    } finally {
      if (isCurrent()) {
        locked.current = false;
        setBusy(false);
      }
    }
  }

  return { busy, error, run };
}

export default function TasksPage() {
  const { user } = useApp();

  if (!user?.user_id) {
    return (
      <GlassCard>
        <p>Please log in to view your tasks.</p>
      </GlassCard>
    );
  }

  return <TaskWorkspace key={user.user_id} userId={user.user_id} />;
}

function TaskWorkspace({ userId }) {
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(null);
  const [listName, setListName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const { busy, error, run } = useSafeAction();

  useEffect(() => {
    let cancelled = false;

    async function loadLists() {
      setLoading(true);
      setLoadError("");

      try {
        const data = await api.getTaskLists(userId);
        if (cancelled) return;

        setLists(data);
        setSelectedListId((current) => {
          const exists = data.some(
            (list) => Number(list.list_id) === Number(current)
          );

          return current != null && exists
            ? current
            : data[0]?.list_id ?? null;
        });
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message || "Could not load your lists.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLists();

    return () => {
      cancelled = true;
    };
  }, [userId, reload]);

  const disabled = busy || loading || Boolean(loadError);
  const selectedList = lists.find(
    (list) => Number(list.list_id) === Number(selectedListId)
  );

  function reloadLists() {
    setLoading(true);
    setReload((current) => current + 1);
  }

  function createList(event) {
    event.preventDefault();

    const name = listName.trim();
    if (disabled || !name) return;

    return run(async (isCurrent) => {
      const result = await api.createTaskList(userId, {
        list_name: name,
        list_type: "todo"
      });

      if (!isCurrent()) return;

      const created = result.list;
      setListName("");

      if (created?.list_id) {
        setLists((current) => [
          ...current.filter(
            (list) => Number(list.list_id) !== Number(created.list_id)
          ),
          created
        ]);
        setSelectedListId(created.list_id);
      } else {
        reloadLists();
      }
    });
  }

  function renameList(event) {
    event.preventDefault();
    if (disabled || !selectedList) return;
    const name = String(new FormData(event.currentTarget).get("list_name") || "").trim();
    if (!name) return;
    const id = selectedList.list_id;
    return run(async (isCurrent) => {
      await api.updateTaskList(userId, id, { list_name: name, list_type: selectedList.list_type });
      if (isCurrent()) setLists((current) => current.map((list) => list.list_id === id ? { ...list, list_name: name } : list));
    });
  }

  function removeList() {
    if (disabled || !selectedListId) return;
    if (!window.confirm("Delete this list and its tasks?")) return;

    const listId = selectedListId;

    return run(async (isCurrent) => {
      await api.deleteTaskList(userId, listId);
      if (!isCurrent()) return;

      const remaining = lists.filter(
        (list) => Number(list.list_id) !== Number(listId)
      );

      setLists(remaining);
      setSelectedListId(remaining[0]?.list_id ?? null);
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Execution / tasks"
        title="Tasks & routines"
        subtitle="Manage your task lists, tasks, due dates and reminders."
      />

      {(error || loadError) && (
        <div className="inline-error page-error" role="alert">
          {error || loadError}
        </div>
      )}

      <div className="task-layout">
        <GlassCard>
          <div className="card-heading">
            <div>
              <span className="eyebrow-small">Lists</span>
              <h3>Your folders</h3>
            </div>
          </div>

          <form className="inline-form" onSubmit={createList}>
            <input
              required
              maxLength={120}
              aria-label="New list name"
              value={listName}
              disabled={disabled}
              onChange={(event) => setListName(event.target.value)}
              placeholder="New list"
            />

            <NeonButton
              type="submit"
              disabled={disabled || !listName.trim()}
            >
              <Plus size={15} />
              Add
            </NeonButton>
          </form>

          {loading && <p role="status">Loading lists…</p>}

          {!loading && loadError && (
            <NeonButton
              variant="secondary"
              disabled={busy}
              onClick={reloadLists}
            >
              Retry loading lists
            </NeonButton>
          )}

          <div className="list-stack">
            {lists.map((list) => (
              <button
                type="button"
                key={list.list_id}
                disabled={disabled}
                className={`list-option ${
                  Number(selectedListId) === Number(list.list_id)
                    ? "is-active"
                    : ""
                }`}
                onClick={() => setSelectedListId(list.list_id)}
              >
                <span>{list.list_name}</span>
                <small>{list.list_type}</small>
              </button>
            ))}
          </div>

          {!loading && !loadError && lists.length === 0 && (
            <p>Create your first list to get started.</p>
          )}

          {selectedList && <form className="inline-form" key={`${selectedList.list_id}:${selectedList.list_name}`} onSubmit={renameList}>
            <input name="list_name" aria-label="Rename selected list" defaultValue={selectedList.list_name} required maxLength={120} disabled={disabled} />
            <button type="submit" className="text-button" disabled={disabled}>Rename</button>
          </form>}
          {selectedList && (
            <button
              type="button"
              className="danger-button full-width"
              disabled={disabled}
              onClick={removeList}
            >
              <Trash2 size={15} />
              Delete list
            </button>
          )}
        </GlassCard>

        {selectedList ? (
          <TaskListPanel
            key={selectedList.list_id}
            userId={userId}
            listId={selectedList.list_id}
            listName={selectedList.list_name}
            workspaceBusy={disabled}
          />
        ) : (
          <GlassCard className="task-main-card" glow>
            <div className="empty-state">
              {loading
                ? "Loading your lists…"
                : "Create or select a list to view its tasks."}
            </div>
          </GlassCard>
        )}
      </div>
    </>
  );
}

function emptyTaskForm() {
  return {
    title: "",
    description: "",
    time_limit_minutes: "",
    due_at: "",
    reminder_at: ""
  };
}

function localDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function TaskListPanel({ userId, listId, listName, workspaceBusy }) {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const { busy, error, run } = useSafeAction();

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      setLoading(true);
      setLoadError("");
      setTasks([]);

      try {
        const data = await api.getTasks(userId, listId);
        if (!cancelled) setTasks(data);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message || "Could not load your tasks.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, [userId, listId, reload]);

  const disabled =
    busy || loading || workspaceBusy || Boolean(loadError);

  function updateTaskForm(field, value) {
    setTaskForm((current) => ({ ...current, [field]: value }));
  }

  function reloadTasks() {
    setLoading(true);
    setReload((current) => current + 1);
  }

  function createTask(event) {
    event.preventDefault();
    if (disabled || !taskForm.title.trim()) return;

    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description,
      time_limit_minutes: taskForm.time_limit_minutes || null,
      due_at: taskForm.due_at || null,
      reminder_at: taskForm.reminder_at || null
    };

    return run(async (isCurrent) => {
      if (editingTask) {
        for (const field of ["due_at", "reminder_at"]) {
          if (taskForm[field] === localDateTime(editingTask[field])) payload[field] = editingTask[field];
        }
        await api.updateTask(userId, listId, editingTask.task_id, payload);
      } else await api.createTask(userId, listId, payload);
      if (!isCurrent()) return;

      setEditingTask(null);
      setTaskForm(emptyTaskForm());
      reloadTasks();
    });
  }

  function editTask(task) {
    if (disabled) return;
    setEditingTask(task);
    setTaskForm({ title: task.title, description: task.description || "",
      time_limit_minutes: task.time_limit_minutes == null ? "" : String(task.time_limit_minutes),
      due_at: localDateTime(task.due_at), reminder_at: localDateTime(task.reminder_at) });
  }

  function toggle(task) {
    if (disabled || Number(task.list_id) !== Number(listId)) return;

    return run(async (isCurrent) => {
      await api.setTaskCompletion(
        userId,
        listId,
        task.task_id,
        !task.is_completed
      );

      if (isCurrent()) reloadTasks();
    });
  }

  function removeTask(task) {
    if (disabled || Number(task.list_id) !== Number(listId)) return;

    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    return run(async (isCurrent) => {
      await api.deleteTask(userId, listId, task.task_id);
      if (isCurrent()) reloadTasks();
    });
  }

  return (
    <GlassCard className="task-main-card" glow>
      <div className="card-heading">
        <div>
          <span className="eyebrow-small">Tasks</span>
          <h3>{listName}</h3>
        </div>

        <span className="metric-chip">
          {loading
            ? "Loading…"
            : `${tasks.filter((task) => task.is_completed).length}/${tasks.length}`}
        </span>
      </div>

      {(error || loadError) && (
        <div className="inline-error page-error" role="alert">
          {error || loadError}
        </div>
      )}

      <form className="task-create-form" onSubmit={createTask}>
        <input
          required
          maxLength={200}
          aria-label="Task title"
          value={taskForm.title}
          disabled={disabled}
          onChange={(event) =>
            updateTaskForm("title", event.target.value)
          }
          placeholder="Task title"
        />

        <input
          aria-label="Task description"
          value={taskForm.description}
          disabled={disabled}
          onChange={(event) =>
            updateTaskForm("description", event.target.value)
          }
          placeholder="Description"
        />

        <label className="field"><span>Time limit (minutes, optional)</span><input type="number" min="1" max="2147483647" step="1" value={taskForm.time_limit_minutes} disabled={disabled} onChange={(event) => updateTaskForm("time_limit_minutes", event.target.value)} /></label>
        <div className="task-create-form__row">
          <label>
            <span>Due</span>
            <input
              type="datetime-local"
              value={taskForm.due_at}
              disabled={disabled}
              onChange={(event) =>
                updateTaskForm("due_at", event.target.value)
              }
            />
          </label>

          <label>
            <span>Reminder</span>
            <input
              type="datetime-local"
              value={taskForm.reminder_at}
              disabled={disabled}
              onChange={(event) =>
                updateTaskForm("reminder_at", event.target.value)
              }
            />
          </label>
        </div>

        <NeonButton
          type="submit"
          disabled={disabled || !taskForm.title.trim()}
        >
          {busy ? "Working..." : editingTask ? "Save task" : "Add task"}
        </NeonButton>
        {editingTask && <button type="button" className="text-button" disabled={disabled} onClick={() => { setEditingTask(null); setTaskForm(emptyTaskForm()); }}>Cancel editing</button>}
      </form>

      {loadError && (
        <NeonButton
          variant="secondary"
          disabled={busy || loading || workspaceBusy}
          onClick={reloadTasks}
        >
          Retry loading tasks
        </NeonButton>
      )}

      <div className="task-list task-list--large">
        {loading ? (
          <div className="empty-state" role="status">
            Loading tasks…
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.task_id}
              className={`task-row ${task.is_completed ? "is-done" : ""}`}
            >
              <button
                type="button"
                className="task-check"
                disabled={disabled}
                aria-label={
                  task.is_completed
                    ? `Mark ${task.title} incomplete`
                    : `Complete ${task.title}`
                }
                onClick={() => toggle(task)}
              >
                {task.is_completed ? (
                  <Check size={16} />
                ) : (
                  <Circle size={16} />
                )}
              </button>

              <div className="task-row__body">
                <strong>{task.title}</strong>
                {task.description && <p className="task-description">{task.description}</p>}
                {task.time_limit_minutes != null && <span>{task.time_limit_minutes} minutes</span>}
                <span>
                  {task.due_at
                    ? `Due ${new Date(task.due_at).toLocaleString()}`
                    : "No due date"}
                </span>
              </div>

              <button type="button" className="icon-button" disabled={disabled} aria-label={`Edit ${task.title}`} onClick={() => editTask(task)}><Pencil size={15} /></button>
              <button
                type="button"
                className="icon-button"
                disabled={disabled}
                aria-label={`Delete ${task.title}`}
                onClick={() => removeTask(task)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}

        {!loading && !loadError && tasks.length === 0 && (
          <div className="empty-state">No tasks in this list.</div>
        )}
      </div>
    </GlassCard>
  );
}