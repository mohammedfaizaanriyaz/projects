const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
let sessionVersion = 0;
export function notifySessionChange() { sessionVersion += 1; }

async function request(path, options = {}) {
  const version = sessionVersion;
  const timeout = AbortSignal.timeout(40000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options, credentials: "include", signal,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        "X-Vyra-Request": "1", ...options.headers,
      },
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error(timeout.aborted
      ? "The request timed out. Check the latest data before retrying a save."
      : "Cannot reach the server. Check your connection and try again.", { cause: error });
  }
  let data;
  try { data = await response.json(); }
  catch { throw new Error("The server returned an unreadable response. Please try again."); }
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/api/auth/") && version === sessionVersion) {
      window.dispatchEvent(new Event("vyra:session-expired"));
    }
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  if (data === null || typeof data !== "object") throw new Error("The server returned an unexpected response.");
  return data;
}

function taskTimeToIso(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Invalid task date/time");
  }

  const text = value.trim();

  // Preserve an already-converted API timestamp.
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(text)
  ) {
    const date = new Date(text);

    if (
      !Number.isNaN(date.getTime()) &&
      date.toISOString() === text
    ) {
      return text;
    }

    throw new Error("Invalid task date/time");
  }

  // A datetime-local input uses the device's local timezone.
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
      text
    );

  if (!match) {
    throw new Error("Invalid task date/time");
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second = "00"
  ] = match;

  const date = new Date(text);

  const valid =
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day) &&
    date.getHours() === Number(hour) &&
    date.getMinutes() === Number(minute) &&
    date.getSeconds() === Number(second);

  if (!valid) {
    throw new Error(
      "Invalid local task time. Choose another time."
    );
  }

  return date.toISOString();
}

function prepareTaskPayload(payload) {
  return {
    ...payload,
    due_at: taskTimeToIso(payload.due_at),
    reminder_at: taskTimeToIso(payload.reminder_at)
  };
}

