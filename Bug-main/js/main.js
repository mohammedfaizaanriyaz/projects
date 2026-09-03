import { eventsData } from "./data/data.js";
import {
  registerEvent,
  unregisterEvent,
  searchEvents,
  filterEventsByCategory,
  sortEventsByDate,
} from "./events.js";
import { renderMembers, searchMembers, getTopMembers } from "./members.js";

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("open");
    });
  }

  const darkToggle = document.getElementById("dark-toggle");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (darkToggle) {
    darkToggle.checked = prefersDark;
    if (prefersDark) {
      document.body.classList.add("dark-mode");
    }
    darkToggle.addEventListener("change", (e) => {
      darkToggle.checked = e.target.checked;
    });
  }

  const searchInput = document.querySelector(".navbar-search input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const results = searchEvents(e.target.value);
      renderEvents(results);
    });
  }

  const registerButtons = document.querySelectorAll(".register-btn");
  registerButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const eventId = parseInt(btn.dataset.eventId);
      registerEvent(eventId);
      updateEventCount();
    });
  });

  const unregisterButtons = document.querySelectorAll(".unregister-btn");
  unregisterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const eventId = parseInt(btn.dataset.eventId);
      unregisterEvent(eventId);
    });
  });

  const sortSelect = document.getElementById("event-sort");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      const descending = e.target.value === "desc";
      const sorted = sortEventsByDate(descending);
      renderEvents(sorted);
    });
  }
});

function updateEventCount() {
  const countEl = document.querySelector(".event-registered-count");
  if (countEl) {
    countEl.textContent = registeredEvents.length;
  }
}