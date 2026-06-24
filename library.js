const API_BASE = String(window.SPOT_INSPECTION_API_URL || "").trim().replace(/\/$/, "");

const libraryStatus = document.querySelector("#libraryStatus");
const libraryUnitFilter = document.querySelector("#libraryUnitFilter");
const libraryFunctionalAreaFilter = document.querySelector("#libraryFunctionalAreaFilter");
const librarySearch = document.querySelector("#librarySearch");
const followUpStatusFilter = document.querySelector("#followUpStatusFilter");
const followUpSummary = document.querySelector("#followUpSummary");
const libraryCount = document.querySelector("#libraryCount");
const libraryList = document.querySelector("#libraryList");
const libraryFiscalYear = document.querySelector("#libraryFiscalYear");
const monthlyTallyScope = document.querySelector("#monthlyTallyScope");
const monthlyTallyBody = document.querySelector("#monthlyTallyBody");
const monthlyChartScope = document.querySelector("#monthlyChartScope");
const monthlyChartBars = document.querySelector("#monthlyChartBars");
const libraryReportPreview = document.querySelector("#libraryReportPreview");
const refreshLibrary = document.querySelector("#refreshLibrary");
const exportCsv = document.querySelector("#exportCsv");
const followUpEditor = document.querySelector("#followUpEditor");
const followUpEditorTitle = document.querySelector("#followUpEditorTitle");
const followUpForm = document.querySelector("#followUpForm");
const followUpReviewer = document.querySelector("#followUpReviewer");
const followUpReviewDate = document.querySelector("#followUpReviewDate");
const followUpCorrected = document.querySelector("#followUpCorrected");
const followUpLogEdit = document.querySelector("#followUpLogEdit");
const saveFollowUpEdit = document.querySelector("#saveFollowUpEdit");
const cancelFollowUpEdit = document.querySelector("#cancelFollowUpEdit");

let inspections = [];
let selectedInspectionId = "";
let editingInspectionId = "";
let requiresDeleteToken = false;
const exportSelection = new Set();
const tallyDisciplines = [
  "Aviation Safety/SAFSO/Range Safety Officer",
  "Occupational Safety/USR/Supervisor",
  "Weapons Safety/ADWSR",
  "Space Safety"
];
const tallyDisciplineAliases = {
  "Aviation Safety/SAFSO/Range Safety Officer": ["Aviation Safety/SAFSO/Range Safety Officer", "Aviation Safety"],
  "Occupational Safety/USR/Supervisor": ["Occupational Safety/USR/Supervisor", "Occupational Safety"],
  "Weapons Safety/ADWSR": ["Weapons Safety/ADWSR", "Weapons Safety"],
  "Space Safety": ["Space Safety"]
};
const fiscalYearMonths = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const ALL_FUNCTIONAL_AREAS_VALUE = "__all-functional-areas__";
const functionalAreas = [
  "Aerial Port",
  "Civil Engineering - Carpentry",
  "Civil Engineering - Electrician",
  "Civil Engineering - Explosive Ordnance Disposal",
  "Civil Engineering - Fire Department",
  "Civil Engineering - HVAC",
  "Civil Engineering - Other",
  "Civil Engineering - Plumbing",
  "Civil Engineering - Road & Grounds",
  "Civil Engineering - Sheet Metal",
  "Civil Engineering - Sign Shop",
  "Communications",
  "Comptroller",
  "Contracting",
  "Corrosion Control Facility",
  "Engineering Installation Squadron (EIS)",
  "Intelligence",
  "Logistics - Fuels",
  "Logistics - Supply",
  "Logistics - Vehicle Maintenance",
  "Logistics - Vehicle Operations",
  "Logistics Readiness",
  "Maintenance - AGE",
  "Maintenance - Aircraft",
  "Maintenance - Engines",
  "Maintenance - Fuel Cell",
  "Maintenance - Other",
  "Maintenance - PMEL",
  "Maintenance - Sheet Metal",
  "Maintenance - Space",
  "Maintenance - Weapons/Munitions",
  "Medical",
  "Operations - Aircrew",
  "Operations - Airfield Management",
  "Operations - Cyber",
  "Operations - Life Support",
  "Operations - Other",
  "Operations - Space",
  "Operations - Weapons/Munitions",
  "Other, Describe",
  "Personnel",
  "Research and Development",
  "Safety",
  "Security Forces",
  "Services",
  "Storage - Weapons/Munitions",
  "Test and Evaluation",
  "Training",
  "Weather",
  "Wing Staff Agencies"
];

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function readApiResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {
      error: `Unexpected response from ${response.url} (${response.status} ${response.statusText || "HTTP error"}).`
    };
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function display(value, fallback = "Not documented") {
  return escapeHtml(value || fallback);
}

