const API_BASE = String(window.SPOT_INSPECTION_API_URL || "").trim().replace(/\/$/, "");

const libraryStatus = document.querySelector("#libraryStatus");
const libraryUnitFilter = document.querySelector("#libraryUnitFilter");
const librarySearch = document.querySelector("#librarySearch");
const libraryCount = document.querySelector("#libraryCount");
const libraryList = document.querySelector("#libraryList");
const libraryReportPreview = document.querySelector("#libraryReportPreview");
const refreshLibrary = document.querySelector("#refreshLibrary");
const exportCsv = document.querySelector("#exportCsv");
const followUpEditor = document.querySelector("#followUpEditor");
const followUpEditorTitle = document.querySelector("#followUpEditorTitle");
const followUpForm = document.querySelector("#followUpForm");
const followUpReviewer = document.querySelector("#followUpReviewer");
const followUpReviewDate = document.querySelector("#followUpReviewDate");
const followUpLogEdit = document.querySelector("#followUpLogEdit");
const saveFollowUpEdit = document.querySelector("#saveFollowUpEdit");
const cancelFollowUpEdit = document.querySelector("#cancelFollowUpEdit");

let inspections = [];
let selectedInspectionId = "";
let editingInspectionId = "";

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

function uniqueUnits() {
  return [...new Set(inspections.map((entry) => entry.record?.unit).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function renderUnitFilter() {
  const current = libraryUnitFilter.value;
  libraryUnitFilter.innerHTML = '<option value="">All units</option>';
  uniqueUnits().forEach((unit) => {
    const option = document.createElement("option");
    option.value = unit;
    option.textContent = unit;
    libraryUnitFilter.appendChild(option);
  });
  libraryUnitFilter.value = uniqueUnits().includes(current) ? current : "";
}

function entryText(entry) {
  const record = entry.record || {};
  return [
    record.unit,
    record.functionalArea,
    record.responsibleDiscipline,
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
  const query = librarySearch.value.trim().toLowerCase();
  return inspections.filter((entry) => {
    const unitMatches = !unit || entry.record?.unit === unit;
    const queryMatches = !query || entryText(entry).includes(query);
    return unitMatches && queryMatches;
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
        <dt>Responsible Discipline</dt><dd>${display(record.responsibleDiscipline)}</dd>
        <dt>Type</dt><dd>${display(record.inspectionType)}</dd>
        <dt>Type Tier 2</dt><dd>${display(record.inspectionTypeTier2)}</dd>
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

function renderLibrary() {
  renderUnitFilter();
  const visibleEntries = filteredInspections();
  libraryCount.textContent = `${visibleEntries.length} inspection${visibleEntries.length === 1 ? "" : "s"}`;
  exportCsv.disabled = !visibleEntries.length;

  if (!visibleEntries.length) {
    libraryList.innerHTML = `
      <div class="empty-library">
        <strong>No completed spot inspections found.</strong>
        <span>Try a different Unit filter or save a completed inspection from the builder.</span>
      </div>
    `;
    return;
  }

  libraryList.innerHTML = visibleEntries.map((entry) => {
    const record = entry.record || {};
    return `
      <article class="library-card">
        <div>
          <h3>${display(record.unit)}</h3>
          <p>${display(record.workArea)} - ${display(record.inspectionDate)} - ${display(record.inspectionTypeTier2)}</p>
        </div>
        <dl>
          <dt>Discipline</dt><dd>${display(record.responsibleDiscipline)}</dd>
          <dt>Finding</dt><dd>${display(record.hasFinding)}</dd>
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
  const deleteCode = window.prompt("Enter delete code if required. Leave blank if not configured.", "");
  if (deleteCode === null) return;
  if (deleteCode) headers["X-Library-Delete-Token"] = deleteCode;

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
    const response = await fetch(apiUrl("/api/inspections"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: entry.path,
        recordUpdates: {
          reviewer: followUpReviewer.value,
          reviewDate: followUpReviewDate.value,
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
  const visibleEntries = filteredInspections();
  if (!visibleEntries.length) {
    window.alert("No inspections match the current filter.");
    return;
  }

  const headers = [
    "Unit",
    "Functional Area",
    "Responsible Discipline",
    "Inspection Type",
    "Inspection Type Tier 2",
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
    "Corrected",
    "Reviewer",
    "Review Date",
    "Follow-up Log",
    "Saved At"
  ];

  const rows = visibleEntries.map((entry) => {
    const record = entry.record || {};
    return [
      record.unit,
      record.functionalArea,
      record.responsibleDiscipline,
      record.inspectionType,
      record.inspectionTypeTier2,
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
  renderLibrary();
}

libraryUnitFilter.addEventListener("change", updateFilters);
librarySearch.addEventListener("input", updateFilters);
refreshLibrary.addEventListener("click", loadLibrary);
exportCsv.addEventListener("click", exportVisibleInspections);
followUpForm.addEventListener("submit", saveFollowUpUpdate);
cancelFollowUpEdit.addEventListener("click", closeFollowUpEditor);

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

loadLibrary();
