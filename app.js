const STORAGE_KEY = "spotInspectionRecord";
const UNIT_MEMORY_KEY = "spotInspectionUnitMemory";
const EMAIL_MEMORY_KEY = "spotInspectionEmailMemory";

const form = document.querySelector("#inspectionForm");
const unitInput = document.querySelector("#unit");
const unitMemoryList = document.querySelector("#unitMemory");
const inspectorEmailInput = document.querySelector("#inspectorEmail");
const inspectorEmailMemoryList = document.querySelector("#inspectorEmailMemory");
const hazardSection = document.querySelector("#hazardSection");
const positiveFindingField = document.querySelector("#positiveFindingField");
const assessmentItemInput = document.querySelector("#assessmentItem");
const inspectionFocusInput = document.querySelector("#inspectionFocus");
const reportPreview = document.querySelector("#reportPreview");
const textareaModal = document.querySelector("#textareaModal");
const textareaModalTitle = document.querySelector("#textareaModalTitle");
const modalTextarea = document.querySelector("#modalTextarea");
const modalClose = document.querySelector("#modalClose");
const modalCancel = document.querySelector("#modalCancel");
const modalSave = document.querySelector("#modalSave");
const saveCompleted = document.querySelector("#saveCompleted");
const saveCompletedFloating = document.querySelector("#saveCompletedFloating");
const openEmailDraft = document.querySelector("#openEmailDraft");
const openLibrary = document.querySelector("#openLibrary");

let activeTextarea = null;
let activeAssessmentItemKey = "";
let activeInspectionFocusKey = "";
let lastSavedInspection = null;

const assessmentItemsByBranch = {
  "Aviation Safety|Commander and Supervisory Support (SMS)": [
    "Awards Program",
    "Commander (CC) Involvement",
    "Other Describe (Unique)",
    "Squadron Flight Safety Officer (SAFSO)",
    "Supervisor Responsibilities",
  ],
  "Aviation Safety|Compliance with Program Directives": [
    "Airfield Driving Program",
    "Bird/Wildlife Aircraft Strike Hazard (BASH)",
    "Controlled Movement Area Violations (CMAVs)",
    "Dropped Object Prevention Program (DOPP)",
    "Foreign Object Damage (FOD)",
    "Hazardous Air Traffic Reporting (HATR) Program",
    "Midair Collision Avoidance (MACA) Program",
    "Other Describe (Unique)",
    "Product Quality Deficiency Reporting System",
    "Snow/Ice Plans and Removal",
    "Tool Accountability",
    "Training",
  ],
  "Aviation Safety|Effectiveness of Mishap Prevention Programs": [
    "Mishap Reporting",
    "Other Describe (Unique)",
  ],
  "Occupational Safety|Commander and Supervisory Support (SMS)": [
    "Awards Program",
    "Commander (CC) Involvement",
    "Completion of Supervisor Safety Training by New Supervisors",
    "Councils and Committees",
    "Motorcycle Safety Representative (MSR) Responsibilities",
    "Organization and Staffing",
    "Other Describe (Unique)",
    "Safety Assurance",
    "Safety Promotion Support",
    "Supervisor Responsibilities",
    "Unit Safety Representative (USR) Responsibilities",
  ],
  "Occupational Safety|Compliance with Program Directives": [
    "Aerial Work Platform Safety",
    "CBRNE",
    "Confined Space",
    "Electrical Safety",
    "Ergonomics",
    "Fall Protection",
    "Fire or Life Safety",
    "Hazard Communication Plan (HAZCOM)",
    "Hazardous Energy Control",
    "Hazardous Material",
    "Hearing Conservation",
    "High Risk Activities/High Risk Training (HRT)",
    "Indoor Environmental Quality (IEQ)",
    "Job Safety Training Outline (JSTO)",
    "Laser",
    "Local National Safety Program",
    "Material Handling",
    "Non-Ionizing Radiation",
    "Occupational Health/Industrial Hygiene (IH)",
    "Other Describe (Unique)",
    "Personal Protective Equipment (PPE)",
    "Recreational Off Duty Safety (RODS)",
    "Respiratory Protection",
    "Risk Management",
    "Sight Conservation",
    "Systems Safety",
    "Toxic Metals",
    "Tracking Motorcycle Riders in MUSTT",
    "Traffic Safety",
    "Traffic Safety Training for Low Speed Vehicles/GVO/GMV",
    "Training",
    "Voluntary Protection Program (VPP)",
    "Weight Handling",
  ],
  "Occupational Safety|Effectiveness of Mishap Prevention Programs": [
    "Hazard Abatement Program",
    "Hazard Reporting Procedures",
    "Mishap Response and Reporting Procedures",
    "Other Describe (Unique)",
    "Unsafe Unhealthful Reporting",
  ],
  "Weapons Safety|Commander and Supervisory Support (SMS)": [
    "Additional Duty Weapons Safety Responsibilities (ADWSR)",
    "Awards Program",
    "Commander (CC) Involvement",
    "Other Describe (Unique)",
    "Supervisor Responsibilities",
  ],
  "Weapons Safety|Compliance with Program Directives": [
    "Assessment and Inspections",
    "Explosive",
    "Explosives Site Plans",
    "Explosives Storage/Operations",
    "Facility Licenses",
    "Fire Prevention",
    "Grounding/Lightning Protection",
    "Hazards of Electromagnetic Radiation to Ordnance",
    "Installation Explosives Map",
    "Laser",
    "NCI/NCE Program",
    "Nuclear Surety",
    "Other Describe (Unique)",
    "Roles and Responsibilities",
    "Supplements and Operating Instructions",
    "Training",
    "Transportation",
  ],
  "Weapons Safety|Effectiveness of Mishap Prevention Programs": [
    "Dissemination of Safety Information",
    "Mishap/Flagword Reporting",
    "Other Describe (Unique)",
    "Risk Assessments",
  ],
};

