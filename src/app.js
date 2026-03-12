const STORAGE_KEY = "weekly-duty-schedule-state";
const DEFAULT_PLANNING_WEEKS = 12;
const DEFAULT_PEOPLE = ["Alice", "Benoit", "Chloe", "David", "Emma", "Farid"];
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
  planningWeeks: document.querySelector("#planningWeeks"),
  startIndex: document.querySelector("#startIndex"),
  peopleInput: document.querySelector("#peopleInput"),
  generateButton: document.querySelector("#generateButton"),
  resetButton: document.querySelector("#resetButton"),
  exportButton: document.querySelector("#exportButton"),
  printButton: document.querySelector("#printButton"),
  printAnnualButton: document.querySelector("#printAnnualButton"),
  scheduleBody: document.querySelector("#scheduleBody"),
  rowTemplate: document.querySelector("#rowTemplate"),
  statusText: document.querySelector("#statusText"),
  planningRangeValue: document.querySelector("#planningRangeValue"),
  planningDates: document.querySelector("#planningDates"),
  planningMeta: document.querySelector("#planningMeta"),
  weekBadgeText: document.querySelector("#weekBadgeText"),
  summaryPanel: document.querySelector("#summaryPanel"),
  summaryContent: document.querySelector("#summaryContent"),
  rotationPanel: document.querySelector("#rotationPanel"),
  rotationContent: document.querySelector("#rotationContent"),
  weekNav: document.querySelector("#weekNav"),
  prevWeekBtn: document.querySelector("#prevWeekBtn"),
  nextWeekBtn: document.querySelector("#nextWeekBtn"),
  weekNavLabel: document.querySelector("#weekNavLabel"),
  weekNavDates: document.querySelector("#weekNavDates"),
  viewAllBtn: document.querySelector("#viewAllBtn"),
  exportWeekCsvBtn: document.querySelector("#exportWeekCsvBtn"),
  printWeekBtn: document.querySelector("#printWeekBtn"),
};

let state = {
  weekStart: getDefaultMonday(),
  planningWeeks: DEFAULT_PLANNING_WEEKS,
  startIndex: 0,
  people: DEFAULT_PEOPLE,
  planning: [],
  viewWeekIndex: null,
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

function addDays(dateString, dayCount) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + dayCount);
  return toInputDate(date);
}

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
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

function normalizePlanningWeeks(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_PLANNING_WEEKS;
  }

  return Math.min(Math.max(parsed, 1), 26);
}

function getSafeStartIndex(value, peopleCount) {
  if (!peopleCount) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  const baseValue = Number.isNaN(parsed) ? 0 : parsed;
  return ((baseValue % peopleCount) + peopleCount) % peopleCount;
}

function getPlanningRangeText(firstWeek, lastWeek, totalWeeks) {
  const startLabel = `S${firstWeek.weekNumber}`;
  if (totalWeeks === 1) {
    return startLabel;
  }

  return `${startLabel} a S${lastWeek.weekNumber}`;
}

function buildWeekEntries(week, weekOffset) {
  if (!week.activePeople.length) {
    return [];
  }

  const monday = new Date(`${week.weekStart}T12:00:00`);
  return WEEKDAYS.flatMap((day, dayIndex) => {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + day.offset);

    return SHIFTS.map((shift, shiftIndex) => {
      const rotationIndex = dayIndex * SHIFTS.length + shiftIndex;
      const assignee =
        week.activePeople[(rotationIndex + weekOffset) % week.activePeople.length];

      return {
        weekIndex: week.weekIndex,
        weekNumber: week.weekNumber,
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        offPerson: week.offPerson,
        dayLabel: day.label,
        date: toInputDate(currentDate),
        shiftLabel: shift.label,
        timeRange: shift.timeRange,
        assignee,
      };
    });
  });
}

