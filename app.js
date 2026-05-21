const STORAGE_KEY = "spotInspectionRecord";
const UNIT_MEMORY_KEY = "spotInspectionUnitMemory";

const form = document.querySelector("#inspectionForm");
const unitInput = document.querySelector("#unit");
const unitMemoryList = document.querySelector("#unitMemory");
const hazardSection = document.querySelector("#hazardSection");
const positiveFindingField = document.querySelector("#positiveFindingField");
const reportPreview = document.querySelector("#reportPreview");
const findingMetric = document.querySelector("#findingMetric");
const correctedMetric = document.querySelector("#correctedMetric");
const statusMetric = document.querySelector("#statusMetric");
const textareaModal = document.querySelector("#textareaModal");
const textareaModalTitle = document.querySelector("#textareaModalTitle");
const modalTextarea = document.querySelector("#modalTextarea");
const modalClose = document.querySelector("#modalClose");
const modalCancel = document.querySelector("#modalCancel");
const modalSave = document.querySelector("#modalSave");
const saveCompleted = document.querySelector("#saveCompleted");
const openLibrary = document.querySelector("#openLibrary");

let activeTextarea = null;

const fields = [
  "unit",
  "functionalArea",
  "responsibleDiscipline",
  "inspectionType",
  "inspectionTypeTier2",
  "inspectionDate",
  "inspectionTime",
  "inspectorEmail",
  "inspectorName",
  "workArea",
  "positiveFinding",
  "hazard",
  "correctiveAction",
  "cause",
  "responsibleName",
  "responsibleContact",
  "followUpDue",
  "closureDate",
  "closureVerifiedBy",
  "reviewer",
  "reviewDate",
  "disposition",
  "followUpLog",
  "reviewNotes",
];

const radioGroups = ["hasFinding", "hasPositiveFinding", "corrected"];
const today = new Date().toISOString().slice(0, 10);

function getUnitMemory() {
  const saved = localStorage.getItem(UNIT_MEMORY_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved).filter(Boolean);
  } catch {
    return [];
  }
}

function renderUnitMemory() {
  unitMemoryList.textContent = "";
  getUnitMemory().forEach((unit) => {
    const option = document.createElement("option");
    option.value = unit;
    unitMemoryList.appendChild(option);
  });
}

function rememberUnit(value) {
  const unit = value.trim();
  if (!unit) return;

  const normalized = unit.toLocaleLowerCase();
  const memory = getUnitMemory().filter((item) => item.toLocaleLowerCase() !== normalized);
  memory.unshift(unit);
  localStorage.setItem(UNIT_MEMORY_KEY, JSON.stringify(memory.slice(0, 25)));
  renderUnitMemory();
}

function emptyRecord() {
  return {
    unit: "",
    functionalArea: "",
    responsibleDiscipline: "",
    inspectionType: "",
    inspectionTypeTier2: "",
    inspectionDate: today,
    inspectionTime: "",
    inspectorEmail: "",
    inspectorName: "",
    workArea: "",
    hasFinding: "No",
    hasPositiveFinding: "No",
    positiveFinding: "",
    hazard: "",
    correctiveAction: "",
    cause: "",
    responsibleName: "",
    responsibleContact: "",
    followUpDue: "",
    corrected: "",
    closureDate: "",
    closureVerifiedBy: "",
    reviewer: "",
    reviewDate: "",
    disposition: "Draft",
    followUpLog: "",
    reviewNotes: "",
  };
}

function getRadioValue(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function setRadioValue(name, value) {
  form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = input.value === value;
  });
}

function getRecordFromForm() {
  const record = {};

  fields.forEach((field) => {
    record[field] = document.querySelector(`#${field}`).value.trim();
  });

  radioGroups.forEach((group) => {
    record[group] = getRadioValue(group);
  });

  return record;
}

function saveRecord() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getRecordFromForm()));
}

function loadRecord() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return emptyRecord();

  try {
    return { ...emptyRecord(), ...JSON.parse(saved) };
  } catch {
    return emptyRecord();
  }
}