function assessmentDisciplineKey(value) {
  if (value === "Aviation Safety/SAFSO/Range Safety Officer") return "Aviation Safety";
  if (value === "Occupational Safety/USR/Supervisor" || value === "MSR") return "Occupational Safety";
  if (value === "Weapons Safety/ADWSR") return "Weapons Safety";
  return value;
}

const inspectionFocusByAssessmentItem = {
  "Confined Space": [
    "23.4.1 - Has the unit evaluated workplaces to identify confined spaces and coordinated classifications with the Confined Space Program Team?",
    "23.4.1 - Are permit-required confined spaces posted with danger signs or another effective warning method?",
    "23.4.1 - Does the unit have a written confined space program approved by the Confined Space Program Team?",
    "23.4.1 - Are confined space entry personnel trained before performing entrant, attendant, or entry supervisor duties?",
    "23.4.2 - Does the entry supervisor complete, sign, and post the permit before entry begins?",
    "23.4.2 - Is the confined space program or Master Entry Plan available at the entry location?",
    "23.4.3 - Does the attendant maintain an accurate count of authorized entrants and remain outside the space during entry?",
    "23.4.3 - Does the attendant communicate with entrants and order evacuation when required?",
    "23.5 - Does the written program identify space classifications, entry procedures, monitoring requirements, rescue procedures, and required equipment?",
    "23.5 - Is atmospheric monitoring continuous unless the program documents that periodic monitoring is sufficient?",
    "23.5 - Is monitoring equipment calibrated or checked according to manufacturer instructions and program requirements?",
    "23.5 - If hot work is performed, is DAF Form 592 completed and coordinated as required?",
    "23.7 - For recurring entries, does the Master Entry Plan identify spaces, tasks, hazards, controls, PPE, monitoring, communication, and rescue procedures?",
    "23.7 - Are rescue services verified before entry and is rescue equipment inspected, tested, maintained, and documented?",
    "23.7 - Are completed permits retained for at least one year for program review?",
    "23.8 - For non-permit spaces, has a formal risk assessment confirmed the space can be entered without permit controls?",
    "23.8 - Is atmospheric testing performed before non-permit entry and repeated when conditions change?",
    "23.10 - Are initial, annual proficiency, unit-specific, and atmospheric testing training records maintained?",
    "23.11 - Does DAF Form 1024 document hazards, controls, atmospheric testing, authorized personnel, emergency response, entry log, and close-out?"
  ],
  "Electrical Safety": [
    "8.1 - Has the supervisor completed a job hazard analysis for electrical work and identified required controls?",
    "8.1 - Are only qualified and authorized personnel performing electrical work or repairs?",
    "8.2 - Are receptacles, plugs, and adapters serviceable and used without unsafe multiple-plug arrangements?",
    "8.2 - Are GFCI or AFCI protections used where required for the work area or equipment?",
    "8.4 - Are extension cords used only as temporary wiring and not as a substitute for permanent wiring?",
    "8.4 - Are extension cords inspected for damage before use and removed from service if defective?",
    "8.4 - Are extension cords and surge protectors listed by a nationally recognized testing laboratory?",
    "8.4 - Are cords routed to prevent damage and kept from being run through doors, windows, walls, ceilings, or under rugs?",
    "8.4 - Are high-current appliances plugged directly into wall outlets instead of extension cords or power strips?",
    "8.5 - Are electrical disconnects, panels, and breakers accessible and kept clear of obstructions?",
    "8.5 - Are breakers clearly marked and free from tape, blocked handles, or other improper status indicators?",
    "8.5 - Are frequently tripping breakers reported and evaluated instead of repeatedly reset?",
    "8.9 - Are electrical hazards identified by supervisors and corrected or reported for repair?",
    "8.9 - Is wiring enclosed or protected from physical damage and environmental exposure?",
    "8.10 - Are electrical panel and control box doors closed when not being serviced?",
    "8.11 - Are electronic workbenches, accessories, and insulating matting serviceable and appropriate for the task?",
    "8.12 - Is emergency electrical equipment available, identified, and maintained where required?",
    "8.17 - Is equipment de-energized before work unless energized work is properly authorized and controlled?",
    "8.17 - When energized work is authorized, are arc flash controls and required PPE used?"
  ],
  "Fall Protection": [
    "13.1 - Are fall hazards controlled for work above four feet in general industry or six feet in construction activities?",
    "13.2 - Has the unit identified fall protection roles such as program administrator, qualified person, competent person, and authorized user?",
    "13.2 - Are competent persons inspecting fall protection equipment at least quarterly?",
    "13.2 - Are authorized users completing pre-use inspections before using fall protection equipment?",
    "13.2 - Are supervisors ensuring personnel are trained, evaluated, and understand their fall protection assignments?",
    "13.3 - Has a fall hazard survey been completed for work areas where fall hazards exist?",
    "13.3 - Does the fall hazard survey identify access methods, task locations, hazards, work configuration, environmental factors, risk assessment, and selected controls?",
    "13.3 - Is the fall hazard survey updated when equipment, tasks, facilities, or conditions change?",
    "13.4 - Are written fall protection and rescue procedures available for tasks requiring fall protection?",
    "13.4 - Do procedures identify location, standards, training, clearance/design requirements, equipment, and rescue plan?",
    "13.6 - Are personnel trained before exposure to fall hazards and retrained when procedures, equipment, or performance gaps change?",
    "13.7 - Is fall protection equipment maintained according to manufacturer instructions or technical orders?",
    "13.7 - Is unserviceable fall protection equipment removed from service and destroyed when required?",
    "13.7 - Are anchorage inspections current and documented?",
    "13.9 - Has the annual fall protection assessment reviewed training records, surveys, written procedures, equipment, anchorages, storage, maintenance, and incident investigations?",
    "13.9 - Were annual fall protection assessment results reported to the commander within required timelines?"
  ],
  "Hazardous Energy Control": [
    "21.2.1 - Does the shop have a hazardous energy control program with procedures, training, and periodic inspections?",
    "21.2.2 - If tagout-only devices are used, is equivalent protection to lockout documented?",
    "21.3.1.1 - Can authorized employees identify hazardous energy sources, type, magnitude, and isolation/control methods?",
    "21.3.1.2 - Do affected employees understand the purpose and use of the energy control procedure?",
    "21.3.1.3 - Are other employees instructed not to restart or reenergize locked/tagged equipment?",
    "21.3.1.4 - If tagout is used, do employees understand the limitations of tags?",
    "21.3.1.5 - Has retraining occurred after job, equipment, process, procedure, or knowledge gaps changed?",
    "21.3.1.6 - Is hazardous energy control training documented with employee names and training dates?",
    "21.4.1 - Has the shop hazardous energy control program periodic inspection been accomplished at least annually?",
    "21.4.1.1 - Does the inspection identify equipment and machinery covered by the program?",
    "21.4.1.2 - Does the inspection verify training is current and properly documented?",
    "21.4.1.3 - Were hazardous energy control procedures reviewed with authorized employees, including demonstration of required practices?",
    "21.4.1.4 - Where lockout is used, did inspectors and authorized employees review responsibilities under the procedure?",
    "21.4.1.5 - Where tagout is used, did employees review responsibilities and tag limitations?",
    "21.4.1.6 - Was an out-brief conducted as appropriate and were findings documented in the written report?",
    "21.4.2 - Did a qualified occupational safety inspector review annual self-inspection reports during the safety assessment?",
    "21.5.1 - Are lockout/tagout devices singularly identified and marked to identify the employee applying them?",
    "21.5.2 - Are lockout/tagout devices durable enough for the expected environment and exposure?",
    "21.5.3 - Are lockout devices singularly keyed, controlled by authorized employees, and standardized by color, shape, or size?",
    "21.5.4 - Are AF Form 983, DoD tags, or commercial equivalent tags available and used with energy-isolating devices?",
    "21.5.5 - Are lockout devices strong enough to resist removal and tagout attachment devices non-reusable, self-locking, and rated at least 50 pounds?",
    "21.6 - Are equipment-specific hazardous energy control procedures developed and documented unless exempted?",
    "Figure 21.1 - Do procedures address notification, preparation, shutdown, isolation, LOTO application, stored-energy release, verification, and keeping devices in place?",
    "Figure 21.2 - Before release from LOTO, are affected employees notified, the area cleared, guards replaced, controls neutral, and devices removed only by authorized employees?",
    "21.6.1 - For group LOTO, is one authorized employee assigned primary responsibility and continuity of protection maintained?",
    "21.6.2 - Are employees prohibited from attaching or removing another person's LOTO device except under the allowed exception?",
    "21.6.3 - Are written shift-change or personnel-change procedures used to maintain hazardous energy control protection?",
    "21.7.2 - For complex LOTO, is a written plan of execution used when multiple energy sources, crews, locations, employers, disconnects, sequences, or work periods are involved?",
    "21.8 - Are contractor hazardous energy control responsibilities specified and coordinated?"
  ],
  "Personal Protective Equipment (PPE)": [
    "14.2 - Have personnel received PPE training on when PPE is required, what PPE is required, how to use it, limitations, care, maintenance, and disposal?",
    "14.2 - Is PPE training documented and is retraining completed when workplace conditions, PPE, or employee knowledge changes?",
    "14.3 - Has the supervisor completed and documented a job hazard analysis for operations requiring PPE?",
    "14.3 - Are engineering and administrative controls considered before relying on PPE as the primary control?",
    "14.3 - Does the supervisor coordinate with Bioenvironmental Engineering or Safety when operations, materials, or hazards change?",
    "14.3 - Is required PPE provided, used, fitted, inspected, maintained, and stored correctly?",
    "14.3.2 - Do personnel inspect PPE for serviceability before use and report problems to the supervisor?",
    "14.3.3 - Is eye and face protection appropriate for the hazard and marked to ANSI/ISEA Z87.1?",
    "14.3.4 - Where respiratory protection is required, is it managed through the respiratory protection program?",
    "14.3.5 - Is head protection, hair protection, or bump cap use required and controlled where hazards exist?",
    "14.3.6 - Is hearing protection available and used where noise hazards require it?",
    "14.3.7 - Are electrical workers using required protective clothing and rubber insulating PPE where applicable?",
    "14.3.8 - Is hand and arm protection selected for the specific chemical, cut, burn, electrical, or mechanical hazard?",
    "14.3.10 - Does the JHA identify required foot or leg protection and is safety footwear appropriate for the hazard?",
    "14.3.12 - Is chemical protective clothing selected using SDS information, exposure duration, and material performance characteristics?",
    "14.3.13 - Are welding and cutting personnel using required eye, face, hand, arm, and body protection?",
    "14.4 - Is PPE cleaned, disinfected, repaired, replaced, or disposed of when contaminated or unserviceable?",
    "14.4 - Are supervisors ensuring protective clothing and equipment continue to protect personnel from assigned work hazards?"
  ]
};