function buildPlanning(weekStart, people, startIndex, planningWeeks) {
  return Array.from({ length: planningWeeks }, (_, weekOffset) => {
    const currentWeekStart = addDays(weekStart, weekOffset * 7);
    const currentWeekEnd = addDays(currentWeekStart, 4);
    const weekNumber = getISOWeekNumber(currentWeekStart);
    const offPersonIndex = people.length > 5 ? (startIndex + weekOffset) % people.length : -1;
    const offPerson = offPersonIndex === -1 ? "" : people[offPersonIndex];
    const activePeople =
      offPersonIndex === -1
        ? people.slice()
        : people.filter((_, personIndex) => personIndex !== offPersonIndex);

    const week = {
      weekIndex: weekOffset,
      weekNumber,
      weekStart: currentWeekStart,
      weekEnd: currentWeekEnd,
      offPerson,
      activePeople,
      entries: [],
    };

    week.entries = buildWeekEntries(week, weekOffset);
    return week;
  });
}

function isPlanningEntryValid(entry) {
  return (
    entry &&
    Number.isInteger(entry.weekIndex) &&
    Number.isInteger(entry.weekNumber) &&
    typeof entry.weekStart === "string" &&
    typeof entry.weekEnd === "string" &&
    typeof entry.offPerson === "string" &&
    typeof entry.dayLabel === "string" &&
    typeof entry.date === "string" &&
    typeof entry.shiftLabel === "string" &&
    typeof entry.timeRange === "string" &&
    typeof entry.assignee === "string"
  );
}

function isPlanningWeekValid(week) {
  return (
    week &&
    Number.isInteger(week.weekIndex) &&
    Number.isInteger(week.weekNumber) &&
    typeof week.weekStart === "string" &&
    typeof week.weekEnd === "string" &&
    typeof week.offPerson === "string" &&
    Array.isArray(week.activePeople) &&
    week.activePeople.every((person) => typeof person === "string") &&
    Array.isArray(week.entries) &&
    week.entries.every(isPlanningEntryValid)
  );
}

function getAllEntries() {
  return state.planning.flatMap((week) => week.entries);
}

function updatePlanningCounter() {
  if (!state.planning.length) {
    elements.planningRangeValue.textContent = "—";
    elements.planningDates.textContent = "—";
    elements.planningMeta.textContent = "Renseignez la periode a planifier.";
    elements.weekBadgeText.textContent = "Semaines —";
    return;
  }

  const firstWeek = state.planning[0];
  const lastWeek = state.planning[state.planning.length - 1];
  const rangeText = getPlanningRangeText(firstWeek, lastWeek, state.planning.length);

  elements.planningRangeValue.textContent = rangeText;
  elements.planningDates.textContent =
    `Du ${formatShortDate(firstWeek.weekStart)} au ${formatShortDate(lastWeek.weekEnd)}`;
  elements.planningMeta.textContent =
    `${state.planning.length} ${pluralize(state.planning.length, "semaine", "semaines")} ` +
    `planifiee${state.planning.length === 1 ? "" : "s"}`;
  elements.weekBadgeText.textContent =
    state.planning.length === 1
      ? `Semaine ${firstWeek.weekNumber}`
      : `Semaines ${rangeText}`;
}

function renderSummary() {
  const entries = getAllEntries();

  if (!entries.length) {
    elements.summaryPanel.hidden = true;
    return;
  }

  const shiftCounts = Object.fromEntries(state.people.map((person) => [person, 0]));
  const offCounts = Object.fromEntries(state.people.map((person) => [person, 0]));

  entries.forEach((entry) => {
    shiftCounts[entry.assignee] = (shiftCounts[entry.assignee] || 0) + 1;
  });
  state.planning.forEach((week) => {
    if (week.offPerson) {
      offCounts[week.offPerson] = (offCounts[week.offPerson] || 0) + 1;
    }
  });

  elements.summaryContent.innerHTML = "";

  state.people
    .slice()
    .sort((leftPerson, rightPerson) => {
      const shiftDifference = shiftCounts[rightPerson] - shiftCounts[leftPerson];
      if (shiftDifference !== 0) {
        return shiftDifference;
      }

      const offDifference = offCounts[rightPerson] - offCounts[leftPerson];
      if (offDifference !== 0) {
        return offDifference;
      }

      return leftPerson.localeCompare(rightPerson, "fr");
    })
    .forEach((name) => {
      const shiftCount = shiftCounts[name];
      const offCount = offCounts[name];
      const card = document.createElement("div");
      card.className = "summary-card";
      card.innerHTML =
        `<span class="summary-card-name">${name}</span>` +
        `<span class="summary-card-count">` +
        `<i class="material-icons">access_time</i> ${shiftCount} ` +
        `${pluralize(shiftCount, "creneau", "creneaux")}` +
        `</span>` +
        `<span class="summary-card-off">` +
        `<i class="material-icons">${offCount ? "event_busy" : "event_available"}</i> ` +
        `${offCount} ${pluralize(offCount, "semaine de repos", "semaines de repos")}` +
        `</span>`;
      elements.summaryContent.appendChild(card);
    });

  elements.summaryPanel.hidden = false;
}