function renderRecord(record) {
  fields.forEach((field) => {
    document.querySelector(`#${field}`).value = record[field] ?? "";
  });

  radioGroups.forEach((group) => {
    setRadioValue(group, record[group]);
  });

  update();
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

function isFindingRecord(record) {
  return record.hasFinding === "Yes";
}

function hasPositiveFinding(record) {
  return record.hasPositiveFinding === "Yes";
}

function updateHazardSection(record) {
  const showHazardSection = isFindingRecord(record);
  hazardSection.hidden = !showHazardSection;
  positiveFindingField.hidden = !hasPositiveFinding(record);

  [
    "hazard",
    "correctiveAction",
    "cause",
    "responsibleName",
    "responsibleContact",
  ].forEach((field) => {
    document.querySelector(`#${field}`).required = showHazardSection;
  });

  form.querySelectorAll('input[name="corrected"]').forEach((input) => {
    input.required = showHazardSection;
  });

  document.querySelector("#positiveFinding").required = hasPositiveFinding(record);
}

function renderMetrics(record) {
  findingMetric.textContent = record.hasFinding || "No";
  correctedMetric.textContent = isFindingRecord(record) ? record.corrected || "No" : "N/A";
  statusMetric.textContent = record.disposition || "Draft";
}

function renderReport(record) {
  const positiveFindingHtml = hasPositiveFinding(record)
    ? `
      <section>
        <h3>Positive Finding</h3>
        <p>${display(record.positiveFinding)}</p>
      </section>
    `
    : "";

  const hazardHtml = isFindingRecord(record)
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

  reportPreview.innerHTML = `
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

function apiUrl(path) {
  const base = String(window.SPOT_INSPECTION_API_URL || "").trim().replace(/\/$/, "");
  return `${base}${path}`;
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

async function saveCurrentInspectionToLibrary() {
  const record = getRecordFromForm();
  rememberUnit(record.unit);

  saveCompleted.disabled = true;
  saveCompleted.textContent = "Saving...";

  try {
    const response = await fetch(apiUrl("/api/inspections"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record, reportText: plainReportText() })
    });
    const result = await readApiResponse(response);

    if (!response.ok) {
      throw new Error(result.error || `Unable to save completed inspection (${response.status}).`);
    }

    saveCompleted.textContent = "Saved";
    window.setTimeout(() => {
      saveCompleted.textContent = "Save Completed";
      saveCompleted.disabled = false;
    }, 1400);
  } catch (error) {
    saveCompleted.textContent = "Save Completed";
    saveCompleted.disabled = false;
    window.alert(error instanceof Error ? error.message : "Unable to save completed inspection.");
  }
}

function update() {
  const record = getRecordFromForm();
  updateHazardSection(record);
  saveRecord();
  renderMetrics(record);
  renderReport(record);
}

function modalTitleFor(textarea) {
  const label = textarea.closest("label");
  return label?.querySelector("span")?.innerText.replace(/\s*\*$/, "") || "Edit Field";
}

function openTextareaModal(textarea) {
  activeTextarea = textarea;
  textareaModalTitle.textContent = modalTitleFor(textarea);
  modalTextarea.value = textarea.value;
  textareaModal.hidden = false;
  document.body.classList.add("modal-open");
  modalTextarea.focus();
}

function closeTextareaModal({ save = false } = {}) {
  if (save && activeTextarea) {
    activeTextarea.value = modalTextarea.value;
    activeTextarea.dispatchEvent(new Event("input", { bubbles: true }));
    activeTextarea.dispatchEvent(new Event("change", { bubbles: true }));
  }

  textareaModal.hidden = true;
  document.body.classList.remove("modal-open");
  activeTextarea?.focus();
  activeTextarea = null;
}

function plainReportText() {
  return reportPreview.innerText.replace(/\n{3,}/g, "\n\n").trim();
}

form.addEventListener("input", update);
form.addEventListener("change", update);

unitInput.addEventListener("blur", () => {
  rememberUnit(unitInput.value);
});

unitInput.addEventListener("change", () => {
  rememberUnit(unitInput.value);
});

form.querySelectorAll("textarea").forEach((textarea) => {
  textarea.readOnly = true;
  textarea.classList.add("popup-textarea");
  textarea.addEventListener("click", () => openTextareaModal(textarea));
  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTextareaModal(textarea);
    }
  });
});

modalClose.addEventListener("click", () => closeTextareaModal());
modalCancel.addEventListener("click", () => closeTextareaModal());
modalSave.addEventListener("click", () => closeTextareaModal({ save: true }));

textareaModal.addEventListener("click", (event) => {
  if (event.target === textareaModal) {
    closeTextareaModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (!textareaModal.hidden && event.key === "Escape") {
    closeTextareaModal();
  }
});

saveCompleted.addEventListener("click", saveCurrentInspectionToLibrary);
openLibrary.addEventListener("click", () => {
  window.location.href = "library.html";
});

document.querySelector("#newInspection").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderRecord(emptyRecord());
});

document.querySelector("#printReport").addEventListener("click", () => {
  window.print();
});

document.querySelector("#copyReport").addEventListener("click", async (event) => {
  await navigator.clipboard.writeText(plainReportText());
  event.currentTarget.textContent = "Copied";
  window.setTimeout(() => {
    event.currentTarget.textContent = "Copy Report";
  }, 1200);
});

renderUnitMemory();
renderRecord(loadRecord());
