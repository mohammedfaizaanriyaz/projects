import { afterEach, expect, test, vi } from "vitest";
import { api, request, notifySessionChange } from "./api";

afterEach(() => vi.unstubAllGlobals());
test("API requests default to same origin and retain cookie and CSRF protection", async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetch);
  await request("/api/test", { method: "POST", body: "{}", headers: { "X-Extra": "yes" } });
  expect(fetch.mock.calls[0][0]).toBe("/api/test");
  expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: "include", headers: { "X-Vyra-Request": "1", "Content-Type": "application/json", "X-Extra": "yes" } });
  expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
});

test("unreadable successful responses are errors, not empty data", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError(); } }));
  await expect(api.me()).rejects.toThrow("unreadable response");
});

test("stale unauthorized responses cannot sign out a newly authenticated account", async () => {
  let finish;
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise((resolve) => { finish = resolve; })));
  const listener = vi.fn();
  window.addEventListener("vyra:session-expired", listener);
  const pending = api.getProfiles(1);
  notifySessionChange();
  finish({ ok: false, status: 401, json: async () => ({ error: "Expired" }) });
  await expect(pending).rejects.toMatchObject({ status: 401 });
  expect(listener).not.toHaveBeenCalled();
  window.removeEventListener("vyra:session-expired", listener);
});

test("task timestamps are converted from local form times before sending", async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  vi.stubGlobal("fetch", fetch);
  await api.createTask(1, 2, { title: "Walk", due_at: "2026-10-07T10:30", reminder_at: "" });
  const payload = JSON.parse(fetch.mock.calls[0][1].body);
  expect(payload.due_at).toBe(new Date(2026, 9, 7, 10, 30).toISOString());
  expect(payload.reminder_at).toBeNull();
});
