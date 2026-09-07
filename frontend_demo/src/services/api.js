const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

async function request(
  path,
  options = {}
) {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    }
  );

  let data = {};

  try {
    data =
      await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error =
      new Error(
        data.error ||
        `Request failed (${response.status})`
      );

    error.status =
      response.status;

    throw error;
  }

  return data;
}

export const api = {
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

  createTask(
    userId,
    listId,
    payload
  ) {
    return request(
      `/api/users/${userId}/task-lists/${listId}/tasks`,
      {
        method: "POST",
        body:
          JSON.stringify(
            payload
          )
      }
    );
  },

  updateTask(
    userId,
    listId,
    taskId,
    payload
  ) {
    return request(
      `/api/users/${userId}/task-lists/${listId}/tasks/${taskId}`,
      {
        method: "PUT",
        body:
          JSON.stringify(
            payload
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
