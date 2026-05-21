const API_BASE = String(window.SPOT_INSPECTION_API_URL || "").trim().replace(/\/$/, "");

const libraryStatus = document.querySelector("#libraryStatus");
const libraryUnitFilter = document.querySelector("#libraryUnitFilter");
const librarySearch = document.querySelector("#librarySearch");
const libraryCount = document.querySelector("#libraryCount");
const libraryList = document.querySelector("#libraryList");
const libraryReportPreview = document.querySelector("#libraryReportPreview");
const refreshLibrary = document.querySelector("#refreshLibrary");

let inspections = [];

function apiUrl(path) {
  return `${API_BASE}${path}`;
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
    record.cause
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
          <dt>Closure Date</dt><dd>${display(record.closureDate, "Not entered")}</dd>
          <dt>Closure Verified By</dt><dd>${display(record.closureVerifiedBy, "Not entered")}</dd>
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
        <dt>Disposition</dt><dd>${display(record.disposition)}</dd>
      </dl>
      <p><strong>Follow-up Log:</strong> ${display(record.followUpLog)}</p>
      <p>${display(record.reviewNotes)}</p>
    </section>
  `;
}

function renderLibrary() {
  renderUnitFilter();
  const visibleEntries = filteredInspections();
  libraryCount.textContent = `${visibleEntries.length} inspection${visibleEntries.length === 1 ? "" : "s"}`;

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
          <button class="secondary-button danger-button library-action" data-action="delete" data-id="${entry.id}" type="button">Delete</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadLibrary() {
  libraryStatus.textContent = "Loading inspections...";
  libraryList.innerHTML = '<div class="empty-library">Loading shared library...</div>';

  try {
    const response = await fetch(apiUrl("/api/inspections"));
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Unable to load completed spot inspections.");
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
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    window.alert(result.error || "Unable to delete inspection.");
    return;
  }

  await loadLibrary();
}

libraryUnitFilter.addEventListener("change", renderLibrary);
librarySearch.addEventListener("input", renderLibrary);
refreshLibrary.addEventListener("click", loadLibrary);

libraryList.addEventListener("click", (event) => {
  const button = event.target.closest(".library-action");
  if (!button) return;

  const entry = inspections.find((item) => item.id === button.dataset.id);
  if (!entry) return;

  if (button.dataset.action === "view") {
    renderReport(entry.record || {});
    libraryReportPreview.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (button.dataset.action === "delete") {
    deleteInspection(entry);
  }
});

loadLibrary();