function inspectionReferenceSource(record) {
  const assessmentItem = String(record?.assessmentItem || "");
  const inspectionFocus = String(record?.inspectionFocus || "");
  if (assessmentItem.startsWith("Program Element -") || inspectionFocus.startsWith("DAFI 91-202")) {
    return "DAFI 91-202";
  }
  if (/^\d+(?:\.\d+)+\s*-/.test(inspectionFocus)) {
    return "DAFMAN 91-203";
  }
  return assessmentItem ? "General inspection guidance" : "";
}

function formatSavedDate(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function currentDateValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(startDateValue, days) {
  const date = dateFromValue(startDateValue);
  if (!date) return "";
  date.setDate(date.getDate() + days);
  return formatDateValue(date);
}

function dateFromValue(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(value) {
  const dueDate = dateFromValue(value);
  if (!dueDate) return null;
  const today = dateFromValue(currentDateValue());
  return Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
}

function followUpStatus(entry) {
  const record = entry.record || {};
  if (record.hasFinding !== "Yes") {
    return {
      key: "not-required",
      label: "No Follow-up Required",
      tone: "neutral",
      sort: 5,
      detail: "No finding"
    };
  }

  if (record.corrected === "Yes") {
    return {
      key: "closed",
      label: "Closed",
      tone: "closed",
      sort: 4,
      detail: record.reviewDate ? `Reviewed ${record.reviewDate}` : "Corrected"
    };
  }

  const remaining = daysUntil(record.followUpDue);
  if (remaining === null) {
    return {
      key: "open",
      label: "Open",
      tone: "open",
      sort: 3,
      detail: "No due date"
    };
  }

  if (remaining < 0) {
    return {
      key: "overdue",
      label: "Overdue",
      tone: "overdue",
      sort: 0,
      detail: `${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? "" : "s"} overdue`
    };
  }

  if (remaining <= 7) {
    return {
      key: "due-soon",
      label: "Due Soon",
      tone: "due-soon",
      sort: 1,
      detail: remaining === 0 ? "Due today" : `Due in ${remaining} day${remaining === 1 ? "" : "s"}`
    };
  }

  return {
    key: "open",
    label: "Open",
    tone: "open",
    sort: 2,
    detail: `Due ${record.followUpDue}`
  };
}

function statusMatchesFilter(status, filterValue) {
  if (!filterValue) return true;
  if (filterValue === "open") {
    return ["open", "due-soon", "overdue"].includes(status.key);
  }
  return status.key === filterValue;
}

function fiscalYearForDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return month >= 10 ? year + 1 : year;
}

function currentFiscalYear() {
  return fiscalYearForDate(currentDateValue());
}

function renderFiscalYearFilter() {
  const current = Number(libraryFiscalYear.value);
  const years = new Set([currentFiscalYear()]);
  inspections.forEach((entry) => {
    const fiscalYear = fiscalYearForDate(entry.record?.inspectionDate);
    if (fiscalYear) years.add(fiscalYear);
  });
  const orderedYears = [...years].sort((a, b) => b - a);
  const selectedYear = orderedYears.includes(current) ? current : orderedYears[0];
  libraryFiscalYear.innerHTML = orderedYears
    .map((year) => `<option value="${year}">FY ${year}</option>`)
    .join("");
  libraryFiscalYear.value = String(selectedYear);
}

function renderMonthlyChart(columnTotals = [], context = {}) {
  const monthLabels = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  const selectedYear = context.selectedYear || Number(libraryFiscalYear.value);
  const selectedUnit = context.selectedUnit || libraryUnitFilter.value;
  const selectedAreas = context.selectedAreas || selectedFunctionalAreas();
  const grandTotal = columnTotals.reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...columnTotals, 1);

  if (!selectedUnit) {
    monthlyChartScope.textContent = `FY ${selectedYear} | Select a unit to graph monthly totals`;
    monthlyChartBars.innerHTML = `
      <div class="monthly-chart-empty">
        Select a unit above to build the monthly graph.
      </div>
    `;
    return;
  }

  monthlyChartScope.textContent = `FY ${selectedYear} | ${selectedUnit} | ${functionalAreaScopeText(selectedAreas)} | ${grandTotal} completed inspection${grandTotal === 1 ? "" : "s"}`;
  monthlyChartBars.innerHTML = columnTotals.map((count, index) => {
    const height = count ? Math.max(14, Math.round((count / maxCount) * 132)) : 6;
    return `
      <div class="monthly-chart-bar-group">
        <div class="monthly-chart-value">${count}</div>
        <div class="monthly-chart-track" aria-hidden="true">
          <div class="monthly-chart-bar" style="height: ${height}px"></div>
        </div>
        <div class="monthly-chart-month">${monthLabels[index]}</div>
      </div>
    `;
  }).join("");
}

