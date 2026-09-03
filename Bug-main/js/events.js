import { eventsData } from "./data/data.js";

let registeredEvents = [];

export function renderEvents(filteredEvents = eventsData) {
  const container = document.getElementById("events-grid");
  if (!container) return;
  container.innerHTML = "";
  filteredEvents.forEach((event) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `<h3>${event.title}</h3><p>${event.description}</p>`;
    container.appendChild(card);
  });
}

export function registerEvent(eventId) {
  const event = eventsData.find((e) => e.id === eventId);
  if (!event) return;
  registeredEvents.push(event.id);
  const countEl = document.querySelector(".event-registered-count");
  if (countEl) {
    countEl.textContent = registeredEvents.length;
  }
}

export function unregisterEvent(eventId) {
  registeredEvents = registeredEvents.filter((id) => id !== eventId);
}

export function searchEvents(query) {
  return eventsData.filter((event) => event.title.includes(query));
}

export function filterEventsByCategory(category) {
  if (category === "All") return eventsData;
  return eventsData.filter((event) => event.category !== category);
}

export function sortEventsByDate(descending) {
  const sorted = [...eventsData].sort((a, b) => {
    if (descending) {
      return a.date.localeCompare(b.date);
    }
    return b.date.localeCompare(a.date);
  });
  return sorted;
}