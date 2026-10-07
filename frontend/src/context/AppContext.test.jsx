import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { AppProvider, useApp } from "./AppContext";
import { api } from "../services/api";

const account = { user_id: 1, name: "Student" };
const profiles = [{ profile_id: 10, user_id: 1, profile_name: "First" }, { profile_id: 20, user_id: 1, profile_name: "Second" }];
function deferred() { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; }
function Probe() {
  const app = useApp();
  return <>
    <output data-testid="state">{JSON.stringify({ user: app.user, ready: app.profilesReady, loading: app.profilesLoading, profile: app.selectedProfile, weights: app.weightHistory, logs: app.nutritionLogs, error: app.globalError, status: app.dataStatus })}</output>
    <button onClick={() => app.refreshProfiles()}>Refresh profiles</button>
    <button onClick={() => app.setNutritionDate("2026-01-02")}>Change date</button>
    <button onClick={() => app.selectProfile(20)}>Select second</button>
    <button onClick={app.logout}>Logout</button>
  </>;
}
const state = () => JSON.parse(screen.getByTestId("state").textContent);
async function start() {
  render(<StrictMode><AppProvider><Probe /></AppProvider></StrictMode>);
  await waitFor(() => expect(state().status.nutrition).toBe("ready"));
  await waitFor(() => expect(state().profile?.profile_id).toBe(10));
}
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(api, "me").mockResolvedValue({ user: account });
  vi.spyOn(api, "getProfiles").mockResolvedValue(profiles);
  vi.spyOn(api, "getProfile").mockImplementation(async (id) => ({ ...profiles.find((p) => p.profile_id === id), height_cm: 170 }));
  vi.spyOn(api, "getWeightHistory").mockResolvedValue([]);
  vi.spyOn(api, "getNutritionLogs").mockResolvedValue([]);
  vi.spyOn(api, "getNutritionTotals").mockResolvedValue({ totals: { item_count: 0 }, meals: {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test("changing the nutrition date does not refetch or clear unrelated profile data", async () => {
  await start();
  const profileCalls = api.getProfile.mock.calls.length;
  const weightCalls = api.getWeightHistory.mock.calls.length;
  fireEvent.click(screen.getByText("Change date"));
  await waitFor(() => expect(api.getNutritionLogs).toHaveBeenLastCalledWith(10, "2026-01-02"));
  expect(state().profile.profile_id).toBe(10);
  expect(api.getProfile).toHaveBeenCalledTimes(profileCalls);
  expect(api.getWeightHistory).toHaveBeenCalledTimes(weightCalls);
});

test("background profile refresh keeps the loaded workspace available", async () => {
  await start();
  const refresh = deferred();
  api.getProfiles.mockReturnValueOnce(refresh.promise);
  fireEvent.click(screen.getByText("Refresh profiles"));
  expect(state()).toMatchObject({ ready: true, loading: true, profile: { profile_id: 10 } });
  await act(async () => refresh.resolve(profiles));
  expect(state().loading).toBe(false);
});

test("a failed logout remains visibly signed in and offers a retry", async () => {
  await start();
  vi.spyOn(api, "logout").mockRejectedValue(new Error("Network unavailable"));
  fireEvent.click(screen.getByText("Logout"));
  await waitFor(() => expect(state().error).toMatch(/Sign out failed/));
  expect(state().user.user_id).toBe(1);
});

test("an old nutrition response cannot overwrite a newly selected date", async () => {
  await start();
  const old = deferred();
  api.getNutritionLogs.mockReturnValueOnce(old.promise).mockResolvedValue([{ log_id: 200 }]);
  fireEvent.click(screen.getByText("Select second"));
  await waitFor(() => expect(api.getNutritionLogs).toHaveBeenLastCalledWith(20, expect.any(String)));
  fireEvent.click(screen.getByText("Change date"));
  await waitFor(() => expect(state().status.nutrition).toBe("ready"));
  await act(async () => old.resolve([{ log_id: 100 }]));
  expect(state().profile.profile_id).toBe(20);
  expect(state().logs).toEqual([{ log_id: 200 }]);
});
