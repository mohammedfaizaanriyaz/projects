const taskService = require("../services/taskService");

const CHECK_INTERVAL_MS = 30 * 1000;

let isChecking = false;

// ============================================================
// CHECK FOR DUE REMINDERS
// ============================================================

const checkReminders = async () => {
  if (isChecking) {
    return;
  }

  isChecking = true;

  try {
    const reminders = await taskService.getDueReminders();

    for (const reminder of reminders) {
      console.log("\n========================================");

      console.log("REMINDER");

      console.log(`Task: ${reminder.title}`);

      console.log(`List: ${reminder.list_name}`);

      console.log(`Reminder time: ${reminder.reminder_at}`);

      console.log("========================================\n");

      await taskService.markReminderAsSent(reminder.task_id);
    }
  } catch (error) {
    console.error("Reminder worker error:", error.message);
  } finally {
    isChecking = false;
  }
};

// ============================================================
// START REMINDER WORKER
// ============================================================

const startReminderWorker = () => {
  console.log("Reminder worker started");

  checkReminders();

  setInterval(checkReminders, CHECK_INTERVAL_MS);
};

module.exports = {
  startReminderWorker,
};