export const api = {
  getTaskSummary(userId) { return request(`/api/users/${userId}/task-summary`); },
  deleteWeight(profileId, weightId) {
    return request(`/api/profiles/${profileId}/weight-records/${weightId}`, { method: "DELETE" });
  },
  health() {
    return request(
      "/api/health"
    );
  },

  register({
    name,
    email,
    password
  }) {
    return request(
      "/api/auth/register",
      {
        method: "POST",
        body:
          JSON.stringify({
            name,
            email,
            password
          })
      }
    );
  },

  login({
    email,
    password
  }) {
    return request(
      "/api/auth/login",
      {
        method: "POST",
        body:
          JSON.stringify({
            email,
            password
          })
      }
    );
  },

  me() {
    return request(
      "/api/auth/me"
    );
  },

  logout() {
    return request(
      "/api/auth/logout",
      {
        method: "POST"
      }
    );
  },

  getProfiles(
    userId
  ) {
    return request(
      `/api/users/${userId}/profiles`
    );
  },

  getProfile(
    profileId
  ) {
    return request(
      `/api/profiles/${profileId}`
    );
  },

  createProfile(
    userId,
    payload
  ) {
    return request(
      `/api/users/${userId}/profiles`,
      {
        method: "POST",
        body:
          JSON.stringify(
            payload
          )
      }
    );
  },

  updateProfile(
    profileId,
    payload
  ) {
    return request(
      `/api/profiles/${profileId}`,
      {
        method: "PUT",
        body:
          JSON.stringify(
            payload
          )
      }
    );
  },

  deleteProfile(
    profileId
  ) {
    return request(
      `/api/profiles/${profileId}`,
      {
        method: "DELETE"
      }
    );
  },

  getWeightHistory(
    profileId
  ) {
    return request(
      `/api/profiles/${profileId}/weight-records`
    );
  },

  addWeight(
    profileId,
    payload
  ) {
    return request(
      `/api/profiles/${profileId}/weight-records`,
      {
        method: "POST",
        body:
          JSON.stringify(
            payload
          )
      }
    );
  },

  getTaskLists(
    userId
  ) {
    return request(
      `/api/users/${userId}/task-lists`
    );
  },

  createTaskList(
    userId,
    payload
  ) {
    return request(
      `/api/users/${userId}/task-lists`,
      {
        method: "POST",
        body:
          JSON.stringify(
            payload
          )
      }
    );
  },

  updateTaskList(
    userId,
    listId,
    payload
  ) {
    return request(
      `/api/users/${userId}/task-lists/${listId}`,
      {
        method: "PUT",
        body:
          JSON.stringify(
            payload
          )
      }
    );
  },

  deleteTaskList(
    userId,
    listId
  ) {
    return request(
      `/api/users/${userId}/task-lists/${listId}`,
      {
        method: "DELETE"
      }
    );
  },

  getTasks(
    userId,
    listId
  ) {
    return request(
      `/api/users/${userId}/task-lists/${listId}/tasks`
    );
  },

  createTask(userId, listId, payload) {
  return request(
    `/api/users/${userId}/task-lists/${listId}/tasks`,
    {
      method: "POST",
      body: JSON.stringify(
        prepareTaskPayload(payload)
      )
    }
  );
},
  updateTask(userId, listId, taskId, payload) {
    return request(
      `/api/users/${userId}/task-lists/${listId}/tasks/${taskId}`,
      {
        method: "PUT",
        body: JSON.stringify(
          prepareTaskPayload(payload)
        )
      }
    );
  },

  setTaskCompletion(
    userId,
    listId,
    taskId,
    isCompleted
  ) {
    return request(
      `/api/users/${userId}/task-lists/${listId}/tasks/${taskId}/complete`,
      {
        method: "PATCH",
        body:
          JSON.stringify({
            is_completed:
              isCompleted
          })
      }
    );
  },

  deleteTask(
    userId,
    listId,
    taskId
  ) {
    return request(
      `/api/users/${userId}/task-lists/${listId}/tasks/${taskId}`,
      {
        method: "DELETE"
      }
    );
  },

  getDueReminders(
    userId
  ) {
    return request(
      `/api/users/${userId}/reminders/due`
    );
  },

  acknowledgeReminder(
    userId,
    taskId
  ) {
    return request(
      `/api/users/${userId}/reminders/${taskId}/acknowledge`,
      {
        method: "POST"
      }
    );
  },

  searchNutrition(
    query
  ) {
    const params =
      new URLSearchParams({
        query
      });

    return request(
      `/api/nutrition/search?${params.toString()}`
    );
  },

  getFoodDetails(
    fdcId
  ) {
    return request(
      `/api/nutrition/foods/${fdcId}`
    );
  },

  calculateNutrition({
    fdcId,
    quantity,
    unit
  }) {
    return request(
      "/api/nutrition/calculate",
      {
        method: "POST",
        body:
          JSON.stringify({
            fdcId,
            quantity,
            unit
          })
      }
    );
  },

  analyzeFood({
    food,
    quantity,
    unit
  }) {
    return request(
      "/api/nutrition/analyze",
      {
        method: "POST",
        body:
          JSON.stringify({
            food,
            quantity,
            unit
          })
      }
    );
  },

  analyzeRecipe(
    ingredients
  ) {
    return request(
      "/api/nutrition/recipe",
      {
        method: "POST",
        body:
          JSON.stringify({
            ingredients
          })
      }
    );
  },

  getNutritionLogs(
    profileId,
    date
  ) {
    const params =
      new URLSearchParams();

    if (date) {
      params.set(
        "date",
        date
      );
    }

    const query =
      params.toString();

    return request(
      `/api/profiles/${profileId}/nutrition-logs${query ? `?${query}` : ""}`
    );
  },

  getNutritionTotals(
    profileId,
    date
  ) {
    const params =
      new URLSearchParams();

    if (date) {
      params.set(
        "date",
        date
      );
    }

    const query =
      params.toString();

    return request(
      `/api/profiles/${profileId}/nutrition-logs/totals${query ? `?${query}` : ""}`
    );
  },

  saveNutritionLog(
    profileId,
    payload
  ) {
    return request(
      `/api/profiles/${profileId}/nutrition-logs`,
      {
        method: "POST",
        body:
          JSON.stringify(
            payload
          )
      }
    );
  },

  deleteNutritionLog(
    profileId,
    logId
  ) {
    return request(
      `/api/profiles/${profileId}/nutrition-logs/${logId}`,
      {
        method: "DELETE"
      }
    );
  }
};

export {
  API_URL,
  request
};