const fields = [
  "unit",
  "functionalArea",
  "responsibleDiscipline",
  "assessmentArea",
  "assessmentItem",
  "inspectionFocus",
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

function getEmailMemory() {
  const saved = localStorage.getItem(EMAIL_MEMORY_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved).filter(Boolean);
  } catch {
    return [];
  }
}

function renderEmailMemory() {
  inspectorEmailMemoryList.textContent = "";
  getEmailMemory().forEach((email) => {
    const option = document.createElement("option");
    option.value = email;
    inspectorEmailMemoryList.appendChild(option);
  });
}

function rememberEmail(value) {
  const email = value.trim();
  if (!email || !inspectorEmailInput.checkValidity()) return;

  const normalized = email.toLocaleLowerCase();
  const memory = getEmailMemory().filter((item) => item.toLocaleLowerCase() !== normalized);
  memory.unshift(email);
  localStorage.setItem(EMAIL_MEMORY_KEY, JSON.stringify(memory.slice(0, 25)));
  renderEmailMemory();
}

function emptyRecord() {
  return {
    unit: "",
    functionalArea: "",
    responsibleDiscipline: "",
    assessmentArea: "",
    assessmentItem: "",
    inspectionFocus: "",
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
  updateAssessmentItem(record);

  fields.forEach((field) => {
    document.querySelector(`#${field}`).value = record[field] ?? "";
  });

  updateInspectionFocus(record);

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

function updateAssessmentItem(record) {
  const itemKey = `${assessmentDisciplineKey(record.responsibleDiscipline)}|${record.assessmentArea}`;
  const options = assessmentItemsByBranch[itemKey] || [];
  const showAssessmentItem = options.length > 0;

  if (activeAssessmentItemKey !== itemKey) {
    const selectedValue = record.assessmentItem || "";
    assessmentItemInput.innerHTML = '<option value="">Select assessment item</option>';
    options.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      assessmentItemInput.appendChild(option);
    });
    assessmentItemInput.value = options.includes(selectedValue) ? selectedValue : "";
    record.assessmentItem = assessmentItemInput.value;
    activeAssessmentItemKey = itemKey;
  }

  assessmentItemInput.disabled = !showAssessmentItem;
  assessmentItemInput.required = showAssessmentItem;

  if (!showAssessmentItem && assessmentItemInput.value) {
    assessmentItemInput.value = "";
    record.assessmentItem = "";
  }
}

