import {
  Check,
  Circle,
  Plus,
  Trash2
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

export default function TasksPage() {
  const {
    user
  } =
    useApp();

  const [
    lists,
    setLists
  ] =
    useState([]);

  const [
    selectedListId,
    setSelectedListId
  ] =
    useState(null);

  const [
    tasks,
    setTasks
  ] =
    useState([]);

  const [
    listName,
    setListName
  ] =
    useState("");

  const [
    taskForm,
    setTaskForm
  ] =
    useState({
      title: "",
      description: "",
      time_limit_minutes:
        "",
      due_at: "",
      reminder_at: ""
    });

  const [
    error,
    setError
  ] =
    useState("");

  useEffect(() => {
    loadLists();
  }, [user?.user_id]);

  useEffect(() => {
    if (
      selectedListId
    ) {
      loadTasks(
        selectedListId
      );
    } else {
      setTasks([]);
    }
  }, [selectedListId]);

  async function loadLists() {
    if (
      !user?.user_id
    ) {
      return;
    }

    try {
      setError("");

      const data =
        await api
          .getTaskLists(
            user.user_id
          );

      setLists(data);

      setSelectedListId(
        (current) =>
          current &&
          data.some(
            (list) =>
              Number(
                list.list_id
              ) ===
              Number(
                current
              )
          )
            ? current
            : data[0]
                ?.list_id ||
              null
      );
    } catch (error) {
      setError(
        error.message
      );
    }
  }

  async function loadTasks(
    listId
  ) {
    try {
      setError("");

      const data =
        await api.getTasks(
          user.user_id,
          listId
        );

      setTasks(data);
    } catch (error) {
      setError(
        error.message
      );
    }
  }

  async function createList(
    event
  ) {
    event.preventDefault();

    if (
      !listName.trim()
    ) {
      return;
    }

    try {
      setError("");

      const result =
        await api
          .createTaskList(
            user.user_id,
            {
              list_name:
                listName.trim(),
              list_type:
                "todo"
            }
          );

      setListName("");

      await loadLists();

      if (
        result.list
          ?.list_id
      ) {
        setSelectedListId(
          result.list
            .list_id
        );
      }
    } catch (error) {
      setError(
        error.message
      );
    }
  }

  async function createTask(
    event
  ) {
    event.preventDefault();

    if (
      !selectedListId
    ) {
      setError(
        "Create a task list first."
      );
      return;
    }

    try {
      setError("");

      await api.createTask(
        user.user_id,
        selectedListId,
        {
          title:
            taskForm.title,
          description:
            taskForm.description,
          time_limit_minutes:
            taskForm
              .time_limit_minutes ||
            null,
          due_at:
            taskForm.due_at ||
            null,
          reminder_at:
            taskForm
              .reminder_at ||
            null
        }
      );

      setTaskForm({
        title: "",
        description: "",
        time_limit_minutes:
          "",
        due_at: "",
        reminder_at: ""
      });

      await loadTasks(
        selectedListId
      );
    } catch (error) {
      setError(
        error.message
      );
    }
  }

  async function toggle(
    task
  ) {
    try {
      setError("");

      await api
        .setTaskCompletion(
          user.user_id,
          selectedListId,
          task.task_id,
          !Boolean(
            task.is_completed
          )
        );

      await loadTasks(
        selectedListId
      );
    } catch (error) {
      setError(
        error.message
      );
    }
  }

  async function removeTask(
    taskId
  ) {
    try {
      setError("");

      await api.deleteTask(
        user.user_id,
        selectedListId,
        taskId
      );

      await loadTasks(
        selectedListId
      );
    } catch (error) {
      setError(
        error.message
      );
    }
  }

  async function removeList() {
    if (
      !selectedListId
    ) {
      return;
    }

    if (
      !window.confirm(
        "Delete this list and its tasks?"
      )
    ) {
      return;
    }

    try {
      await api
        .deleteTaskList(
          user.user_id,
          selectedListId
        );

      setSelectedListId(
        null
      );

      await loadLists();
    } catch (error) {
      setError(
        error.message
      );
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Execution / tasks"
        title="Tasks & routines"
        subtitle="Real task lists, tasks, completion state, due dates and reminders from your backend."
      />

      {error && (
        <div className="inline-error page-error">
          {error}
        </div>
      )}

      <div className="task-layout">
        <GlassCard>
          <div className="card-heading">
            <div>
              <span className="eyebrow-small">
                Lists
              </span>
              <h3>
                Your folders
              </h3>
            </div>
          </div>

          <form
            className="inline-form"
            onSubmit={
              createList
            }
          >
            <input
              value={
                listName
              }
              onChange={(
                event
              ) =>
                setListName(
                  event.target
                    .value
                )
              }
              placeholder="New list"
            />

            <NeonButton
              type="submit"
            >
              <Plus
                size={15}
              />
            </NeonButton>
          </form>

          <div className="list-stack">
            {lists.map(
              (list) => (
                <button
                  key={
                    list.list_id
                  }
                  className={`list-option ${
                    Number(
                      selectedListId
                    ) ===
                    Number(
                      list.list_id
                    )
                      ? "is-active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedListId(
                      list.list_id
                    )
                  }
                >
                  <span>
                    {
                      list.list_name
                    }
                  </span>
                  <small>
                    {
                      list.list_type
                    }
                  </small>
                </button>
              )
            )}
          </div>

          {selectedListId && (
            <button
              className="danger-button full-width"
              onClick={
                removeList
              }
            >
              <Trash2
                size={15}
              />
              Delete list
            </button>
          )}
        </GlassCard>

        <GlassCard
          className="task-main-card"
          glow
        >
          <div className="card-heading">
            <div>
              <span className="eyebrow-small">
                Tasks
              </span>
              <h3>
                Action stack
              </h3>
            </div>

            <span className="metric-chip">
              {
                tasks.filter(
                  (task) =>
                    task
                      .is_completed
                ).length
              }
              /{tasks.length}
            </span>
          </div>

          <form
            className="task-create-form"
            onSubmit={
              createTask
            }
          >
            <input
              required
              value={
                taskForm.title
              }
              onChange={(
                event
              ) =>
                setTaskForm(
                  (
                    current
                  ) => ({
                    ...current,
                    title:
                      event
                        .target
                        .value
                  })
                )
              }
              placeholder="Task title"
            />

            <input
              value={
                taskForm
                  .description
              }
              onChange={(
                event
              ) =>
                setTaskForm(
                  (
                    current
                  ) => ({
                    ...current,
                    description:
                      event
                        .target
                        .value
                  })
                )
              }
              placeholder="Description"
            />

            <div className="task-create-form__row">
              <label>
                <span>
                  Due
                </span>
                <input
                  type="datetime-local"
                  value={
                    taskForm
                      .due_at
                  }
                  onChange={(
                    event
                  ) =>
                    setTaskForm(
                      (
                        current
                      ) => ({
                        ...current,
                        due_at:
                          event
                            .target
                            .value
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Reminder
                </span>
                <input
                  type="datetime-local"
                  value={
                    taskForm
                      .reminder_at
                  }
                  onChange={(
                    event
                  ) =>
                    setTaskForm(
                      (
                        current
                      ) => ({
                        ...current,
                        reminder_at:
                          event
                            .target
                            .value
                      })
                    )
                  }
                />
              </label>
            </div>

            <NeonButton
              type="submit"
            >
              Add task
            </NeonButton>
          </form>

          <div className="task-list task-list--large">
            {tasks.map(
              (task) => (
                <div
                  className={`task-row ${
                    task
                      .is_completed
                      ? "is-done"
                      : ""
                  }`}
                  key={
                    task.task_id
                  }
                >
                  <button
                    className="task-check"
                    onClick={() =>
                      toggle(
                        task
                      )
                    }
                  >
                    {task
                      .is_completed ? (
                      <Check
                        size={
                          16
                        }
                      />
                    ) : (
                      <Circle
                        size={
                          16
                        }
                      />
                    )}
                  </button>

                  <div className="task-row__body">
                    <strong>
                      {
                        task.title
                      }
                    </strong>
                    <span>
                      {task
                        .due_at
                        ? `Due ${String(
                            task.due_at
                          ).replace(
                            "T",
                            " "
                          )}`
                        : "No due date"}
                    </span>
                  </div>

                  <button
                    className="icon-button"
                    onClick={() =>
                      removeTask(
                        task.task_id
                      )
                    }
                  >
                    <Trash2
                      size={
                        15
                      }
                    />
                  </button>
                </div>
              )
            )}

            {tasks.length ===
              0 && (
              <div className="empty-state">
                No tasks in this
                list.
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </>
  );
}