function renderMonthlyTally() {
  renderFiscalYearFilter();
  const selectedYear = Number(libraryFiscalYear.value);
  const selectedUnit = libraryUnitFilter.value;
  const selectedAreas = selectedFunctionalAreas();
  if (!selectedUnit) {
    monthlyTallyBody.innerHTML = `
      <tr>
        <td colspan="14" class="monthly-tally-empty">Select a unit above to view that unit's monthly tracker.</td>
      </tr>
    `;
    monthlyTallyScope.textContent = `FY ${selectedYear} | Select a unit to view tracker totals`;
    renderMonthlyChart([], { selectedYear, selectedUnit, selectedAreas });
    return;
  }

  const tallyEntries = inspections.filter((entry) => {
    const record = entry.record || {};
    return record.unit === selectedUnit
      && fiscalYearForDate(record.inspectionDate) === selectedYear
      && functionalAreaMatches(entry, selectedAreas);
  });
  const disciplines = [...new Set([
    ...tallyDisciplines,
    ...tallyEntries
      .map((entry) => entry.record?.responsibleDiscipline)
      .filter((discipline) => discipline && !Object.values(tallyDisciplineAliases).some((aliases) => aliases.includes(discipline)))
  ])];

  const rows = disciplines.map((discipline) => {
    const aliases = tallyDisciplineAliases[discipline] || [discipline];
    const counts = fiscalYearMonths.map((month) => tallyEntries.filter((entry) => {
      const date = String(entry.record?.inspectionDate || "");
      return aliases.includes(entry.record?.responsibleDiscipline) && Number(date.slice(5, 7)) === month;
    }).length);
    return { discipline, counts, total: counts.reduce((sum, count) => sum + count, 0) };
  });
  const columnTotals = fiscalYearMonths.map((_, index) => rows.reduce((sum, row) => sum + row.counts[index], 0));
  const grandTotal = columnTotals.reduce((sum, count) => sum + count, 0);
  const countCell = (count) => count
    ? `<span class="tally-value">${count}</span>`
    : '<span class="tally-empty" aria-label="No inspections">&ndash;</span>';

  monthlyTallyBody.innerHTML = [
    ...rows.map((row) => `
      <tr>
        <th scope="row">${escapeHtml(row.discipline)}</th>
        ${row.counts.map(countCell).map((cell) => `<td>${cell}</td>`).join("")}
        <td class="tally-total">${row.total}</td>
      </tr>
    `),
    `
      <tr class="tally-summary">
        <th scope="row">Total</th>
        ${columnTotals.map((count) => `<td>${count}</td>`).join("")}
        <td>${grandTotal}</td>
      </tr>
    `
  ].join("");

  monthlyTallyScope.textContent = `FY ${selectedYear} | ${selectedUnit} | ${functionalAreaScopeText(selectedAreas)} | ${grandTotal} completed inspection${grandTotal === 1 ? "" : "s"}`;
  renderMonthlyChart(columnTotals, { selectedYear, selectedUnit, selectedAreas });
}