function renderRotation() {
  const weeksWithOffPerson = state.planning.filter((week) => week.offPerson);

  if (!weeksWithOffPerson.length) {
    elements.rotationPanel.hidden = true;
    return;
  }

  elements.rotationContent.innerHTML = "";

  weeksWithOffPerson.forEach((week) => {
    const card = document.createElement("div");
    card.className = "rotation-card";
    card.innerHTML =
      `<span class="rotation-card-week">Semaine ${week.weekNumber}</span>` +
      `<span class="rotation-card-name">${week.offPerson}</span>` +
      `<span class="rotation-card-dates">` +
      `Du ${formatShortDate(week.weekStart)} au ${formatShortDate(week.weekEnd)}` +
      `</span>`;
    elements.rotationContent.appendChild(card);
  });

  elements.rotationPanel.hidden = false;
}

function getVisibleWeeks() {
  if (state.viewWeekIndex === null) {
    return state.planning;
  }

  const week = state.planning[state.viewWeekIndex];
  return week ? [week] : [];
}

function updateWeekNav() {
  if (!state.planning.length) {
    elements.weekNav.hidden = true;
    return;
  }

  elements.weekNav.hidden = false;

  if (state.viewWeekIndex === null) {
    const firstWeek = state.planning[0];
    const lastWeek = state.planning[state.planning.length - 1];
    elements.weekNavLabel.textContent = `Toutes les semaines (${state.planning.length})`;
    elements.weekNavDates.textContent =
      `Du ${formatShortDate(firstWeek.weekStart)} au ${formatShortDate(lastWeek.weekEnd)}`;
    elements.prevWeekBtn.disabled = true;
    elements.nextWeekBtn.disabled = true;
    elements.viewAllBtn.disabled = true;
    elements.exportWeekCsvBtn.disabled = true;
    elements.printWeekBtn.disabled = true;
  } else {
    const week = state.planning[state.viewWeekIndex];
    const offText = week.offPerson ? ` — Repos : ${week.offPerson}` : "";
    elements.weekNavLabel.textContent =
      `Semaine ${week.weekNumber}${offText}`;
    elements.weekNavDates.textContent =
      `Du ${formatShortDate(week.weekStart)} au ${formatShortDate(week.weekEnd)}` +
      ` (${state.viewWeekIndex + 1}/${state.planning.length})`;
    elements.prevWeekBtn.disabled = state.viewWeekIndex === 0;
    elements.nextWeekBtn.disabled = state.viewWeekIndex === state.planning.length - 1;
    elements.viewAllBtn.disabled = false;
    elements.exportWeekCsvBtn.disabled = false;
    elements.printWeekBtn.disabled = false;
  }
}

function navigateWeek(direction) {
  if (!state.planning.length) {
    return;
  }

  if (state.viewWeekIndex === null) {
    state.viewWeekIndex = direction > 0 ? 0 : state.planning.length - 1;
  } else {
    const next = state.viewWeekIndex + direction;
    if (next >= 0 && next < state.planning.length) {
      state.viewWeekIndex = next;
    }
  }

  renderPlanning();
}

function viewAllWeeks() {
  state.viewWeekIndex = null;
  renderPlanning();
}

function viewSingleWeek(weekIndex) {
  if (weekIndex >= 0 && weekIndex < state.planning.length) {
    state.viewWeekIndex = weekIndex;
    renderPlanning();
  }
}

