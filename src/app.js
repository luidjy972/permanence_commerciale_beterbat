const STORAGE_KEY = "weekly-duty-schedule-state";
const WEEKDAYS = [
  { label: "Lundi", offset: 0 },
  { label: "Mardi", offset: 1 },
  { label: "Mercredi", offset: 2 },
  { label: "Jeudi", offset: 3 },
  { label: "Vendredi", offset: 4 },
];

const elements = {
  weekStart: document.querySelector("#weekStart"),
  startIndex: document.querySelector("#startIndex"),
  peopleInput: document.querySelector("#peopleInput"),
  generateButton: document.querySelector("#generateButton"),
  resetButton: document.querySelector("#resetButton"),
  exportButton: document.querySelector("#exportButton"),
  scheduleBody: document.querySelector("#scheduleBody"),
  rowTemplate: document.querySelector("#rowTemplate"),
  statusText: document.querySelector("#statusText"),
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

function buildSchedule(weekStart, people, startIndex) {
  const monday = new Date(`${weekStart}T12:00:00`);
  return WEEKDAYS.map((day, index) => {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + day.offset);
    const assignee = people[(startIndex + index) % people.length];

    return {
      dayLabel: day.label,
      date: toInputDate(currentDate),
      assignee,
    };
  });
}

function renderSchedule() {
  elements.scheduleBody.innerHTML = "";

  if (!state.schedule.length) {
    updateStatus("Aucun planning genere pour le moment.");
    elements.exportButton.disabled = true;
    return;
  }

  const people = state.people;

  state.schedule.forEach((entry, rowIndex) => {
    const row = elements.rowTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector('[data-cell="day"]').textContent = entry.dayLabel;
    row.querySelector('[data-cell="date"]').textContent = formatDate(entry.date);

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
      updateStatus("Planning mis a jour manuellement.");
    });

    elements.scheduleBody.appendChild(row);
  });

  elements.exportButton.disabled = false;
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
  const schedule = Array.isArray(parsedState.schedule) ? parsedState.schedule : [];
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
}

function generateSchedule() {
  const people = parsePeople(elements.peopleInput.value);

  if (!people.length) {
    updateStatus("Ajoutez au moins une personne pour generer le planning.");
    elements.scheduleBody.innerHTML = "";
    elements.exportButton.disabled = true;
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

  const rows = [
    ["Jour", "Date", "Permanence"],
    ...state.schedule.map((entry) => [entry.dayLabel, entry.date, entry.assignee]),
  ];

  const csvContent = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `planning-permanence-${state.weekStart}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  updateStatus("Export CSV termine.");
}

elements.generateButton.addEventListener("click", generateSchedule);
elements.resetButton.addEventListener("click", resetState);
elements.exportButton.addEventListener("click", exportCsv);

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
