import { supabaseClient } from './supabase.js';

const STORAGE_KEY = "weekly-duty-schedule-state";
const COMMERCIALS_STORAGE_KEY = "weekly-duty-commercials";
const DEFAULT_PLANNING_WEEKS = 12;
const DEFAULT_COMMERCIALS = [
  { name: "Marie-Line COPPET", agency: "Fort-de-France" },
  { name: "Stéphane LUREL", agency: "Le Lamentin" },
  { name: "Fabienne MARDAYE", agency: "Ducos" },
  { name: "Jean-Marc ROSALIE", agency: "Le Robert" },
  { name: "Nathalie SYMPHOR", agency: "Sainte-Anne" },
  { name: "Patrick DORLEAN", agency: "Trinité" },
];
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
const COMMERCIAL_COLORS = [
  "#FFD700",
  "#FFA500",
  "#FFB6C1",
  "#90EE90",
  "#ADD8E6",
  "#DDA0DD",
  "#F0E68C",
  "#87CEEB",
  "#FFC0CB",
  "#98FB98",
  "#F4A460",
  "#B0E0E6",
];

const elements = {
  weekStart: document.querySelector("#weekStart"),
  planningWeeks: document.querySelector("#planningWeeks"),
  startIndex: document.querySelector("#startIndex"),
  rotationMode: document.querySelector("#rotationMode"),
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
  printWeekTableBtn: document.querySelector("#printWeekTableBtn"),
  weekSelector: document.querySelector("#weekSelector"),
  commercialsBody: document.querySelector("#commercialsBody"),
  commercialName: document.querySelector("#commercialName"),
  commercialAgency: document.querySelector("#commercialAgency"),
  addCommercialBtn: document.querySelector("#addCommercialBtn"),
  toggleCommercialsBtn: document.querySelector("#toggleCommercialsBtn"),
  commercialsModule: document.querySelector("#commercialsModule"),
  toggleParametresBtn: document.querySelector("#toggleParametresBtn"),
  parametresModule: document.querySelector("#parametresModule"),
  toggleRecapitulatifBtn: document.querySelector("#toggleRecapitulatifBtn"),
  recapitulatifModule: document.querySelector("#recapitulatifModule"),
  printPeriodBtn: document.querySelector("#printPeriodBtn"),
};

let commercials = loadCommercials();

let state = {
  weekStart: getDefaultMonday(),
  planningWeeks: DEFAULT_PLANNING_WEEKS,
  startIndex: 0,
  rotationMode: "weekly",
  people: commercials.map((c) => c.name),
  planning: [],
  viewWeekIndex: null,
};

// ===== Database Functions =====

async function fetchCommercialsFromDB() {
  const { data, error } = await supabaseClient
    .from('commercials')
    .select('*')
    .order('position', { ascending: true });
  if (error) throw error;
  return data;
}