function exportWeekCsv() {
  if (state.viewWeekIndex === null || !state.planning.length) {
    return;
  }

  const week = state.planning[state.viewWeekIndex];
  const rows = [
    [`Planning de permanence - Semaine ${week.weekNumber}`],
    [`Du ${week.weekStart} au ${week.weekEnd}`],
    [week.offPerson ? `Commercial de repos : ${week.offPerson}` : ""],
    [],
    ["Jour", "Date", "Creneau", "Horaire", "Permanence"],
    ...week.entries.map((entry) => [
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
  link.download = `planning-permanence-S${week.weekNumber}-${week.weekStart}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  updateStatus(`Export CSV de la semaine ${week.weekNumber} termine.`);
}

function printSingleWeek() {
  if (state.viewWeekIndex === null) {
    return;
  }

  window.print();
}

function getMonthLabel(monthIndex) {
  const labels = [
    "JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN",
    "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE",
  ];
  return labels[monthIndex] || "";
}

function groupWeeksByMonth(weeks) {
  const months = new Map();
  const vowelMonths = new Set([3, 7, 9]); // avril, aout, octobre

  weeks.forEach((week) => {
    const date = new Date(`${week.weekStart}T12:00:00`);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!months.has(key)) {
      const monthName = getMonthLabel(date.getMonth());
      const prefix = vowelMonths.has(date.getMonth()) ? "MOIS D'" : "MOIS DE ";
      months.set(key, {
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        label: `${prefix}${monthName} ${date.getFullYear()}`,
        weeks: [],
      });
    }
    months.get(key).weeks.push(week);
  });

  return Array.from(months.values());
}

function getRepresentativeWeek(monthGroup) {
  return monthGroup.weeks[0];
}

function getMonthOffPeople(monthGroup) {
  const offSet = new Set();
  monthGroup.weeks.forEach((week) => {
    if (week.offPerson) {
      offSet.add(week.offPerson);
    }
  });
  return Array.from(offSet);
}

function buildAnnualPlanning() {
  if (!state.people.length) {
    return [];
  }

  const startDate = new Date(`${state.weekStart}T12:00:00`);
  const startYear = startDate.getFullYear();
  const jan1 = new Date(startYear, 0, 1);
  const jan1Day = jan1.getDay();
  const firstMonday = new Date(jan1);
  const diff = jan1Day === 0 ? 1 : jan1Day === 1 ? 0 : 8 - jan1Day;
  firstMonday.setDate(jan1.getDate() + diff);

  const annualStart = toInputDate(firstMonday);
  return buildPlanning(annualStart, state.people, state.startIndex, 52);
}

function buildMonthTableHtml(monthGroup) {
  const week = getRepresentativeWeek(monthGroup);
  const offPeople = getMonthOffPeople(monthGroup);
  const tournantText = offPeople.length
    ? `Tournants : ${offPeople.join(" & ")}`
    : "";

  const dayRows = WEEKDAYS.map((day) => {
    const morningEntry = week.entries.find(
      (e) => e.dayLabel === day.label && e.shiftLabel === "Matin",
    );
    const afternoonEntry = week.entries.find(
      (e) => e.dayLabel === day.label && e.shiftLabel === "Apres-midi",
    );

    return (
      `<tr>` +
      `<td class="day-cell">${day.label.toUpperCase()}</td>` +
      `<td class="person-cell">${morningEntry ? morningEntry.assignee : ""}</td>` +
      `<td class="person-cell">${afternoonEntry ? afternoonEntry.assignee : ""}</td>` +
      `</tr>`
    );
  }).join("");

  const samediRow =
    `<tr>` +
    `<td class="day-cell">SAMEDI</td>` +
    `<td class="rdv-cell" colspan="2">SUR RENDEZ-VOUS</td>` +
    `</tr>`;

  return (
    `<div class="month-block">` +
    `<div class="month-header">${monthGroup.label}</div>` +
    `<table class="month-table">` +
    `<thead>` +
    `<tr>` +
    `<th class="col-jour">JOURS</th>` +
    `<th class="col-shift">MATIN<br><span class="shift-hours">de 8H00 a 13H00</span></th>` +
    `<th class="col-shift">APRES-MIDI<br><span class="shift-hours">de 14H00 a 17H00</span></th>` +
    `</tr>` +
    `</thead>` +
    `<tbody>` +
    dayRows +
    samediRow +
    `</tbody>` +
    `</table>` +
    (tournantText
      ? `<div class="month-footer">${tournantText}</div>`
      : "") +
    `</div>`
  );
}

function printAnnualPlanning() {
  if (!state.people.length) {
    updateStatus("Ajoutez des personnes pour generer le planning annuel.");
    return;
  }

  const annualWeeks = buildAnnualPlanning();
  const months = groupWeeksByMonth(annualWeeks);
  const startYear = months.length ? months[0].year : new Date().getFullYear();

  const monthsHtml = months.map((m) => buildMonthTableHtml(m)).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Planning Annuel ${startYear} — Beterbat</title>
<style>
@page {
  size: landscape;
  margin: 8mm;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9pt;
  color: #000;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page-title {
  text-align: center;
  font-size: 14pt;
  font-weight: 700;
  padding: 6px 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 3px solid #ce2642;
  margin-bottom: 10px;
  color: #272727;
}
.page-title span {
  color: #ce2642;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, auto);
  gap: 8px;
  width: 100%;
}
.month-block {
  border: 1.5px solid #6b6b6a;
  border-radius: 4px;
  overflow: hidden;
  page-break-inside: avoid;
}
.month-header {
  background: #6b6b6a;
  color: #fff;
  font-weight: 700;
  font-size: 8.5pt;
  text-align: center;
  padding: 4px 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.month-table {
  width: 100%;
  border-collapse: collapse;
}
.month-table th,
.month-table td {
  border: 0.5px solid #ccc;
  padding: 2px 4px;
  text-align: center;
  font-size: 7.5pt;
  line-height: 1.3;
}
.month-table th {
  background: #ce2642;
  color: #fff;
  font-weight: 700;
  font-size: 7pt;
  text-transform: uppercase;
  padding: 3px 4px;
}
.shift-hours {
  font-weight: 400;
  font-size: 6.5pt;
  opacity: 0.9;
}
.col-jour {
  width: 28%;
}
.col-shift {
  width: 36%;
}
.day-cell {
  font-weight: 700;
  text-align: left;
  padding-left: 6px;
  background: #f5f5f4;
}
.person-cell {
  font-weight: 400;
  font-size: 7.5pt;
}
.rdv-cell {
  font-style: italic;
  font-size: 7pt;
  color: #6b6b6a;
}
.month-footer {
  text-align: center;
  font-size: 7pt;
  font-weight: 700;
  padding: 3px 4px;
  background: rgba(206,38,66,0.08);
  color: #ce2642;
  border-top: 1px solid #ddd;
}
.page-footer {
  text-align: center;
  font-size: 7pt;
  color: #6b6b6a;
  margin-top: 8px;
  padding-top: 4px;
  border-top: 1px solid #ddd;
}
</style>
</head>
<body>
<div class="page-title">
  Planning des permanences du service commercial <span>annee ${startYear}</span>
</div>
<div class="grid">
${monthsHtml}
</div>
<div class="page-footer">
  &copy; ${startYear} Maisons Beterbat — Planning genere automatiquement
</div>
<script>window.onload=function(){window.print();};</script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

function createWeekGroupRow(week) {
  const row = document.createElement("tr");
  row.className = "week-group";

  const offPersonText = week.offPerson
    ? `Commercial de repos : ${week.offPerson}`
    : "Aucun commercial de repos";

  const viewBtnHtml = state.viewWeekIndex === null
    ? `<button type="button" class="btn btn-secondary btn-sm btn-week-view no-print" data-week-index="${week.weekIndex}">` +
      `<i class="material-icons">visibility</i> Voir</button>`
    : "";

  row.innerHTML =
    `<td colspan="5">` +
    `<div class="week-group-content">` +
    `<span class="week-group-title">Semaine ${week.weekNumber}</span>` +
    `<span class="week-group-dates">` +
    `Du ${formatShortDate(week.weekStart)} au ${formatShortDate(week.weekEnd)}` +
    `</span>` +
    `<span class="week-group-off">${offPersonText}</span>` +
    viewBtnHtml +
    `</div>` +
    `</td>`;

  const viewBtn = row.querySelector(".btn-week-view");
  if (viewBtn) {
    viewBtn.addEventListener("click", () => {
      viewSingleWeek(week.weekIndex);
    });
  }

  return row;
}

function renderPlanning() {
  elements.scheduleBody.innerHTML = "";

  if (!state.planning.length) {
    updatePlanningCounter();
    updateWeekNav();
    updateStatus("Aucun planning genere pour le moment.");
    elements.exportButton.disabled = true;
    elements.summaryPanel.hidden = true;
    elements.rotationPanel.hidden = true;
    return;
  }

  const visibleWeeks = getVisibleWeeks();

  visibleWeeks.forEach((week) => {
    elements.scheduleBody.appendChild(createWeekGroupRow(week));

    let previousDay = "";

    week.entries.forEach((entry, entryIndex) => {
      const row = elements.rowTemplate.content.firstElementChild.cloneNode(true);

      if (entry.dayLabel !== previousDay && entryIndex > 0) {
        row.classList.add("day-start");
      }
      previousDay = entry.dayLabel;

      row.querySelector('[data-cell="day"]').textContent = entry.dayLabel;
      row.querySelector('[data-cell="date"]').textContent = formatDate(entry.date);
      row.querySelector('[data-cell="shift"]').textContent = entry.shiftLabel;
      row.querySelector('[data-cell="timeRange"]').textContent = entry.timeRange;

      const select = row.querySelector('[data-cell="assignee"]');
      const availablePeople = week.activePeople.length ? week.activePeople : state.people;
      const optionValues = new Set();

      availablePeople.forEach((person) => {
        const option = document.createElement("option");
        option.value = person;
        option.textContent = person;
        option.selected = person === entry.assignee;
        optionValues.add(person);
        select.appendChild(option);
      });

      if (!optionValues.has(entry.assignee)) {
        const fallbackOption = document.createElement("option");
        fallbackOption.value = entry.assignee;
        fallbackOption.textContent = entry.assignee;
        fallbackOption.selected = true;
        select.appendChild(fallbackOption);
      }

      select.addEventListener("change", (event) => {
        entry.assignee = event.target.value;
        persistState();
        renderSummary();
        updateStatus("Planning mis a jour manuellement.");
      });

      elements.scheduleBody.appendChild(row);
    });
  });

  elements.exportButton.disabled = false;
  updatePlanningCounter();
  updateWeekNav();
  renderSummary();
  renderRotation();

  if (state.viewWeekIndex !== null) {
    const week = state.planning[state.viewWeekIndex];
    updateStatus(
      `Semaine ${week.weekNumber} — ` +
        `du ${formatShortDate(week.weekStart)} au ${formatShortDate(week.weekEnd)}.`,
    );
  } else {
    const firstWeek = state.planning[0];
    const lastWeek = state.planning[state.planning.length - 1];
    updateStatus(
      `Planning genere sur ${state.planning.length} ` +
        `${pluralize(state.planning.length, "semaine", "semaines")}, ` +
        `du ${formatShortDate(firstWeek.weekStart)} au ${formatShortDate(lastWeek.weekEnd)}.`,
    );
  }
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
    state.planning = buildPlanning(
      state.weekStart,
      state.people,
      state.startIndex,
      state.planningWeeks,
    );
    renderPlanning();
    persistState();
    return;
  }

  const parsedState = JSON.parse(savedState);
  const people = Array.isArray(parsedState.people)
    ? parsedState.people.map((person) => `${person}`.trim()).filter(Boolean)
    : state.people;
  const nextPeople = Array.isArray(parsedState.people) ? people : state.people;
  const weekStart = parsedState.weekStart || state.weekStart;
  const planningWeeks = normalizePlanningWeeks(parsedState.planningWeeks);
  const startIndex = getSafeStartIndex(parsedState.startIndex, nextPeople.length);
  const planning = Array.isArray(parsedState.planning) && parsedState.planning.every(isPlanningWeekValid)
    ? parsedState.planning
    : nextPeople.length
      ? buildPlanning(weekStart, nextPeople, startIndex, planningWeeks)
      : [];

  state = {
    weekStart,
    planningWeeks,
    startIndex,
    people: nextPeople,
    planning,
    viewWeekIndex: null,
  };

  syncInputs();
  renderPlanning();
}

function syncInputs() {
  elements.weekStart.value = state.weekStart;
  elements.planningWeeks.value = `${state.planningWeeks}`;
  elements.startIndex.value = `${state.startIndex}`;
  elements.peopleInput.value = state.people.join("\n");
  updatePlanningCounter();
}

function generatePlanning() {
  const people = parsePeople(elements.peopleInput.value);
  const weekStart = elements.weekStart.value || getDefaultMonday();
  const planningWeeks = normalizePlanningWeeks(elements.planningWeeks.value);
  const startIndex = getSafeStartIndex(elements.startIndex.value, people.length);

  if (!people.length) {
    state = {
      weekStart,
      planningWeeks,
      startIndex: 0,
      people: [],
      planning: [],
      viewWeekIndex: null,
    };
    syncInputs();
    renderPlanning();
    persistState();
    updateStatus("Ajoutez au moins une personne pour generer le planning.");
    return;
  }

  state = {
    weekStart,
    planningWeeks,
    startIndex,
    people,
    planning: buildPlanning(weekStart, people, startIndex, planningWeeks),
    viewWeekIndex: null,
  };

  syncInputs();
  renderPlanning();
  persistState();
}

function resetState() {
  state = {
    weekStart: getDefaultMonday(),
    planningWeeks: DEFAULT_PLANNING_WEEKS,
    startIndex: 0,
    people: DEFAULT_PEOPLE,
    planning: [],
    viewWeekIndex: null,
  };

  syncInputs();
  state.planning = buildPlanning(state.weekStart, state.people, state.startIndex, state.planningWeeks);
  renderPlanning();
  persistState();
}

function exportCsv() {
  if (!state.planning.length) {
    return;
  }

  const firstWeek = state.planning[0];
  const lastWeek = state.planning[state.planning.length - 1];
  const rows = [
    [`Planning de permanence - ${getPlanningRangeText(firstWeek, lastWeek, state.planning.length)}`],
    [`Du ${firstWeek.weekStart} au ${lastWeek.weekEnd}`],
    [],
    [
      "Semaine",
      "Debut semaine",
      "Fin semaine",
      "Jour",
      "Date",
      "Creneau",
      "Horaire",
      "Permanence",
      "Commercial de repos",
    ],
    ...state.planning.flatMap((week) =>
      week.entries.map((entry) => [
        entry.weekNumber,
        entry.weekStart,
        entry.weekEnd,
        entry.dayLabel,
        entry.date,
        entry.shiftLabel,
        entry.timeRange,
        entry.assignee,
        week.offPerson,
      ]),
    ),
  ];

  const csvContent = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `planning-permanence-${firstWeek.weekStart}-${lastWeek.weekEnd}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  updateStatus("Export CSV termine.");
}

function printSchedule() {
  window.print();
}

elements.generateButton.addEventListener("click", generatePlanning);
elements.resetButton.addEventListener("click", resetState);
elements.exportButton.addEventListener("click", exportCsv);
elements.printButton.addEventListener("click", printSchedule);
elements.printAnnualButton.addEventListener("click", printAnnualPlanning);
elements.prevWeekBtn.addEventListener("click", () => navigateWeek(-1));
elements.nextWeekBtn.addEventListener("click", () => navigateWeek(1));
elements.viewAllBtn.addEventListener("click", viewAllWeeks);
elements.exportWeekCsvBtn.addEventListener("click", exportWeekCsv);
elements.printWeekBtn.addEventListener("click", printSingleWeek);

elements.weekStart.addEventListener("change", generatePlanning);
elements.planningWeeks.addEventListener("change", generatePlanning);
elements.startIndex.addEventListener("change", generatePlanning);
elements.peopleInput.addEventListener("blur", () => {
  const people = parsePeople(elements.peopleInput.value);
  const hasChanged =
    people.length !== state.people.length ||
    people.some((person, index) => person !== state.people[index]);

  if (hasChanged) {
    generatePlanning();
  }
});

loadState();