function updateInspectionFocus(record) {
  const focusOptions = inspectionFocusByAssessmentItem[record.assessmentItem] || [];
  const showInspectionFocus = focusOptions.length > 0;
  const focusKey = record.assessmentItem || "";

  if (activeInspectionFocusKey !== focusKey) {
    const selectedValue = record.inspectionFocus || "";
    inspectionFocusInput.innerHTML = showInspectionFocus
      ? '<option value="">Select a possible inspection focus</option>'
      : '<option value="">Select a supported assessment item in Box 5 first</option>';
    focusOptions.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      inspectionFocusInput.appendChild(option);
    });
    inspectionFocusInput.value = focusOptions.includes(selectedValue) ? selectedValue : "";
    record.inspectionFocus = inspectionFocusInput.value;
    activeInspectionFocusKey = focusKey;
  }

  inspectionFocusInput.disabled = !showInspectionFocus;

  if (!showInspectionFocus && inspectionFocusInput.value) {
    inspectionFocusInput.value = "";
    record.inspectionFocus = "";
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
        <dt>Possible Inspection Focus</dt><dd>${display(record.inspectionFocus)}</dd>
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

function absolutePageUrl(pageName) {
  return new URL(pageName, window.location.href).href;
}

function createMailtoUrl(entry) {
  const record = entry?.record || {};
  const to = String(record.inspectorEmail || "").trim();
  const subject = `Spot inspection saved - ${record.unit || "Unit not documented"} - ${record.inspectionDate || ""}`.trim();
  const body = [
    "A completed spot inspection was saved.",
    "",
    `Inspection ID: ${entry?.id || "Not documented"}`,
    `Unit: ${record.unit || "Not documented"}`,
    `Responsible Discipline: ${record.responsibleDiscipline || "Not documented"}`,
    `Assessment Area: ${record.assessmentArea || "Not documented"}`,
    `Assessment Item: ${record.assessmentItem || "Not documented"}`,
    `Possible Inspection Focus: ${record.inspectionFocus || "Not documented"}`,
    `Inspection Date: ${record.inspectionDate || "Not documented"}`,
    `Follow-up Due: ${record.followUpDue || "Not applicable"}`,
    `Finding Identified: ${record.hasFinding || "Not documented"}`,
    "",
    `Library: ${absolutePageUrl("library.html")}`,
    "",
    "Use the Library & Tracker page to search for this inspection and update follow-up actions."
  ].join("\n");

  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function setEmailDraftAction(entry) {
  lastSavedInspection = entry || null;
  openEmailDraft.hidden = !lastSavedInspection;
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
  rememberEmail(record.inspectorEmail);

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

    setEmailDraftAction(result.inspection || { record });
    setSaveButtonState({ disabled: true, text: "Saved" });
    if (result.email?.sent) {
      window.alert(`Inspection saved. Confirmation email sent to ${record.inspectorEmail}.`);
    }
    window.setTimeout(() => {
      setSaveButtonState({ disabled: false, text: "Save Completed" });
    }, 1400);
  } catch (error) {
    setEmailDraftAction(null);
    setSaveButtonState({ disabled: false, text: "Save Completed" });
    window.alert(error instanceof Error ? error.message : "Unable to save completed inspection.");
  }
}

function update() {
  const record = getRecordFromForm();
  syncCalculatedDates(record);
  updateAssessmentItem(record);
  updateInspectionFocus(record);
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

inspectorEmailInput.addEventListener("blur", () => {
  rememberEmail(inspectorEmailInput.value);
});

inspectorEmailInput.addEventListener("change", () => {
  rememberEmail(inspectorEmailInput.value);
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
openEmailDraft.addEventListener("click", () => {
  if (!lastSavedInspection) return;
  window.location.href = createMailtoUrl(lastSavedInspection);
});

new IntersectionObserver(([entry]) => {
  saveCompletedFloating.hidden = entry.isIntersecting;
}, { threshold: 0.25 }).observe(saveCompleted);

openLibrary.addEventListener("click", () => {
  window.location.href = "library.html";
});

document.querySelector("#newInspection").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  setEmailDraftAction(null);
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
renderEmailMemory();
renderRecord(loadRecord());
