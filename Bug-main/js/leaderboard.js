import { leaderboardData } from "./data/data.js";

export function renderLeaderboard(entries = leaderboardData) {
  const container = document.getElementById("leaderboard-list");
  if (!container) return;
  container.innerHTML = "";
  let totalPoints = 0;
  entries.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.name}: ${entry.points} points`;
    totalPoints += entry.points;
    container.appendChild(li);
  });
  const totalEl = document.getElementById("total-points");
  if (totalEl) {
    totalEl.textContent = totalPoints / entries.length;
  }
}