async function insertCommercialToDB(name, agency, position) {
  const { data, error } = await supabaseClient
    .from('commercials')
    .insert({ name, agency, position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateCommercialInDB(id, name, agency) {
  const { error } = await supabaseClient
    .from('commercials')
    .update({ name, agency })
    .eq('id', id);
  if (error) throw error;
}

async function deleteCommercialFromDB(id) {
  const { error } = await supabaseClient
    .from('commercials')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

async function fetchPlanningStateFromDB() {
  const { data, error } = await supabaseClient
    .from('planning_state')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function upsertPlanningStateToDB(planningState) {
  const { error } = await supabaseClient
    .from('planning_state')
    .upsert({
      id: 1,
      week_start: planningState.weekStart,
      planning_weeks: planningState.planningWeeks,
      start_index: planningState.startIndex,
      rotation_mode: planningState.rotationMode,
      planning_data: planningState.planning,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

// ===== Local Storage Functions =====

function loadCommercials() {
  const saved = localStorage.getItem(COMMERCIALS_STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length && parsed.every((c) => c && typeof c.name === "string")) {
      return parsed;
    }
  }
  return DEFAULT_COMMERCIALS.slice();
}

function saveCommercials() {
  localStorage.setItem(COMMERCIALS_STORAGE_KEY, JSON.stringify(commercials));
}

function renderCommercials() {
  elements.commercialsBody.innerHTML = "";
  commercials.forEach((commercial, index) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = commercial.name;

    const agencyCell = document.createElement("td");
    agencyCell.textContent = commercial.agency;

    const actionsCell = document.createElement("td");
    actionsCell.className = "commercial-actions";
    actionsCell.innerHTML =
      `<button type="button" class="btn-icon btn-icon-edit" title="Modifier">` +
      `<i class="material-icons">edit</i>` +
      `</button>` +
      `<button type="button" class="btn-icon btn-icon-delete" title="Supprimer">` +
      `<i class="material-icons">delete</i>` +
      `</button>`;

    row.appendChild(nameCell);
    row.appendChild(agencyCell);
    row.appendChild(actionsCell);

    actionsCell.querySelector(".btn-icon-edit").addEventListener("click", () => {
      editCommercialRow(index);
    });
    actionsCell.querySelector(".btn-icon-delete").addEventListener("click", () => {
      removeCommercial(index);
    });

    elements.commercialsBody.appendChild(row);
  });

  syncStartIndexOptions();
}

function editCommercialRow(index) {
  const commercial = commercials[index];
  const row = elements.commercialsBody.children[index];
  if (!row) return;

  row.innerHTML =
    `<td><input type="text" class="edit-name" /></td>` +
    `<td><input type="text" class="edit-agency" /></td>` +
    `<td class="commercial-actions">` +
    `<button type="button" class="btn-icon btn-icon-save" title="Enregistrer">` +
    `<i class="material-icons">check</i>` +
    `</button>` +
    `<button type="button" class="btn-icon btn-icon-cancel" title="Annuler">` +
    `<i class="material-icons">close</i>` +
    `</button>` +
    `</td>`;

  row.querySelector(".edit-name").value = commercial.name;
  row.querySelector(".edit-agency").value = commercial.agency;

  row.querySelector(".btn-icon-save").addEventListener("click", () => {
    saveEditCommercial(index, row);
  });
  row.querySelector(".btn-icon-cancel").addEventListener("click", () => {
    renderCommercials();
  });

  row.querySelector(".edit-name").focus();
}

async function saveEditCommercial(index, row) {
  const name = row.querySelector(".edit-name").value.trim();
  const agency = row.querySelector(".edit-agency").value.trim();

  if (!name) {
    updateStatus("Le nom du commercial ne peut pas etre vide.");
    return;
  }

  commercials[index].name = name;
  commercials[index].agency = agency;

  if (commercials[index].id) {
    try {
      await updateCommercialInDB(commercials[index].id, name, agency);
    } catch (err) {
      console.error("Erreur lors de la mise a jour du commercial en base:", err);
    }
  }

  saveCommercials();
  renderCommercials();
  updateStatus(`Commercial mis a jour.`);
}

async function addCommercial() {
  const name = elements.commercialName.value.trim();
  const agency = elements.commercialAgency.value.trim();

  if (!name) {
    updateStatus("Veuillez saisir le nom du commercial.");
    return;
  }

  const position = commercials.length;
  const newCommercial = { name, agency: agency || "", position };

  try {
    const dbRecord = await insertCommercialToDB(name, agency || "", position);
    newCommercial.id = dbRecord.id;
  } catch (err) {
    console.error("Erreur lors de l'ajout du commercial en base:", err);
  }

  commercials.push(newCommercial);
  saveCommercials();
  elements.commercialName.value = "";
  elements.commercialAgency.value = "";
  renderCommercials();
  updateStatus(`Commercial ajoute.`);
}

async function removeCommercial(index) {
  if (commercials.length <= 1) {
    updateStatus("Impossible de supprimer le dernier commercial.");
    return;
  }

  const removed = commercials[index];

  if (removed.id) {
    try {
      await deleteCommercialFromDB(removed.id);
    } catch (err) {
      console.error("Erreur lors de la suppression du commercial en base:", err);
    }
  }

  commercials.splice(index, 1);
  saveCommercials();
  renderCommercials();
  updateStatus(`Commercial supprime.`);
}

function syncStartIndexOptions() {
  const currentValue = elements.startIndex.value;
  elements.startIndex.innerHTML = "";
  commercials.forEach((commercial, index) => {
    const option = document.createElement("option");
    option.value = `${index}`;
    option.textContent = commercial.name;
    if (`${index}` === currentValue) {
      option.selected = true;
    }
    elements.startIndex.appendChild(option);
  });
}

function toggleCommercialsModule() {
  const module = elements.commercialsModule;
  const isHidden = module.hidden;
  module.hidden = !isHidden;
  elements.toggleCommercialsBtn.querySelector(".material-icons").textContent =
    isHidden ? "expand_less" : "expand_more";
}

function toggleParametresModule() {
  toggleModule(elements.parametresModule, elements.toggleParametresBtn);
}

function toggleRecapitulatifModule() {
  toggleModule(elements.recapitulatifModule, elements.toggleRecapitulatifBtn);
}

function toggleModule(module, btn) {
  const isHidden = module.hidden;
  module.hidden = !isHidden;
  btn.querySelector(".material-icons").textContent = isHidden ? "expand_less" : "expand_more";
  btn.querySelector("span").textContent = isHidden ? "Masquer" : "Afficher";
}

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

function getCommercialColor(name) {
  const index = state.people.indexOf(name);
  if (index === -1) {
    return "#FFFFFF";
  }
  return COMMERCIAL_COLORS[index % COMMERCIAL_COLORS.length];
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

function buildPlanning(weekStart, people, startIndex, planningWeeks, rotationMode) {
  return Array.from({ length: planningWeeks }, (_, weekOffset) => {
    const currentWeekStart = addDays(weekStart, weekOffset * 7);
    const currentWeekEnd = addDays(currentWeekStart, 4);
    const weekNumber = getISOWeekNumber(currentWeekStart);

    let offPersonIndex = -1;
    if (people.length > 5) {
      if (rotationMode === "monthly") {
        const monthOffset = Math.floor(weekOffset / 4);
        offPersonIndex = (startIndex + monthOffset) % people.length;
      } else {
        offPersonIndex = (startIndex + weekOffset) % people.length;
      }
    }

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

  const rotationTitle = document.querySelector("#rotationTitle");
  if (rotationTitle) {
    rotationTitle.textContent = state.rotationMode === "monthly"
      ? "Rotation mensuelle"
      : "Rotation hebdomadaire";
  }

  elements.rotationContent.innerHTML = "";

  weeksWithOffPerson.forEach((week) => {
    const card = document.createElement("div");
    card.className = "rotation-card";
    card.innerHTML =
      `<span class="rotation-card-week">Semaine ${week.weekNumber}</span>` +
      `<div class="rotation-card-header">` +
      `<span class="rotation-card-name">${week.offPerson}</span>` +
      `<span class="rotation-card-note">Le commercial ${week.offPerson} est en rotation de repos et ne sera pas présent en permanence cette semaine.</span>` +
      `</div>` +
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
    elements.printWeekTableBtn.disabled = true;
    elements.weekSelector.value = "";
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
    elements.printWeekTableBtn.disabled = false;
    elements.weekSelector.value = `${week.weekNumber}`;
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

function printWeekTable() {
  if (state.viewWeekIndex === null || !state.planning.length) {
    return;
  }

  const week = state.planning[state.viewWeekIndex];
  const weekStartDate = new Date(`${week.weekStart}T12:00:00`);
  const monthIndex = weekStartDate.getMonth();
  const year = weekStartDate.getFullYear();
  const vowelMonths = new Set([3, 7, 9]);
  const monthLabels = [
    "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
    "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE",
  ];
  const monthName = monthLabels[monthIndex] || "";
  const prefix = vowelMonths.has(monthIndex) ? "MOIS D'" : "MOIS DE ";
  const titleText = `${prefix}${monthName} ${year}`;

  const dayRows = WEEKDAYS.map((day) => {
    const morningEntry = week.entries.find(
      (e) => e.dayLabel === day.label && e.shiftLabel === "Matin",
    );
    const afternoonEntry = week.entries.find(
      (e) => e.dayLabel === day.label && e.shiftLabel === "Apres-midi",
    );
    const morningName = morningEntry ? morningEntry.assignee : "";
    const afternoonName = afternoonEntry ? afternoonEntry.assignee : "";
    const morningColor = morningName ? getCommercialColor(morningName) : "#FFFFFF";
    const afternoonColor = afternoonName ? getCommercialColor(afternoonName) : "#FFFFFF";

    return (
      `<tr>` +
      `<td class="day-cell">${day.label.toUpperCase()}</td>` +
      `<td class="person-cell" style="background-color:${morningColor};">${morningName}</td>` +
      `<td class="person-cell" style="background-color:${afternoonColor};">${afternoonName}</td>` +
      `</tr>`
    );
  }).join("");

  const samediRow =
    `<tr>` +
    `<td class="day-cell">SAMEDI</td>` +
    `<td class="rdv-cell" colspan="2">SUR RENDEZ-VOUS</td>` +
    `</tr>`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Planning Semaine ${week.weekNumber} — Beterbat</title>
<style>
@page {
  size: landscape;
  margin: 15mm;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12pt;
  color: #000;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.table-container {
  width: 100%;
  max-width: 900px;
  margin: 40px auto;
}
.week-table {
  width: 100%;
  border-collapse: collapse;
  background: #c0c0c0;
  border: 2px solid #999;
}
.week-table th,
.week-table td {
  border: 1px solid #999;
  padding: 10px 14px;
  font-size: 12pt;
  line-height: 1.4;
}
.title-cell {
  text-align: center;
  font-weight: 700;
  font-size: 13pt;
  text-decoration: underline;
  background: #c0c0c0;
}
.header-jour {
  text-align: left;
  font-weight: 700;
  font-size: 12pt;
  background: #c0c0c0;
  vertical-align: middle;
}
.header-shift {
  text-align: center;
  font-weight: 700;
  font-size: 12pt;
  background: #c0c0c0;
}
.day-cell {
  font-weight: 400;
  text-align: left;
  padding-left: 14px;
  background: #c0c0c0;
  width: 18%;
}
.person-cell {
  font-weight: 400;
  font-size: 12pt;
  padding: 10px 14px;
  width: 41%;
}
.rdv-cell {
  text-align: center;
  font-weight: 700;
  font-size: 12pt;
  background: #c0c0c0;
}
</style>
</head>
<body>
<div class="table-container">
  <table class="week-table">
    <thead>
      <tr>
        <th class="header-jour" rowspan="2">JOURS</th>
        <th class="title-cell" colspan="2">${titleText}</th>
      </tr>
      <tr>
        <th class="header-shift">MATIN &nbsp; de 8h30 à 13h00</th>
        <th class="header-shift">SOIR de 13h00 à 17h00</th>
      </tr>
    </thead>
    <tbody>
      ${dayRows}
      ${samediRow}
    </tbody>
  </table>
</div>
<script>window.onload=function(){window.print();};<\/script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
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
  return buildPlanning(annualStart, state.people, state.startIndex, 52, state.rotationMode);
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
  updateWeekSelectorOptions();
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
  upsertPlanningStateToDB(state).catch((err) => {
    console.error("Erreur lors de la sauvegarde du planning en base:", err);
  });
}

export async function loadState() {
  // 1. Load commercials from Supabase (fallback to localStorage)
  try {
    const dbCommercials = await fetchCommercialsFromDB();
    if (dbCommercials && dbCommercials.length > 0) {
      commercials = dbCommercials;
      saveCommercials();
    }
  } catch (err) {
    console.error("Chargement des commerciaux depuis la base echoue, cache local utilise:", err);
  }

  renderCommercials();

  // 2. Load planning state from Supabase
  try {
    const dbState = await fetchPlanningStateFromDB();
    if (dbState) {
      const people = commercials.map((c) => c.name);
      const weekStart = dbState.week_start || getDefaultMonday();
      const planningWeeks = normalizePlanningWeeks(dbState.planning_weeks);
      const startIndex = getSafeStartIndex(dbState.start_index, people.length);
      const rotationMode = dbState.rotation_mode === "monthly" ? "monthly" : "weekly";
      const planning =
        Array.isArray(dbState.planning_data) && dbState.planning_data.every(isPlanningWeekValid)
          ? dbState.planning_data
          : people.length
            ? buildPlanning(weekStart, people, startIndex, planningWeeks, rotationMode)
            : [];

      state = {
        weekStart,
        planningWeeks,
        startIndex,
        rotationMode,
        people,
        planning,
        viewWeekIndex: null,
      };

      syncInputs();
      renderPlanning();
      return;
    }
  } catch (err) {
    console.error("Chargement du planning depuis la base echoue, cache local utilise:", err);
  }

  // 3. Fallback to localStorage
  const savedState = localStorage.getItem(STORAGE_KEY);

  if (!savedState) {
    state.people = commercials.map((c) => c.name);
    syncInputs();
    state.planning = buildPlanning(
      state.weekStart,
      state.people,
      state.startIndex,
      state.planningWeeks,
      state.rotationMode,
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
  const rotationMode = parsedState.rotationMode === "monthly" ? "monthly" : "weekly";
  const planning = Array.isArray(parsedState.planning) && parsedState.planning.every(isPlanningWeekValid)
    ? parsedState.planning
    : nextPeople.length
      ? buildPlanning(weekStart, nextPeople, startIndex, planningWeeks, rotationMode)
      : [];

  state = {
    weekStart,
    planningWeeks,
    startIndex,
    rotationMode,
    people: nextPeople,
    planning,
    viewWeekIndex: null,
  };

  syncInputs();
  renderPlanning();
  // Migrate localStorage data to Supabase
  persistState();
}

function syncInputs() {
  elements.weekStart.value = state.weekStart;
  elements.planningWeeks.value = `${state.planningWeeks}`;
  elements.startIndex.value = `${state.startIndex}`;
  elements.rotationMode.value = state.rotationMode;
  syncStartIndexOptions();
  updatePlanningCounter();
}

function generatePlanning() {
  const people = commercials.map((c) => c.name);
  const weekStart = elements.weekStart.value || getDefaultMonday();
  const planningWeeks = normalizePlanningWeeks(elements.planningWeeks.value);
  const startIndex = getSafeStartIndex(elements.startIndex.value, people.length);
  const rotationMode = elements.rotationMode.value === "monthly" ? "monthly" : "weekly";

  if (!people.length) {
    state = {
      weekStart,
      planningWeeks,
      startIndex: 0,
      rotationMode,
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
    rotationMode,
    people,
    planning: buildPlanning(weekStart, people, startIndex, planningWeeks, rotationMode),
    viewWeekIndex: null,
  };

  syncInputs();
  renderPlanning();
  persistState();
}

function resetState() {
  commercials = loadCommercials();
  const people = commercials.map((c) => c.name);

  state = {
    weekStart: getDefaultMonday(),
    planningWeeks: DEFAULT_PLANNING_WEEKS,
    startIndex: 0,
    rotationMode: "weekly",
    people,
    planning: [],
    viewWeekIndex: null,
  };

  syncInputs();
  renderCommercials();
  state.planning = buildPlanning(state.weekStart, state.people, state.startIndex, state.planningWeeks, state.rotationMode);
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

function printPeriodPlanning() {
  if (!state.planning.length) {
    return;
  }

  const visibleWeeks = getVisibleWeeks();
  const firstWeek = visibleWeeks[0];
  const lastWeek = visibleWeeks[visibleWeeks.length - 1];

  const offPersonLines = visibleWeeks
    .filter((w) => w.offPerson)
    .map((w) => `<p style="margin:2px 0;"><strong>Semaine ${w.weekNumber}</strong> — Commercial de repos : ${w.offPerson}</p>`)
    .join("");

  let tableRows = "";
  visibleWeeks.forEach((week) => {
    tableRows +=
      `<tr style="background:#f0f0f0;">` +
      `<td colspan="5" style="padding:10px 8px;font-weight:700;font-size:0.9em;border:1px solid #999;">` +
      `Semaine ${week.weekNumber} — Du ${formatShortDate(week.weekStart)} au ${formatShortDate(week.weekEnd)}` +
      (week.offPerson ? ` — Commercial de repos : ${week.offPerson}` : "") +
      `</td></tr>`;

    let previousDay = "";
    week.entries.forEach((entry, idx) => {
      const borderTop = (entry.dayLabel !== previousDay && idx > 0)
        ? "border-top:2px solid #666;"
        : "";
      previousDay = entry.dayLabel;
      tableRows +=
        `<tr style="${borderTop}">` +
        `<td style="padding:8px;border:1px solid #ccc;font-weight:600;">${entry.dayLabel}</td>` +
        `<td style="padding:8px;border:1px solid #ccc;">${formatDate(entry.date)}</td>` +
        `<td style="padding:8px;border:1px solid #ccc;font-weight:600;color:#ce2642;">${entry.shiftLabel}</td>` +
        `<td style="padding:8px;border:1px solid #ccc;color:#6b6b6a;">${entry.timeRange}</td>` +
        `<td style="padding:8px;border:1px solid #ccc;font-weight:600;">${entry.assignee}</td>` +
        `</tr>`;
    });
  });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Planning de la période</title>
<style>
  body { font-family: "Open Sans", Arial, sans-serif; margin: 20px; color: #212529; }
  h2 { margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { text-align: left; padding: 10px 8px; font-size: 0.85em; color: #fff; background-color: #6b6b6a; text-transform: uppercase; letter-spacing: 0.03em; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <h2>Planning de la période</h2>
  <p style="color:#6b6b6a;font-size:0.9em;">Du ${formatShortDate(firstWeek.weekStart)} au ${formatShortDate(lastWeek.weekEnd)}</p>
  ${offPersonLines ? `<div style="font-size:0.85em;color:#6b6b6a;margin-bottom:8px;">${offPersonLines}</div>` : ""}
  <table>
    <thead>
      <tr>
        <th>Jour</th>
        <th>Date</th>
        <th>Créneau</th>
        <th>Horaire</th>
        <th>Permanence</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
<script>window.onload=function(){window.print();};<\/script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

function jumpToWeek() {
  const weekNum = Number.parseInt(elements.weekSelector.value, 10);
  if (Number.isNaN(weekNum)) {
    viewAllWeeks();
    return;
  }
  const index = state.planning.findIndex((w) => w.weekNumber === weekNum);
  if (index !== -1) {
    viewSingleWeek(index);
  }
}

function updateWeekSelectorOptions() {
  const current = elements.weekSelector.value;
  elements.weekSelector.innerHTML = '<option value="">Toutes les semaines</option>';
  state.planning.forEach((week) => {
    const option = document.createElement("option");
    option.value = `${week.weekNumber}`;
    option.textContent = `Semaine ${week.weekNumber}`;
    if (`${week.weekNumber}` === current) {
      option.selected = true;
    }
    elements.weekSelector.appendChild(option);
  });
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
elements.printWeekTableBtn.addEventListener("click", printWeekTable);
elements.addCommercialBtn.addEventListener("click", addCommercial);
elements.toggleCommercialsBtn.addEventListener("click", toggleCommercialsModule);
elements.toggleParametresBtn.addEventListener("click", toggleParametresModule);
elements.toggleRecapitulatifBtn.addEventListener("click", toggleRecapitulatifModule);
elements.weekSelector.addEventListener("change", jumpToWeek);
elements.rotationMode.addEventListener("change", generatePlanning);
elements.printPeriodBtn.addEventListener("click", printPeriodPlanning);

elements.weekStart.addEventListener("change", generatePlanning);
elements.planningWeeks.addEventListener("change", generatePlanning);
elements.startIndex.addEventListener("change", generatePlanning);

renderCommercials();
// loadState() is called by auth.js after authentication
