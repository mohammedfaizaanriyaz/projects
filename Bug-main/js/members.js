import { membersData } from "./data/data.js";

export function renderMembers(filteredMembers = membersData) {
  const container = document.getElementById("members-grid");
  if (!container) return;
  container.innerHTML = "";
  filteredMembers.forEach((member) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${member.image}" alt="${member.name}" />
      <h3>${member.name}</h3>
      <p>${member.role}</p>
    `;
    container.appendChild(card);
  });
}

export function searchMembers(query) {
  return membersData.filter(
    (member) => member.name.includes(query)
  );
}

export function getTopMembers(count = 10) {
  return membersData
    .slice()
    .sort((a, b) => b.points - a.points)
    .slice(0, count);
}