function uniqueUnits() {
  return [...new Set(inspections.map((entry) => entry.record?.unit).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function uniqueFunctionalAreas() {
  const knownAreas = new Set(functionalAreas);
  const savedAreas = [...new Set(inspections.map((entry) => entry.record?.functionalArea).filter(Boolean))]
    .filter((area) => !knownAreas.has(area))
    .sort((a, b) => a.localeCompare(b));
  return [...functionalAreas, ...savedAreas];
}

function selectedFunctionalAreas() {
  return Array.from(libraryFunctionalAreaFilter.selectedOptions)
    .map((option) => option.value)
    .filter((value) => value !== ALL_FUNCTIONAL_AREAS_VALUE)
    .filter(Boolean);
}

function functionalAreaMatches(entry, selectedAreas = selectedFunctionalAreas()) {
  return !selectedAreas.length || selectedAreas.includes(entry.record?.functionalArea || "");
}

function functionalAreaScopeText(selectedAreas = selectedFunctionalAreas()) {
  if (!selectedAreas.length) return "All functional areas";
  if (selectedAreas.length === 1) return selectedAreas[0];
  return `${selectedAreas.length} functional areas`;
}

function renderUnitFilter() {
  const current = libraryUnitFilter.value;
  libraryUnitFilter.innerHTML = '<option value="">Select a unit</option>';
  uniqueUnits().forEach((unit) => {
    const option = document.createElement("option");
    option.value = unit;
    option.textContent = unit;
    libraryUnitFilter.appendChild(option);
  });
  libraryUnitFilter.value = uniqueUnits().includes(current) ? current : "";
}

function renderFunctionalAreaFilter() {
  const selected = new Set(selectedFunctionalAreas());
  libraryFunctionalAreaFilter.innerHTML = [
    `<option value="${ALL_FUNCTIONAL_AREAS_VALUE}" ${selected.size ? "" : "selected"}>All functional areas</option>`,
    ...uniqueFunctionalAreas()
    .map((area) => `<option value="${escapeHtml(area)}" ${selected.has(area) ? "selected" : ""}>${escapeHtml(area)}</option>`)
  ].join("");
}

function entryText(entry) {
  const record = entry.record || {};
  return [
    record.unit,
    record.functionalArea,
    record.responsibleDiscipline,
    record.assessmentArea,
    record.assessmentItem,
    record.inspectionFocus,
    record.inspectionType,
    record.inspectionTypeTier2,
    record.inspectorName,
    record.workArea,
    record.hazard,
    record.correctiveAction,
    record.cause,
    record.reviewer,
    record.reviewDate,
    record.followUpLog
  ].filter(Boolean).join(" ").toLowerCase();
}

function filteredInspections() {
  const unit = libraryUnitFilter.value;
  if (!unit) return [];

  const query = librarySearch.value.trim().toLowerCase();
  const statusFilter = followUpStatusFilter.value;
  const selectedAreas = selectedFunctionalAreas();
  return inspections.filter((entry) => {
    const status = followUpStatus(entry);
    const unitMatches = entry.record?.unit === unit;
    const functionalAreaMatch = functionalAreaMatches(entry, selectedAreas);
    const queryMatches = !query || entryText(entry).includes(query);
    return unitMatches && functionalAreaMatch && queryMatches && statusMatchesFilter(status, statusFilter);
  }).sort((a, b) => {
    const statusA = followUpStatus(a);
    const statusB = followUpStatus(b);
    if (statusA.sort !== statusB.sort) return statusA.sort - statusB.sort;
    return String(a.record?.followUpDue || "9999-99-99").localeCompare(String(b.record?.followUpDue || "9999-99-99"));
  });
}

function selectedInspections() {
  return inspections.filter((entry) => exportSelection.has(entry.id));
}

function pruneExportSelectionForFilters(unit) {
  if (!unit) {
    exportSelection.clear();
    return;
  }

  const selectedAreas = selectedFunctionalAreas();
  const unitEntryIds = new Set(inspections
    .filter((entry) => entry.record?.unit === unit && functionalAreaMatches(entry, selectedAreas))
    .map((entry) => entry.id));
  Array.from(exportSelection).forEach((id) => {
    if (!unitEntryIds.has(id)) exportSelection.delete(id);
  });
}

function clearReportPreview() {
  selectedInspectionId = "";
  libraryReportPreview.innerHTML = "<p>Select a completed inspection to preview it here.</p>";
}

function closeFollowUpEditor() {
  editingInspectionId = "";
  followUpForm.reset();
  followUpEditor.hidden = true;
}

function renderReport(record) {
  const positiveFindingHtml = record.hasPositiveFinding === "Yes"
    ? `
      <section>
        <h3>Positive Finding</h3>
        <p>${display(record.positiveFinding)}</p>
      </section>
    `
    : "";

  const hazardHtml = record.hasFinding === "Yes"
    ? `
      <section>
        <h3>Hazard / Risk Identification</h3>
        <dl>
          <dt>Hazard / Discrepancy</dt><dd>${display(record.hazard)}</dd>
          <dt>Corrective Action</dt><dd>${display(record.correctiveAction)}</dd>
          <dt>Cause</dt><dd>${display(record.cause)}</dd>
          <dt>Responsible Person</dt><dd>${display(record.responsibleName)}</dd>
          <dt>Responsible Contact</dt><dd>${display(record.responsibleContact)}</dd>
          <dt>Follow-up Due</dt><dd>${display(record.followUpDue, "Not entered")}</dd>
          <dt>Corrected</dt><dd>${display(record.corrected)}</dd>
        </dl>
      </section>
    `
    : `
      <section>
        <h3>Hazard / Risk Identification</h3>
        <p>No hazard, risk, or finding was identified during this spot inspection.</p>
      </section>
    `;

  libraryReportPreview.innerHTML = `
    <section>
      <h3>Spot Inspection</h3>
      <dl>
        <dt>Unit</dt><dd>${display(record.unit)}</dd>
        <dt>Functional Area</dt><dd>${display(record.functionalArea)}</dd>
        <dt>Safety Area / Role</dt><dd>${display(record.responsibleDiscipline)}</dd>
        <dt>Inspection Topic</dt><dd>${display(record.assessmentItem)}</dd>
        <dt>Reference Source</dt><dd>${display(inspectionReferenceSource(record))}</dd>
        <dt>Suggested Inspection Question</dt><dd>${display(record.inspectionFocus)}</dd>
        <dt>Date</dt><dd>${display(record.inspectionDate)}</dd>
        <dt>Time</dt><dd>${display(record.inspectionTime)}</dd>
        <dt>Inspector Name</dt><dd>${display(record.inspectorName)}</dd>
        <dt>Inspector Email</dt><dd>${display(record.inspectorEmail)}</dd>
        <dt>Activity / Work Area</dt><dd>${display(record.workArea)}</dd>
        <dt>Finding Identified</dt><dd>${display(record.hasFinding)}</dd>
        <dt>Positive Finding</dt><dd>${display(record.hasPositiveFinding)}</dd>
      </dl>
    </section>
    ${positiveFindingHtml}
    ${hazardHtml}
    <section>
      <h3>Review and Closeout</h3>
      <dl>
        <dt>Reviewer</dt><dd>${display(record.reviewer)}</dd>
        <dt>Review Date</dt><dd>${display(record.reviewDate)}</dd>
      </dl>
      <p><strong>Follow-up Log:</strong> ${display(record.followUpLog)}</p>
    </section>
  `;
}

function renderFollowUpSummary() {
  const selectedUnit = libraryUnitFilter.value;
  const selectedAreas = selectedFunctionalAreas();
  if (!selectedUnit) {
    followUpSummary.innerHTML = `
      <div class="empty-library">
        <strong>Select a unit to load follow-up totals.</strong>
        <span>This keeps the library from opening with every unit's records at once.</span>
      </div>
    `;
    return;
  }

  const counts = {
    open: 0,
    "due-soon": 0,
    overdue: 0,
    closed: 0,
    "not-required": 0
  };

  inspections
    .filter((entry) => entry.record?.unit === selectedUnit && functionalAreaMatches(entry, selectedAreas))
    .forEach((entry) => {
    const status = followUpStatus(entry);
    counts[status.key] += 1;
  });

  followUpSummary.innerHTML = [
    { label: "Open", value: counts.open + counts["due-soon"] + counts.overdue, key: "open" },
    { label: "Due within 7 days", value: counts["due-soon"], key: "due-soon" },
    { label: "Overdue", value: counts.overdue, key: "overdue" },
    { label: "Closed", value: counts.closed, key: "closed" },
    { label: "No follow-up required", value: counts["not-required"], key: "not-required" }
  ].map((item) => `
    <button class="follow-up-summary-item" data-status-filter="${item.key}" type="button">
      <strong>${item.value}</strong>
      <span>${item.label}</span>
    </button>
  `).join("");
}

function renderLibrary() {
  renderUnitFilter();
  renderFunctionalAreaFilter();
  renderMonthlyTally();
  renderFollowUpSummary();
  const visibleEntries = filteredInspections();
  const selectedUnit = libraryUnitFilter.value;
  pruneExportSelectionForFilters(selectedUnit);
  const selectedCount = exportSelection.size;
  const visibleCountText = `${visibleEntries.length} inspection${visibleEntries.length === 1 ? "" : "s"}`;
  libraryCount.textContent = selectedUnit
    ? (selectedCount ? `${selectedCount} selected / ${visibleCountText}` : visibleCountText)
    : "Select a unit";
  exportCsv.textContent = selectedCount ? `Export Selected (${selectedCount})` : "Export CSV";
  exportCsv.disabled = !selectedUnit || (!selectedCount && !visibleEntries.length);

  if (!selectedUnit) {
    libraryList.innerHTML = `
      <div class="empty-library">
        <strong>Select a unit to view completed inspections.</strong>
        <span>The library and tracker will stay blank until a specific unit is selected.</span>
      </div>
    `;
    return;
  }

  if (!visibleEntries.length) {
    libraryList.innerHTML = `
      <div class="empty-library">
        <strong>No completed spot inspections found.</strong>
        <span>Try a different Unit or Functional Area filter, or save a completed inspection from the builder.</span>
      </div>
    `;
    return;
  }

  libraryList.innerHTML = visibleEntries.map((entry) => {
    const record = entry.record || {};
    const status = followUpStatus(entry);
    return `
      <article class="library-card">
        <label class="library-select" title="Select for export">
          <input class="library-select-input" data-id="${entry.id}" type="checkbox" ${exportSelection.has(entry.id) ? "checked" : ""} aria-label="Select ${display(record.unit)} for export" />
        </label>
        <div>
          <span class="follow-up-badge follow-up-badge-${status.tone}">${escapeHtml(status.label)}</span>
          <h3>${display(record.unit)}</h3>
          <p>${display(record.workArea)} - ${display(record.inspectionDate)}</p>
        </div>
        <dl>
          <dt>Safety Area / Role</dt><dd>${display(record.responsibleDiscipline)}</dd>
          <dt>Finding</dt><dd>${display(record.hasFinding)}</dd>
          <dt>Follow-up</dt><dd>${escapeHtml(status.detail)}</dd>
          <dt>Saved</dt><dd>${formatSavedDate(entry.savedAt)}</dd>
        </dl>
        <div class="library-actions">
          <button class="secondary-button library-action" data-action="view" data-id="${entry.id}" type="button">View</button>
          <button class="secondary-button library-action" data-action="follow-up" data-id="${entry.id}" type="button">Update Follow-up</button>
          <button class="secondary-button danger-button library-action" data-action="delete" data-id="${entry.id}" type="button">Delete</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadLibrary() {
  libraryStatus.textContent = "Loading inspections...";
  libraryList.innerHTML = '<div class="empty-library">Loading shared library...</div>';
  clearReportPreview();
  closeFollowUpEditor();

  try {
    const response = await fetch(apiUrl("/api/inspections"));
    const result = await readApiResponse(response);
    if (!response.ok) {
      throw new Error(result.error || `Unable to load completed spot inspections (${response.status}).`);
    }

    inspections = Array.isArray(result.inspections) ? result.inspections : [];
    requiresDeleteToken = Boolean(result.requiresDeleteToken);
    const currentIds = new Set(inspections.map((entry) => entry.id));
    Array.from(exportSelection).forEach((id) => {
      if (!currentIds.has(id)) exportSelection.delete(id);
    });
    libraryStatus.textContent = "Library loaded";
    renderLibrary();
  } catch (error) {
    libraryStatus.textContent = "Library unavailable";
    libraryList.innerHTML = `
      <div class="empty-library">
        <strong>Unable to load the shared library.</strong>
        <span>${escapeHtml(error instanceof Error ? error.message : "Unknown error")}</span>
      </div>
    `;
  }
}

async function deleteInspection(entry) {
  const record = entry.record || {};
  if (!window.confirm(`Delete ${record.unit || "this inspection"} from the shared library?`)) return;

  const headers = { "Content-Type": "application/json" };
  if (requiresDeleteToken) {
    const deleteCode = window.prompt("Enter library delete code.", "");
    if (deleteCode === null) return;
    if (!deleteCode.trim()) {
      window.alert("A delete code is required for this library.");
      return;
    }
    headers["X-Library-Delete-Token"] = deleteCode.trim();
  }

  const response = await fetch(apiUrl("/api/inspections"), {
    method: "DELETE",
    headers,
    body: JSON.stringify({ path: entry.path, sha: entry.sha })
  });
  const result = await readApiResponse(response);
  if (!response.ok) {
    window.alert(result.error || `Unable to delete inspection (${response.status}).`);
    return;
  }

  if (entry.id === selectedInspectionId) {
    clearReportPreview();
  }
  if (entry.id === editingInspectionId) {
    closeFollowUpEditor();
  }
  await loadLibrary();
}

function openFollowUpEditor(entry) {
  const record = entry.record || {};
  editingInspectionId = entry.id;
  followUpEditorTitle.textContent = `Update ${record.unit || "Spot Inspection"}`;
  followUpReviewer.value = record.reviewer || "";
  followUpReviewDate.value = record.reviewDate || currentDateValue();
  followUpCorrected.value = record.corrected || "No";
  followUpLogEdit.value = record.followUpLog || "";
  followUpEditor.hidden = false;
  followUpEditor.scrollIntoView({ behavior: "smooth", block: "start" });
  followUpLogEdit.focus();
}

async function saveFollowUpUpdate(event) {
  event.preventDefault();

  const entry = inspections.find((item) => item.id === editingInspectionId);
  if (!entry) return;

  saveFollowUpEdit.disabled = true;
  saveFollowUpEdit.textContent = "Saving...";

  try {
    const reviewDate = followUpReviewDate.value || currentDateValue();
    const corrected = followUpCorrected.value || "No";
    const followUpDue = corrected === "Yes" ? (entry.record?.followUpDue || "") : addDays(reviewDate, 30);

    const response = await fetch(apiUrl("/api/inspections"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: entry.path,
        recordUpdates: {
          reviewer: followUpReviewer.value,
          reviewDate,
          corrected,
          followUpDue,
          followUpLog: followUpLogEdit.value
        }
      })
    });
    const result = await readApiResponse(response);
    if (!response.ok) {
      throw new Error(result.error || `Unable to save follow-up update (${response.status}).`);
    }

    const index = inspections.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      inspections[index] = result.inspection;
    }
    libraryStatus.textContent = "Follow-up updated";
    renderLibrary();
    renderReport(result.inspection.record || {});
    selectedInspectionId = result.inspection.id;
    closeFollowUpEditor();
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "Unable to save follow-up update.");
  } finally {
    saveFollowUpEdit.disabled = false;
    saveFollowUpEdit.textContent = "Save Follow-up";
  }
}

function csvValue(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

function csvRow(values) {
  return values.map(csvValue).join(",");
}

function exportVisibleInspections() {
  const selectedEntries = selectedInspections();
  const exportEntries = selectedEntries.length ? selectedEntries : filteredInspections();
  if (!exportEntries.length) {
    window.alert("No inspections match the current filter.");
    return;
  }

  const headers = [
    "Unit",
    "Functional Area",
    "Safety Area / Role",
    "Inspection Topic",
    "Reference Source",
    "Suggested Inspection Question",
    "Inspection Date",
    "Inspection Time",
    "Inspector Name",
    "Inspector Email",
    "Activity / Work Area",
    "Finding Identified",
    "Positive Finding",
    "Positive Finding Notes",
    "Hazard / Discrepancy",
    "Corrective Action",
    "Cause",
    "Responsible Person",
    "Responsible Contact",
    "Follow-up Due",
    "Follow-up Status",
    "Follow-up Status Detail",
    "Corrected",
    "Reviewer",
    "Review Date",
    "Follow-up Log",
    "Saved At"
  ];

  const rows = exportEntries.map((entry) => {
    const record = entry.record || {};
    const status = followUpStatus(entry);
    return [
      record.unit,
      record.functionalArea,
      record.responsibleDiscipline,
      record.assessmentItem,
      inspectionReferenceSource(record),
      record.inspectionFocus,
      record.inspectionDate,
      record.inspectionTime,
      record.inspectorName,
      record.inspectorEmail,
      record.workArea,
      record.hasFinding,
      record.hasPositiveFinding,
      record.positiveFinding,
      record.hazard,
      record.correctiveAction,
      record.cause,
      record.responsibleName,
      record.responsibleContact,
      record.followUpDue,
      status.label,
      status.detail,
      record.corrected,
      record.reviewer,
      record.reviewDate,
      record.followUpLog,
      entry.savedAt
    ];
  });

  const csv = [csvRow(headers), ...rows.map(csvRow)].join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  const unit = libraryUnitFilter.value ? libraryUnitFilter.value : "all-units";
  const slug = unit.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "inspections";
  link.href = URL.createObjectURL(blob);
  link.download = `spot-inspections-${slug}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function updateFilters() {
  clearReportPreview();
  if (!libraryUnitFilter.value) {
    exportSelection.clear();
  }
  renderLibrary();
}

libraryUnitFilter.addEventListener("change", updateFilters);
libraryFunctionalAreaFilter.addEventListener("change", updateFilters);
librarySearch.addEventListener("input", updateFilters);
followUpStatusFilter.addEventListener("change", updateFilters);
libraryFiscalYear.addEventListener("change", renderMonthlyTally);
refreshLibrary.addEventListener("click", loadLibrary);
exportCsv.addEventListener("click", exportVisibleInspections);
followUpForm.addEventListener("submit", saveFollowUpUpdate);
cancelFollowUpEdit.addEventListener("click", closeFollowUpEditor);

followUpSummary.addEventListener("click", (event) => {
  const button = event.target.closest("[data-status-filter]");
  if (!button) return;
  followUpStatusFilter.value = button.dataset.statusFilter || "";
  updateFilters();
});

libraryList.addEventListener("click", (event) => {
  const button = event.target.closest(".library-action");
  if (!button) return;

  const entry = inspections.find((item) => item.id === button.dataset.id);
  if (!entry) return;

  if (button.dataset.action === "view") {
    selectedInspectionId = entry.id;
    renderReport(entry.record || {});
    libraryReportPreview.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (button.dataset.action === "delete") {
    deleteInspection(entry);
  }

  if (button.dataset.action === "follow-up") {
    openFollowUpEditor(entry);
  }
});

libraryList.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".library-select-input");
  if (!checkbox) return;

  if (checkbox.checked) {
    exportSelection.add(checkbox.dataset.id);
  } else {
    exportSelection.delete(checkbox.dataset.id);
  }
  renderLibrary();
});

loadLibrary();
