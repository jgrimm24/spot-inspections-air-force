const STORAGE_KEY = "spotInspectionRecord";
const UNIT_MEMORY_KEY = "spotInspectionUnitMemory";

const form = document.querySelector("#inspectionForm");
const unitInput = document.querySelector("#unit");
const unitMemoryList = document.querySelector("#unitMemory");
const hazardSection = document.querySelector("#hazardSection");
const positiveFindingField = document.querySelector("#positiveFindingField");
const assessmentAreaField = document.querySelector("#assessmentAreaField");
const assessmentAreaInput = document.querySelector("#assessmentArea");
const assessmentItemField = document.querySelector("#assessmentItemField");
const assessmentItemInput = document.querySelector("#assessmentItem");
const reportPreview = document.querySelector("#reportPreview");
const textareaModal = document.querySelector("#textareaModal");
const textareaModalTitle = document.querySelector("#textareaModalTitle");
const modalTextarea = document.querySelector("#modalTextarea");
const modalClose = document.querySelector("#modalClose");
const modalCancel = document.querySelector("#modalCancel");
const modalSave = document.querySelector("#modalSave");
const saveCompleted = document.querySelector("#saveCompleted");
const saveCompletedFloating = document.querySelector("#saveCompletedFloating");
const openLibrary = document.querySelector("#openLibrary");

let activeTextarea = null;

const fields = [
  "unit",
  "functionalArea",
  "responsibleDiscipline",
  "assessmentArea",
  "assessmentItem",
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
  "reviewer",
  "reviewDate",
  "followUpLog",
];

const radioGroups = ["hasFinding", "hasPositiveFinding", "corrected"];

function currentTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function formatDateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function currentDateValue() {
  return formatDateValue(new Date());
}

function addDays(startDateValue, days) {
  if (!startDateValue) return "";

  const date = new Date(`${startDateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  date.setDate(date.getDate() + days);
  return formatDateValue(date);
}

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
    assessmentArea: "",
    assessmentItem: "",
    inspectionType: "",
    inspectionTypeTier2: "",
    inspectionDate: currentDateValue(),
    inspectionTime: currentTimeValue(),
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
    followUpDue: addDays(currentDateValue(), 30),
    corrected: "",
    reviewer: "",
    reviewDate: "",
    followUpLog: "",
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
  if (!saved) {
    return emptyRecord();
  }

  try {
    const record = { ...emptyRecord(), ...JSON.parse(saved) };
    return {
      ...record,
      inspectionTime: record.inspectionTime || currentTimeValue(),
      followUpDue: addDays(record.inspectionDate, 30)
    };
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

function updateAssessmentArea(record) {
  const disciplineSelected = Boolean(record.responsibleDiscipline);
  assessmentAreaField.hidden = !disciplineSelected;
  assessmentAreaInput.required = disciplineSelected;

  if (!disciplineSelected && assessmentAreaInput.value) {
    assessmentAreaInput.value = "";
    record.assessmentArea = "";
  }
}

function updateAssessmentItem(record) {
  const showAssessmentItem = record.responsibleDiscipline === "Aviation Safety"
    && record.assessmentArea === "Commander and Supervisory Support (SMS)";
  assessmentItemField.hidden = !showAssessmentItem;
  assessmentItemInput.required = showAssessmentItem;

  if (!showAssessmentItem && assessmentItemInput.value) {
    assessmentItemInput.value = "";
    record.assessmentItem = "";
  }
}

function syncCalculatedDates(record) {
  const followUpDue = addDays(record.inspectionDate, 30);
  const followUpDueInput = document.querySelector("#followUpDue");
  if (followUpDueInput.value !== followUpDue) {
    followUpDueInput.value = followUpDue;
    record.followUpDue = followUpDue;
  }
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
        <dt>Assessment Area</dt><dd>${display(record.assessmentArea)}</dd>
        <dt>Assessment Item</dt><dd>${display(record.assessmentItem)}</dd>
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

function setSaveButtonState({ disabled, text }) {
  [saveCompleted, saveCompletedFloating].forEach((button) => {
    button.disabled = disabled;
    button.textContent = text;
  });
}

async function saveCurrentInspectionToLibrary() {
  const record = getRecordFromForm();
  rememberUnit(record.unit);

  setSaveButtonState({ disabled: true, text: "Saving..." });

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

    setSaveButtonState({ disabled: true, text: "Saved" });
    if (result.email?.sent) {
      window.alert(`Inspection saved. Confirmation email sent to ${record.inspectorEmail}.`);
    } else if (result.email?.message) {
      window.alert(`Inspection saved, but confirmation email was not sent: ${result.email.message}`);
    }
    window.setTimeout(() => {
      setSaveButtonState({ disabled: false, text: "Save Completed" });
    }, 1400);
  } catch (error) {
    setSaveButtonState({ disabled: false, text: "Save Completed" });
    window.alert(error instanceof Error ? error.message : "Unable to save completed inspection.");
  }
}

function update() {
  const record = getRecordFromForm();
  syncCalculatedDates(record);
  updateAssessmentArea(record);
  updateAssessmentItem(record);
  updateHazardSection(record);
  saveRecord();
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
saveCompletedFloating.addEventListener("click", saveCurrentInspectionToLibrary);

new IntersectionObserver(([entry]) => {
  saveCompletedFloating.hidden = entry.isIntersecting;
}, { threshold: 0.25 }).observe(saveCompleted);

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
