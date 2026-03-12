const STORAGE_KEY = "weekly-duty-schedule-state";
const WEEKDAYS = [
  { label: "Lundi", offset: 0 },
  { label: "Mardi", offset: 1 },
  { label: "Mercredi", offset: 2 },
  { label: "Jeudi", offset: 3 },
  { label: "Vendredi", offset: 4 },
];
const SHIFTS = [
  { label: "Matin", timeRange: "8H00 - 13H00" },
  { label: "Apres-midi", timeRange: "14H00 - 17H00" },
];

const elements = {
  weekStart: document.querySelector("#weekStart"),
  startIndex: document.querySelector("#startIndex"),
  peopleInput: document.querySelector("#peopleInput"),
  generateButton: document.querySelector("#generateButton"),
  resetButton: document.querySelector("#resetButton"),
  exportButton: document.querySelector("#exportButton"),
  printButton: document.querySelector("#printButton"),
  scheduleBody: document.querySelector("#scheduleBody"),
  rowTemplate: document.querySelector("#rowTemplate"),
  statusText: document.querySelector("#statusText"),
  weekNumber: document.querySelector("#weekNumber"),
  weekDates: document.querySelector("#weekDates"),
  weekBadgeText: document.querySelector("#weekBadgeText"),
  summaryPanel: document.querySelector("#summaryPanel"),
  summaryContent: document.querySelector("#summaryContent"),
};

let state = {
  weekStart: getDefaultMonday(),
  startIndex: 0,
  people: ["Alice", "Benoit", "Chloe", "David", "Emma"],
  schedule: [],
};

function getDefaultMonday() {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay;
  today.setDate(today.getDate() + diff);
  return toInputDate(today);
}

function toInputDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parsePeople(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${dateString}T12:00:00`));
}

function formatShortDate(dateString) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateString}T12:00:00`));
}

function getISOWeekNumber(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  const temp = new Date(date.getTime());
  temp.setUTCDate(temp.getUTCDate() + 4 - (temp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  return Math.ceil(((temp - yearStart) / 86400000 + 1) / 7);
}

function buildSchedule(weekStart, people, startIndex) {
  const monday = new Date(`${weekStart}T12:00:00`);
  return WEEKDAYS.flatMap((day, dayIndex) => {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + day.offset);
    return SHIFTS.map((shift, shiftIndex) => {
      const rotationIndex = dayIndex * SHIFTS.length + shiftIndex;
      const assignee = people[(startIndex + rotationIndex) % people.length];

      return {
        dayLabel: day.label,
        date: toInputDate(currentDate),
        shiftLabel: shift.label,
        timeRange: shift.timeRange,
        assignee,
      };
    });
  });
}

function isScheduleEntryValid(entry) {
  return (
    entry &&
    typeof entry.dayLabel === "string" &&
    typeof entry.date === "string" &&
    typeof entry.shiftLabel === "string" &&
    typeof entry.timeRange === "string" &&
    typeof entry.assignee === "string"
  );
}

function updateWeekCounter() {
  const weekNum = getISOWeekNumber(state.weekStart);
  const monday = new Date(`${state.weekStart}T12:00:00`);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  elements.weekNumber.textContent = weekNum;
  elements.weekDates.textContent =
    `Du ${formatShortDate(state.weekStart)} au ${formatShortDate(toInputDate(friday))}`;
  elements.weekBadgeText.textContent = `Semaine ${weekNum}`;
}

function renderSummary() {
  if (!state.schedule.length) {
    elements.summaryPanel.hidden = true;
    return;
  }

  const counts = {};
  state.schedule.forEach((entry) => {
    counts[entry.assignee] = (counts[entry.assignee] || 0) + 1;
  });

  elements.summaryContent.innerHTML = "";

  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      const card = document.createElement("div");
      card.className = "summary-card";
      card.innerHTML =
        `<span class="summary-card-name">${name}</span>` +
        `<span class="summary-card-count">` +
        `<i class="material-icons">access_time</i> ${count} creneau${count > 1 ? "x" : ""}` +
        `</span>`;
      elements.summaryContent.appendChild(card);
    });

  elements.summaryPanel.hidden = false;
}

