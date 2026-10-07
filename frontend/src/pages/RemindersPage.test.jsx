import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import RemindersPage from "./RemindersPage";
import { api } from "../services/api";
vi.mock("../context/AppContext", () => ({ useApp: () => ({ user: { user_id: 1 } }) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test("a poll completing after acknowledgment cannot restore a handled reminder", async () => {
  let finishPoll, finishAck;
  const reminder = { task_id: 3, title: "Take a walk", list_name: "Routine", reminder_at: "2026-01-01T10:00:00.000Z" };
  vi.spyOn(api, "getDueReminders").mockResolvedValueOnce([reminder]).mockReturnValueOnce(new Promise((resolve) => { finishPoll = resolve; }));
  const acknowledge = vi.spyOn(api, "acknowledgeReminder").mockReturnValue(new Promise((resolve) => { finishAck = resolve; }));
  render(<RemindersPage />);
  await screen.findByText("Take a walk");
  fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
  fireEvent.click(screen.getByRole("button", { name: "Handled" }));
  await act(async () => finishAck({}));
  await waitFor(() => expect(screen.queryByText("Take a walk")).toBeNull());
  await act(async () => finishPoll([reminder]));
  expect(screen.queryByText("Take a walk")).toBeNull();
  expect(acknowledge).toHaveBeenCalledTimes(1);
});