function renderSchedule() {
  elements.scheduleBody.innerHTML = "";

  if (!state.schedule.length) {
    updateStatus("Aucun planning genere pour le moment.");
    elements.exportButton.disabled = true;
    return;
  }

  const people = state.people;
  let previousDay = "";

  state.schedule.forEach((entry, rowIndex) => {
    const row = elements.rowTemplate.content.firstElementChild.cloneNode(true);

    // Visual separator between days
    if (entry.dayLabel !== previousDay && rowIndex > 0) {
      row.classList.add("day-start");
    }
    previousDay = entry.dayLabel;

    row.querySelector('[data-cell="day"]').textContent = entry.dayLabel;
    row.querySelector('[data-cell="date"]').textContent = formatDate(entry.date);
    row.querySelector('[data-cell="shift"]').textContent = entry.shiftLabel;
    row.querySelector('[data-cell="timeRange"]').textContent = entry.timeRange;

    const select = row.querySelector('[data-cell="assignee"]');
    people.forEach((person) => {
      const option = document.createElement("option");
      option.value = person;
      option.textContent = person;
      option.selected = person === entry.assignee;
      select.appendChild(option);
    });

    select.addEventListener("change", (event) => {
      state.schedule[rowIndex].assignee = event.target.value;
      persistState();
      renderSummary();
      updateStatus("Planning mis a jour manuellement.");
    });

    elements.scheduleBody.appendChild(row);
  });

  elements.exportButton.disabled = false;
  updateWeekCounter();
  renderSummary();
  updateStatus(`Planning genere pour la semaine du ${formatDate(state.weekStart)}.`);
}

function updateStatus(message) {
  elements.statusText.textContent = message;
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const savedState = localStorage.getItem(STORAGE_KEY);

  if (!savedState) {
    syncInputs();
    state.schedule = buildSchedule(state.weekStart, state.people, state.startIndex);
    renderSchedule();
    persistState();
    return;
  }

  const parsedState = JSON.parse(savedState);
  const people = Array.isArray(parsedState.people) ? parsedState.people : state.people;
  const schedule = Array.isArray(parsedState.schedule)
    ? parsedState.schedule.filter(isScheduleEntryValid)
    : [];
  const weekStart = parsedState.weekStart || state.weekStart;
  const startIndex = Number.isInteger(parsedState.startIndex) ? parsedState.startIndex : 0;
  const nextPeople = people.length ? people : state.people;

  state = {
    weekStart,
    startIndex,
    people: nextPeople,
    schedule: schedule.length ? schedule : buildSchedule(weekStart, nextPeople, startIndex),
  };

  syncInputs();
  renderSchedule();
}

function syncInputs() {
  elements.weekStart.value = state.weekStart;
  elements.startIndex.value = `${state.startIndex}`;
  elements.peopleInput.value = state.people.join("\n");
  updateWeekCounter();
}

function generateSchedule() {
  const people = parsePeople(elements.peopleInput.value);

  if (!people.length) {
    updateStatus("Ajoutez au moins une personne pour generer le planning.");
    elements.scheduleBody.innerHTML = "";
    elements.exportButton.disabled = true;
    elements.summaryPanel.hidden = true;
    return;
  }

  const rawStartIndex = Number.parseInt(elements.startIndex.value, 10);
  const safeStartIndex = Number.isNaN(rawStartIndex)
    ? 0
    : ((rawStartIndex % people.length) + people.length) % people.length;

  state = {
    weekStart: elements.weekStart.value || getDefaultMonday(),
    startIndex: safeStartIndex,
    people,
    schedule: buildSchedule(elements.weekStart.value || getDefaultMonday(), people, safeStartIndex),
  };

  syncInputs();
  renderSchedule();
  persistState();
}

function resetState() {
  state = {
    weekStart: getDefaultMonday(),
    startIndex: 0,
    people: ["Alice", "Benoit", "Chloe", "David", "Emma"],
    schedule: [],
  };

  syncInputs();
  state.schedule = buildSchedule(state.weekStart, state.people, state.startIndex);
  renderSchedule();
  persistState();
}

function exportCsv() {
  if (!state.schedule.length) {
    return;
  }

  const weekNum = getISOWeekNumber(state.weekStart);
  const rows = [
    [`Planning de permanence - Semaine ${weekNum}`],
    [],
    ["Jour", "Date", "Creneau", "Horaire", "Permanence"],
    ...state.schedule.map((entry) => [
      entry.dayLabel,
      entry.date,
      entry.shiftLabel,
      entry.timeRange,
      entry.assignee,
    ]),
  ];

  const csvContent = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `planning-permanence-S${weekNum}-${state.weekStart}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  updateStatus("Export CSV termine.");
}

function printSchedule() {
  window.print();
}

elements.generateButton.addEventListener("click", generateSchedule);
elements.resetButton.addEventListener("click", resetState);
elements.exportButton.addEventListener("click", exportCsv);
elements.printButton.addEventListener("click", printSchedule);

elements.weekStart.addEventListener("change", generateSchedule);
elements.startIndex.addEventListener("change", generateSchedule);

elements.peopleInput.addEventListener("blur", () => {
  const people = parsePeople(elements.peopleInput.value);
  if (people.length) {
    state.people = people;
    persistState();
  }
});

loadState();
