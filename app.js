const STORAGE_KEY = "spotInspectionRecord";
const UNIT_MEMORY_KEY = "spotInspectionUnitMemory";
const EMAIL_MEMORY_KEY = "spotInspectionEmailMemory";
const TOPIC_MEMORY_KEY = "spotInspectionTopicSearchMemory";

const form = document.querySelector("#inspectionForm");
const unitInput = document.querySelector("#unit");
const unitMemoryList = document.querySelector("#unitMemory");
const inspectorEmailInput = document.querySelector("#inspectorEmail");
const inspectorEmailMemoryList = document.querySelector("#inspectorEmailMemory");
const hazardSection = document.querySelector("#hazardSection");
const positiveFindingField = document.querySelector("#positiveFindingField");
const assessmentItemInput = document.querySelector("#assessmentItem");
const inspectionFocusInput = document.querySelector("#inspectionFocus");
const topicSearchInput = document.querySelector("#topicSearch");
const topicSearchResults = document.querySelector("#topicSearchResults");
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
let topicSearchMatches = [];

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
    "Additive Manufacturing Safety",
    "Aircraft Flightline Ground Operations",
    "Batteries - Maintenance, Handling, and Storage",
    "CBRNE",
    "Civil Engineering",
    "Communication Cable, Antenna, and Communication Systems",
    "Composite Materials",
    "Compressed Gases",
    "Confined Space",
    "Cryogenic Liquids",
    "DAFMAN 91-203 Introduction and JHA",
    "Electrical Safety",
    "Emergency Shower and Eyewash Units",
    "Ergonomics",
    "Fall Protection",
    "Fire or Life Safety",
    "Flammables and Combustibles",
    "General Work Procedures",
    "Grounds, Mowing, and Agriculture Tractors",
    "Hazard Communication Plan (HAZCOM)",
    "Hazardous Energy Control",
    "Hazardous Material",
    "Hand Tools, Portable Power Tools, and Machinery",
    "Hearing Conservation",
    "High Risk Activities/High Risk Training (HRT)",
    "Hydrocarbon Fuels",
    "Indoor Environmental Quality (IEQ)",
    "Interior Spray Finishing",
    "Job Safety Training Outline (JSTO)",
    "Laser",
    "Local National Safety Program",
    "Material Handling",
    "Material Handling Equipment (MHE)",
    "Motor Vehicle Operations and Maintenance",
    "Mishap Prevention Safety Signs, Tags, and Labeling",
    "Non-Ionizing Radiation",
    "Nondestructive Inspection (NDI) and Oil Analysis",
    "Occupational Health/Industrial Hygiene (IH)",
    "Other Describe (Unique)",
    "Personal Protective Equipment (PPE)",
    "Precision Measurement Equipment Laboratory",
    "Process Safety Management (PSM)",
    "Recreational Off Duty Safety (RODS)",
    "Respiratory Protection",
    "Risk Management",
    "Services Operations",
    "Sight Conservation",
    "Training Systems",
    "Systems Safety",
    "Walking-Working Surfaces",
    "Weather Safety",
    "Welding, Cutting, and Hot Work",
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
  "Aerial Work Platform Safety": [
    "16.2 - Are mobile elevating work platform or scaffold hazards identified before work begins?",
    "16.3 - Are operators and users trained for the equipment or scaffold being used?",
    "16.4 - Are vehicle-mounted elevating and rotating work platforms inspected and used within manufacturer limits?",
    "16.5 - Are manually propelled or self-propelled work platforms set up on stable surfaces and protected from movement?",
    "16.6 - Are scaffolds erected, used, moved, and dismantled under appropriate supervision?",
    "16.7 - Are tubular welded frame scaffolds assembled with required bracing, platforms, and access?",
    "16.9 - Are tube and coupler scaffolds built to the required configuration and load capacity?"
  ],
  "Additive Manufacturing Safety": [
    "34.2 - Have additive manufacturing responsibilities been assigned for supervision, safety, and users?",
    "34.3 - Has the unit identified the type of additive manufacturing process in use?",
    "34.4 - Are part processing categories understood and controlled for the materials and equipment used?",
    "34.5 - Are additive manufacturing hazards such as dust, fumes, heat, lasers, chemicals, and mechanical hazards evaluated?",
    "34.6 - Are exposure controls, ventilation, PPE, and housekeeping practices in place for the process?",
    "34.7 - Are personnel trained before operating additive manufacturing equipment or handling related materials?"
  ],
  "Aircraft Flightline Ground Operations": [
    "24.2 - Are flightline-specific requirements briefed and followed for the operation being inspected?",
    "24.3 - Are flightline hazardous areas identified, controlled, and communicated to affected personnel?",
    "24.4 - Is additional PPE available and used for flightline hazards?",
    "24.5 - Are aircraft parking requirements followed and parking areas controlled?",
    "24.6 - Are adverse weather safeguards applied for high winds, lightning, snow, or other hazardous conditions?",
    "24.7 - Are towing and taxiing operations controlled with qualified personnel, communication, and clearance?",
    "24.8 - Are aircraft jacking operations performed with required controls and equipment condition checks?",
    "24.15 - Are aircraft shop and flightline maintenance operations using required safety controls?"
  ],
  "Batteries - Maintenance, Handling, and Storage": [
    "29.2 - Are battery safety precautions followed during maintenance, charging, handling, and storage?",
    "29.3 - Do battery rooms and areas have required equipment, layout, and emergency controls?",
    "29.4 - Are battery fire prevention controls in place?",
    "29.5 - Are ventilation systems operating where battery charging or storage creates atmospheric hazards?",
    "29.6 - Are batteries stored and handled to prevent spills, shorts, damage, or incompatible storage?",
    "29.7 - Are electrical controls and protections suitable for battery operations?",
    "29.8 - Are vehicle and support equipment batteries installed and maintained safely?",
    "29.9 - Are aircraft battery and electrical system requirements followed where applicable?"
  ],
  "CBRNE": [
    "Are CBRNE-related procedures available and understood by affected personnel?",
    "Are required CBRNE training records current for personnel assigned to the task or program?",
    "Is required CBRNE equipment available, inspected, serviceable, and stored correctly?",
    "Are PPE, detection, decontamination, or response supplies matched to the identified hazard?",
    "Are signs, labels, access controls, or notifications used where CBRNE hazards or equipment are present?",
    "Are emergency actions, reporting procedures, and communication paths understood by personnel?"
  ],
  "Civil Engineering": [
    "25.2 - Are supervisors ensuring personnel follow civil engineering safety requirements for assigned work?",
    "25.3 - Is compressed air used safely and within approved limits?",
    "25.4 - Are shoring and trenching operations evaluated and controlled before entry or work?",
    "25.5 - Are barricades and traffic signs used where CE work affects roads, pavements, or pedestrian areas?",
    "25.6 - Are sanitation controls in place for CE work areas?",
    "25.8 - Are equipment operations and pavement activities controlled for struck-by, traffic, and equipment hazards?",
    "25.9 - Are carpentry and structural maintenance hazards controlled?",
    "25.12 - Are refrigeration, air conditioning, heating, water, or wastewater work hazards controlled as applicable?"
  ],
  "Communication Cable, Antenna, and Communication Systems": [
    "28.2 - Are general safety practices followed for communications cable, antenna, and communication systems work?",
    "28.3 - Are personnel trained for the communications work they perform?",
    "28.4 - Are safety equipment and devices available, inspected, and used?",
    "28.5 - Are tools and equipment appropriate, serviceable, and used safely?",
    "28.6 - Are high-voltage hazards identified and controlled before work begins?",
    "28.7 - Are aerial work controls used for climbing, elevated work, or antenna tasks?",
    "28.12 - Are radar and microwave equipment hazards controlled?",
    "28.13 - Are manhole, handhole, and unvented vault entries evaluated and controlled?"
  ],
  "Composite Materials": [
    "31.2 - Are composite material safety responsibilities assigned and understood?",
    "31.3 - Are general requirements followed for composite material handling, cutting, sanding, repair, or disposal?",
    "31.4 - Are controls in place for the specific composite application being performed?",
    "31.5 - Is hazardous waste from composite material work collected, labeled, stored, and disposed correctly?",
    "31.6 - Are special mishap considerations understood for composite material fires, dust, or damaged components?",
    "31.7 - Are safety reviews completed for new composite material processes or modifications?"
  ],
  "Compressed Gases": [
    "19.2 - Are compressed gas cylinders secured, capped when required, and protected from damage?",
    "19.2 - Are cylinders identified by contents and kept away from incompatible hazards?",
    "19.2 - Are regulators, valves, hoses, and fittings inspected and suitable for the gas used?",
    "19.3 - Are compressed gases stored with separation for oxygen, fuel gases, flammables, and incompatible materials?",
    "19.3 - Are storage areas ventilated, posted, protected from heat, and arranged to prevent falling cylinders?",
    "19.4 - Are disposal and shipping requirements followed for empty, damaged, or unserviceable cylinders?"
  ],
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
  "Cryogenic Liquids": [
    "26.1 - Are cryogenic hazards such as extreme cold, oxygen enrichment or deficiency, pressure, and fire hazards identified?",
    "26.2 - Are general cryogenic handling requirements followed for containers, transfer, storage, and transport?",
    "26.3 - Is the cryogenic storage facility sited and arranged to control exposure and emergency access hazards?",
    "26.4 - Have occupational health concerns been evaluated for personnel exposed to cryogenic operations?",
    "26.5 - Are precautions followed when working with LN2, LOX, LH2, or LNG?",
    "26.6 - Are fire prevention and protection controls in place for cryogenic operations?",
    "26.8 - Are cryogenic work areas clean, uncluttered, ventilated, and free of incompatible materials?",
    "26.9 - Are receipt, storage, and issue operations controlled and documented?"
  ],
  "DAFMAN 91-203 Introduction and JHA": [
    "1.2 - Are roles and responsibilities understood for the inspected workplace or operation?",
    "1.3 - Are waivers, exemptions, or letters of interpretation documented when requirements cannot be met?",
    "1.5 - Are applicable standards being applied to the work being inspected?",
    "1.6 - Has a job hazard analysis been completed or reviewed for the task?",
    "1.7 - Are required safety documents and records maintained?",
    "1.8 - Are first aid and CPR training requirements met where required?",
    "1.9 - Is bloodborne pathogen training current where occupational exposure may exist?"
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
  "Emergency Shower and Eyewash Units": [
    "9.2 - Are emergency shower and eyewash requirements identified for the chemicals or hazards present?",
    "9.3 - Is emergency shower or eyewash equipment properly acquired and suitable for the hazard?",
    "9.4 - Are units located within required travel distance and free of access obstructions?",
    "9.4 - Are emergency shower and eyewash units clearly identified and accessible at all times?",
    "9.5 - Are units maintained, inspected, flushed, and tested at required intervals?",
    "9.6 - Are personnel trained on emergency shower and eyewash location and use?"
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
  "Fire or Life Safety": [
    "6.1 - Are portable fire extinguishers available, mounted, identified, and appropriate for the hazard?",
    "6.1 - Are fire extinguishers inspected and maintained at required intervals?",
    "6.2 - Are exits, corridors, doors, and emergency routes clear and usable?",
    "6.2 - Are fire prevention controls in place for storage, ignition sources, and combustible materials?",
    "6.2 - Are fire protection systems protected from obstruction, damage, or impairment?",
    "6.2 - Are personnel aware of local fire reporting and evacuation procedures?"
  ],
  "Flammables and Combustibles": [
    "22.2 - Are flammable and combustible liquid hazards identified for the operation?",
    "22.3 - Are personnel trained on safe handling, storage, dispensing, and emergency actions?",
    "22.4 - Is required PPE available and used for flammable or combustible liquid operations?",
    "22.5 - Are housekeeping controls preventing spills, residue buildup, and ignition hazards?",
    "22.6 - Are fire protection controls available and suitable for the liquids in use?",
    "22.7 - Do buildings, rooms, cabinets, and equipment meet requirements for the material stored or used?",
    "22.8 - Are handling and dispensing operations bonded, grounded, ventilated, and controlled as required?"
  ],
  "General Work Procedures": [
    "2.2 - Are hazards identified and controlled before work begins?",
    "2.3 - Are jewelry and loose-item restrictions followed around machinery, electrical equipment, or moving parts?",
    "2.4 - Are work areas clean, orderly, and free of slip, trip, fire, and access hazards?",
    "2.4.9.9 - Are storage racks and shelving load sizes and ratings determined by manufacturer specifications or a structural engineer/certified testing agency, and posted on the rack or shelving unit unless used for lightweight administrative office items?",
    "2.5 - Are office safety hazards such as cords, storage, electrical use, and walkways controlled?",
    "2.6 - Are ergonomic hazards evaluated and corrected where personnel perform repetitive or sustained tasks?",
    "2.7 - Are roll-up doors inspected, controlled, and used safely?",
    "2.8 - Are receiving and loading dock hazards controlled?",
    "2.10 - Are manual material handling and lifting techniques being used safely?"
  ],
  "Grounds, Mowing, and Agriculture Tractors": [
    "10.2 - Are grounds equipment inspections and maintenance completed before use?",
    "10.3 - Are mowing operations controlled for thrown objects, slopes, traffic, and bystanders?",
    "10.4 - Are edgers inspected and used with proper guards and PPE?",
    "10.5 - Is commercial mowing or turf care equipment operated by trained personnel and within safe limits?",
    "10.6 - Are tree and hedge trimming hazards controlled, including overhead and falling-object hazards?",
    "10.7 - Are fertilizers handled and stored safely?",
    "10.8 - Are irrigation system hazards controlled?",
    "10.9 - Are agricultural tractors and implements inspected, guarded, and operated safely?"
  ],
  "Hand Tools, Portable Power Tools, and Machinery": [
    "11.1 - Are general tool and machinery safety requirements understood and followed?",
    "11.2 - Are hand tools and portable power tools inspected before use and removed from service if damaged?",
    "11.2 - Are guards, handles, cords, switches, and accessories serviceable and appropriate for the tool?",
    "11.2 - Are personnel using proper PPE for the tool and task?",
    "11.3 - Are machinery guards in place and adjusted before operation?",
    "11.3 - Are machinery operators trained and protected from point-of-operation, nip point, and rotating-part hazards?",
    "11.4 - Are machine-specific requirements followed for the equipment being inspected?"
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
  "Hydrocarbon Fuels": [
    "18.2 - Are hydrocarbon fuel hazards identified, including fire, vapor, exposure, and static hazards?",
    "18.3 - Are personnel trained for the fuel operation they perform?",
    "18.4 - Is required PPE available and used for fuel handling, servicing, storage, or laboratory operations?",
    "18.5 - Are fuel work areas kept clean and free of unnecessary combustible materials?",
    "18.6 - Are fire prevention and protection controls in place for fuel operations?",
    "18.7 - Are required inspections completed for fuel areas or equipment?",
    "18.8 - Are fuel storage systems controlled and maintained?",
    "18.9 - Are fuel servicing operations performed with bonding, grounding, spill control, and emergency controls?"
  ],
  "Indoor Environmental Quality (IEQ)": [
    "Are occupant complaints, odors, moisture, temperature, or ventilation concerns documented and routed for evaluation?",
    "Are visible water intrusion, mold-like growth, damaged ceiling tiles, or damp materials corrected promptly?",
    "Are ventilation supply and return areas unobstructed?",
    "Are chemicals, cleaners, or materials stored in a way that prevents unnecessary indoor air quality concerns?",
    "Are housekeeping practices preventing dust, clutter, pest attractants, and blocked airflow?",
    "Has Bioenvironmental Engineering, Civil Engineering, or Safety been contacted when IEQ concerns require technical evaluation?"
  ],
  "Interior Spray Finishing": [
    "27.2 - Are spray finishing safety requirements followed for the materials and process in use?",
    "27.3 - Are health and environmental controls in place for paint, solvent, and coating exposures?",
    "27.4 - Are fire prevention controls in place for spray finishing operations?",
    "27.5 - Are ventilation systems operating, inspected, and suitable for spray operations?",
    "27.6 - Are coatings, solvents, and related materials stored and handled safely?",
    "27.7 - Is electrical equipment suitable for the spray finishing area classification?",
    "27.9 - Are paint spray booths inspected, maintained, and used correctly?",
    "27.16 - Are aerosol spray paint cans stored, used, and disposed safely?"
  ],
  "Laser": [
    "Are laser classifications, hazards, and operating procedures identified for the equipment in use?",
    "Are laser warning signs, labels, and controlled areas established where required?",
    "Are operators trained and authorized for the laser system or operation?",
    "Is required laser eye protection available, marked for the wavelength and optical density, and serviceable?",
    "Are beam paths, reflections, interlocks, shutters, and barriers controlled to prevent unintended exposure?",
    "Are alignment, maintenance, or open-beam operations controlled by written procedures?"
  ],
  "Local National Safety Program": [
    "Are local national safety requirements identified and incorporated into workplace procedures where applicable?",
    "Are affected personnel trained on local requirements, host-nation rules, or translated procedures as needed?",
    "Are supervisors verifying local national employees understand hazard controls and reporting procedures?",
    "Are required safety records, briefings, or inspections maintained for local national work areas?",
    "Are differences between DAF and local requirements elevated when they affect safe operations?",
    "Are communication methods effective for mixed-language or host-nation workforce hazards?"
  ],
  "Material Handling Equipment (MHE)": [
    "12.2 - Are general material handling equipment requirements followed for the equipment being used?",
    "12.4 - Are required inspections completed and documented for material handling equipment?",
    "12.6 - Are operators qualified and trained for the equipment?",
    "12.7 - Are required tests current for lifting or hoisting equipment?",
    "12.8 - Are powered industrial trucks inspected, operated, charged, parked, and maintained safely?",
    "12.9 - Are conveyors guarded, inspected, and controlled?",
    "12.11 - Are hoists inspected and used within rated capacity?",
    "12.13 - Are overhead, gantry, underhung cranes, or monorail systems inspected and operated safely?"
  ],
  "Mishap Prevention Safety Signs, Tags, and Labeling": [
    "17.2 - Are hazards identified and communicated with appropriate signs, tags, labels, or markings?",
    "17.3 - Are personnel trained on the meaning and use of required safety signs, tags, and labels?",
    "17.4 - Are required mishap prevention signs posted, legible, and placed where personnel can see them?",
    "17.5 - Are safety, fire prevention, and health tags used correctly and removed when no longer needed?",
    "17.6 - Are administrative devices used only for their intended purpose and not as hazard-control substitutes?",
    "17.7 - Are piping systems labeled, marked, or color-coded where required?"
  ],
  "Motor Vehicle Operations and Maintenance": [
    "30.2 - Are motor vehicle operation and maintenance hazards identified for the work being performed?",
    "30.3 - Are general vehicle safety controls followed by operators and maintainers?",
    "30.5 - Are vehicle maintenance facility and equipment requirements met?",
    "30.6 - Are fire prevention controls in place for maintenance, fuels, batteries, and flammable materials?",
    "30.7 - Is ventilation adequate for vehicle maintenance and exhaust-producing operations?",
    "30.8 - Are solvent cleaning operations controlled?",
    "30.12 - Are lifting devices inspected and used within rated capacity?",
    "30.13 - Are wheel and tire maintenance operations controlled for stored-energy hazards?"
  ],
  "Nondestructive Inspection (NDI) and Oil Analysis": [
    "5.2 - Are NDI and oil analysis safety precautions followed for the process being performed?",
    "5.2 - Are radiation, chemical, electrical, fire, and exposure hazards controlled as applicable?",
    "5.3 - Are supervisor responsibilities understood and carried out for NDI or oil analysis operations?",
    "5.4 - Is NDI equipment inspected, maintained, and used according to requirements?",
    "5.4 - Are fire protection systems and controls available and serviceable in NDI areas?",
    "5.4 - Are required postings, shielding, ventilation, or access controls in place?"
  ],
  "Occupational Health/Industrial Hygiene (IH)": [
    "Are occupational health hazards identified for chemicals, noise, heat, radiation, biological agents, or other exposures?",
    "Are Bioenvironmental Engineering surveys, recommendations, or exposure assessments available where required?",
    "Are engineering controls, administrative controls, and PPE implemented for identified exposure hazards?",
    "Are personnel enrolled in required medical surveillance or occupational health programs where applicable?",
    "Are exposure controls reviewed when processes, materials, equipment, or work practices change?",
    "Are supervisors documenting and correcting occupational health deficiencies?"
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
  ],
  "Precision Measurement Equipment Laboratory": [
    "32.2 - Are PMEL hazards identified, including chemical, electrical, radioactive, cleaning, and equipment hazards?",
    "32.3 - Are ventilation systems operating and appropriate for PMEL operations?",
    "32.4 - Are electrical safety controls followed for PMEL equipment and work practices?",
    "32.5 - Are radioactive material safety requirements followed where applicable?",
    "32.6 - Are equipment and component cleaning operations controlled for chemical and exposure hazards?",
    "32.7 - Are PMEL tools and equipment serviceable, appropriate, and used safely?"
  ],
  "Process Safety Management (PSM)": [
    "33.2 - Has the unit determined whether OSHA Process Safety Management requirements apply?",
    "33.3 - Are PSM responsibilities assigned and understood?",
    "33.4 - Has a chemical process and storage review been completed for highly hazardous chemicals?",
    "33.4 - Are process hazards, chemical inventories, storage conditions, and controls documented?",
    "33.5 - Are personnel trained for PSM-covered processes before working independently?",
    "Table 33.1 - Has the PSM decision flow been used to determine whether the process is covered?"
  ],
  "Recreational Off Duty Safety (RODS)": [
    "Are seasonal or high-risk off-duty safety messages being shared with unit personnel?",
    "Are supervisors discussing off-duty risk factors during relevant periods such as holidays, travel, or seasonal activities?",
    "Are personnel encouraged to use risk management before recreational or off-duty activities?",
    "Are mishap trends or local hazards used to tailor off-duty safety messaging?",
    "Are motorcycle, traffic, water, winter, heat, or sports safety topics addressed when applicable?",
    "Is unit leadership reinforcing reporting and lessons learned from off-duty mishaps?"
  ],
  "Services Operations": [
    "4.2 - Are laundry operations controlled for heat, chemical, ergonomic, machine, and housekeeping hazards?",
    "4.3 - Are lodging operations inspected for housekeeping, storage, electrical, and emergency access hazards?",
    "4.4 - Are food service operations controlled for slips, burns, cuts, sanitation, chemical use, and equipment hazards?",
    "4.4 - Are food service employees using required PPE and safe work practices?",
    "4.4 - Are kitchen fire prevention and emergency controls available and serviceable?",
    "4.4 - Are equipment guards, interlocks, cords, and surfaces maintained in safe condition?"
  ],
  "Training Systems": [
    "15.2 - Are general training system safety requirements identified and followed?",
    "15.3 - Are facility requirements met for the training system being used?",
    "15.4 - Are training systems inspected, operated, and maintained according to requirements?",
    "15.5 - Are wheeled vehicle egress assistance trainer requirements followed where applicable?",
    "15.6 - Are aircraft flight or high-value training systems controlled for motion, electrical, fire, egress, and emergency hazards?",
    "15.7 - Are upgrades or modifications to existing training systems reviewed for safety impacts?"
  ],
  "Tracking Motorcycle Riders in MUSTT": [
    "Are motorcycle riders identified and tracked in MUSTT or the required tracking system?",
    "Are rider training dates and motorcycle safety requirements current?",
    "Are supervisors and commanders reviewing rider status and overdue training?",
    "Are new riders identified during in-processing, newcomer briefings, or supervisor updates?",
    "Are riders briefed on PPE, licensing, training, and local riding requirements?",
    "Are discrepancies in rider tracking corrected and documented?"
  ],
  "Voluntary Protection Program (VPP)": [
    "Is leadership visibly supporting hazard reporting, employee involvement, and continuous safety improvement?",
    "Are personnel aware of how to report hazards and participate in safety improvement efforts?",
    "Are hazard reports, inspections, and corrective actions tracked to closure?",
    "Are trend data, mishap data, or inspection results used to target prevention efforts?",
    "Are employees involved in identifying hazards and recommending controls?",
    "Are VPP or safety excellence activities documented and communicated to the workforce?"
  ],
  "Walking-Working Surfaces": [
    "7.1 - Are walking-working surfaces clean, dry, orderly, and free of slip, trip, and fall hazards?",
    "7.1 - Are floor openings, holes, edges, and elevated surfaces guarded or otherwise controlled?",
    "7.2 - Are stairs and ramps maintained with required handrails, surfaces, lighting, and clear access?",
    "7.3 - Are fixed ladders inspected, labeled, and equipped with required fall protection or safety systems?",
    "7.4 - Are portable ladders inspected before use and used on stable surfaces at proper angles?",
    "7.5 - Are stepladders used fully open and within rated capacity?",
    "7.6 - Are emergency walking-working surface conditions addressed during emergency operations?"
  ],
  "Weather Safety": [
    "3.1 - Are weather safety responsibilities assigned and understood for the activity or operation?",
    "3.2 - Is the two-tier weather notification system understood and used when required?",
    "3.3 - Are lightning safety procedures followed for outdoor work, flightline operations, ranges, and exposed activities?",
    "3.3 - Are personnel moved to safe locations when lightning criteria or warnings require it?",
    "3.4 - Are snow and ice hazards controlled for DAF activities and operations?",
    "3.4 - Are walking surfaces, vehicle operations, and outdoor tasks adjusted for snow or ice conditions?"
  ],
  "Welding, Cutting, and Hot Work": [
    "20.2 - Are welding, cutting, and hot work hazards identified before work begins?",
    "20.4 - Are personnel trained and qualified for the hot work being performed?",
    "20.5 - Are precautions in place for fire watch, combustibles, ventilation, cylinders, and adjacent areas?",
    "20.6 - Is required PPE available and used for welding, cutting, or hot work?",
    "20.7 - Is welding equipment inspected, serviceable, and used correctly?",
    "20.8 - Are hot work locations approved or controlled for the operation?",
    "20.10 - Is DAF Form 592 or the required hot work permit completed when required?"
  ]
};

const inspectionFocusAliases = {
  "Ergonomics": "General Work Procedures",
  "Hazard Communication Plan (HAZCOM)": "Flammables and Combustibles",
  "Hazardous Material": "Flammables and Combustibles",
  "Hearing Conservation": "Personal Protective Equipment (PPE)",
  "High Risk Activities/High Risk Training (HRT)": "DAFMAN 91-203 Introduction and JHA",
  "Job Safety Training Outline (JSTO)": "DAFMAN 91-203 Introduction and JHA",
  "Material Handling": "Material Handling Equipment (MHE)",
  "Non-Ionizing Radiation": "Communication Cable, Antenna, and Communication Systems",
  "Respiratory Protection": "Personal Protective Equipment (PPE)",
  "Risk Management": "DAFMAN 91-203 Introduction and JHA",
  "Sight Conservation": "Personal Protective Equipment (PPE)",
  "Systems Safety": "DAFMAN 91-203 Introduction and JHA",
  "Toxic Metals": "Personal Protective Equipment (PPE)",
  "Traffic Safety": "Motor Vehicle Operations and Maintenance",
  "Traffic Safety Training for Low Speed Vehicles/GVO/GMV": "Motor Vehicle Operations and Maintenance",
  "Training": "DAFMAN 91-203 Introduction and JHA",
  "Weight Handling": "Material Handling Equipment (MHE)"
};

function unlearnTopicSearchTerm(term) {
  const normalizedTerm = normalizeSearchText(term);
  const remaining = getLearnedTopicSearches()
    .filter((entry) => normalizeSearchText(entry.term) !== normalizedTerm);
  saveLearnedTopicSearches(remaining);
  renderTopicSearchResults();
  topicSearchResults.insertAdjacentHTML("afterbegin", `
    <p><strong>Unlearned:</strong> "${escapeHtml(term)}" was removed from this browser's search memory.</p>
  `);
}

const topicSearchKeywords = {
  "Aerial Work Platform Safety": [
    "aerial lift",
    "boom lift",
    "man lift",
    "scissor lift",
    "scaffold",
    "work platform"
  ],
  "Batteries - Maintenance, Handling, and Storage": [
    "battery",
    "battery room",
    "charging",
    "lithium",
    "lead acid"
  ],
  "Compressed Gases": [
    "cylinder",
    "compressed gas",
    "oxygen bottle",
    "acetylene",
    "regulator"
  ],
  "Emergency Shower and Eyewash Units": [
    "eyewash",
    "eye wash",
    "emergency shower",
    "chemical splash",
    "corrosive"
  ],
  "Electrical Safety": [
    "cord",
    "extension cord",
    "power strip",
    "surge protector",
    "breaker",
    "electrical panel",
    "outlet",
    "plug"
  ],
  "Fall Protection": [
    "fall",
    "harness",
    "lanyard",
    "anchor",
    "roof",
    "elevated work"
  ],
  "Fire or Life Safety": [
    "fire extinguisher",
    "exit",
    "egress",
    "emergency exit",
    "exit sign"
  ],
  "Flammables and Combustibles": [
    "flammable",
    "flammable cabinet",
    "combustible",
    "solvent",
    "fuel can",
    "safety can"
  ],
  "General Work Procedures": [
    "shelf",
    "shelving",
    "rack",
    "storage rack",
    "storage",
    "housekeeping",
    "clutter",
    "office",
    "trip hazard",
    "slip"
  ],
  "Hand Tools, Portable Power Tools, and Machinery": [
    "tool",
    "grinder",
    "drill",
    "saw",
    "machine guard",
    "machinery",
    "bench grinder"
  ],
  "Hazardous Energy Control": [
    "lockout",
    "tagout",
    "loto",
    "stored energy",
    "energy control"
  ],
  "Indoor Environmental Quality (IEQ)": [
    "mold",
    "water leak",
    "odor",
    "air quality",
    "ventilation",
    "temperature"
  ],
  "Interior Spray Finishing": [
    "paint",
    "paint booth",
    "spray booth",
    "spray paint",
    "coating"
  ],
  "Laser": [
    "laser",
    "laser eye protection",
    "beam"
  ],
  "Material Handling": [
    "material handling",
    "lifting",
    "manual lifting",
    "pallet",
    "shelving",
    "storage"
  ],
  "Material Handling Equipment (MHE)": [
    "forklift",
    "powered industrial truck",
    "pit",
    "hoist",
    "crane",
    "sling",
    "conveyor",
    "pallet jack"
  ],
  "Motor Vehicle Operations and Maintenance": [
    "vehicle",
    "tire",
    "wheel",
    "jack",
    "lift",
    "maintenance bay"
  ],
  "Personal Protective Equipment (PPE)": [
    "ppe",
    "glove",
    "gloves",
    "safety glasses",
    "goggles",
    "hard hat",
    "hearing protection",
    "respirator",
    "boots"
  ],
  "Walking-Working Surfaces": [
    "ladder",
    "stairs",
    "ramp",
    "walking surface",
    "floor opening",
    "guardrail"
  ],
  "Welding, Cutting, and Hot Work": [
    "welding",
    "cutting",
    "hot work",
    "torch",
    "fire watch"
  ]
};

function inspectionFocusKeyForAssessmentItem(assessmentItem) {
  return inspectionFocusAliases[assessmentItem] || assessmentItem;
}

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
    responsibleDiscipline: "Occupational Safety/USR/Supervisor",
    assessmentArea: "Compliance with Program Directives",
    assessmentItem: "",
    inspectionFocus: "",
    inspectionType: "Safety spot inspection",
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
      responsibleDiscipline: record.responsibleDiscipline || "Occupational Safety/USR/Supervisor",
      assessmentArea: record.assessmentArea || "Compliance with Program Directives",
      inspectionType: record.inspectionType || "Safety spot inspection",
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

function normalizeSearchText(value) {
  return String(value || "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function searchTerms(value) {
  return normalizeSearchText(value).split(" ").filter((term) => term.length > 1);
}

function responsibleDisciplineForSearchKey(value) {
  if (value === "Aviation Safety") return "Aviation Safety/SAFSO/Range Safety Officer";
  if (value === "Occupational Safety") return "Occupational Safety/USR/Supervisor";
  if (value === "Weapons Safety") return "Weapons Safety/ADWSR";
  return value;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function getLearnedTopicSearches() {
  const saved = localStorage.getItem(TOPIC_MEMORY_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved).filter((entry) => entry?.term && entry?.assessmentItem);
  } catch {
    return [];
  }
}

function saveLearnedTopicSearches(entries) {
  localStorage.setItem(TOPIC_MEMORY_KEY, JSON.stringify(entries.slice(0, 100)));
}

function learnedTopicMatches() {
  return getLearnedTopicSearches().map((entry) => ({
    responsibleDiscipline: entry.responsibleDiscipline || "",
    assessmentArea: entry.assessmentArea || "",
    assessmentItem: entry.assessmentItem || "",
    inspectionFocus: entry.inspectionFocus || "",
    title: entry.assessmentItem || "Learned Search",
    detail: entry.inspectionFocus || entry.responsibleDiscipline || "Safety",
    canonical: true,
    learned: true,
    term: entry.term,
    searchText: normalizeSearchText([
      entry.term,
      entry.responsibleDiscipline,
      entry.assessmentArea,
      entry.assessmentItem,
      entry.inspectionFocus
    ].join(" "))
  }));
}

function buildTopicSearchCatalog() {
  const builtInMatches = Object.entries(assessmentItemsByBranch).flatMap(([branchKey, assessmentItems]) => {
    const [disciplineKey, assessmentArea] = branchKey.split("|");
    const responsibleDiscipline = responsibleDisciplineForSearchKey(disciplineKey);
    return assessmentItems.flatMap((assessmentItem) => {
      const focusKey = inspectionFocusKeyForAssessmentItem(assessmentItem);
      const focusOptions = inspectionFocusByAssessmentItem[focusKey] || [];
      const keywords = uniqueValues([
        ...(topicSearchKeywords[assessmentItem] || []),
        ...(topicSearchKeywords[focusKey] || [])
      ]);
      const baseText = [
        responsibleDiscipline,
        assessmentArea,
        assessmentItem,
        focusKey,
        ...keywords
      ].join(" ");

      if (!focusOptions.length) {
        return [{
          responsibleDiscipline,
          assessmentArea,
          assessmentItem,
          inspectionFocus: "",
          title: assessmentItem,
          detail: responsibleDiscipline,
          canonical: assessmentItem === focusKey,
          searchText: normalizeSearchText(baseText)
        }];
      }

      return focusOptions.map((inspectionFocus) => ({
        responsibleDiscipline,
        assessmentArea,
        assessmentItem,
        inspectionFocus,
        title: assessmentItem,
        detail: inspectionFocus,
        canonical: assessmentItem === focusKey,
        searchText: normalizeSearchText(`${baseText} ${inspectionFocus}`)
      }));
    });
  });

  return [...learnedTopicMatches(), ...builtInMatches];
}

function topicMatchScore(match, terms, query) {
  const learnedBoost = match.learned
    ? (normalizeSearchText(match.term) === query ? 120 : 45)
    : 0;

  return terms.reduce((score, term) => {
    if (!match.searchText.includes(term)) return score - 5;
    if (normalizeSearchText(match.title).includes(term)) return score + 12;
    if (normalizeSearchText(match.detail).includes(term)) return score + 8;
    if (match.searchText.includes(query)) return score + 4;
    return score + 2;
  }, learnedBoost);
}

function findTopicMatches(query) {
  const normalizedQuery = normalizeSearchText(query);
  const terms = searchTerms(query);
  if (!normalizedQuery || terms.length === 0) return [];

  return buildTopicSearchCatalog()
    .map((match) => ({
      ...match,
      score: topicMatchScore(match, terms, normalizedQuery)
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.canonical) - Number(a.canonical) || a.title.localeCompare(b.title))
    .slice(0, 8);
}

function renderTopicSearchResults() {
  const query = topicSearchInput.value.trim();
  topicSearchMatches = findTopicMatches(query);

  if (!query) {
    topicSearchResults.innerHTML = "<p>Search by what you plan to inspect. Click a suggestion to select the discipline, topic, and suggested inspection question.</p>";
    return;
  }

  if (!topicSearchMatches.length) {
    const regulationSearchUrl = `dafman-search.html?q=${encodeURIComponent(query)}`;
    topicSearchResults.innerHTML = `
      <p>No matches yet. Try another term like <strong>storage</strong>, <strong>ladder</strong>, <strong>forklift</strong>, <strong>eyewash</strong>, or <strong>paint</strong>.</p>
      <a class="secondary-button topic-regulation-link" href="${escapeHtml(regulationSearchUrl)}">Search DAFMAN 91-203 for "${escapeHtml(query)}"</a>
    `;
    return;
  }

  topicSearchResults.innerHTML = topicSearchMatches.map((match, index) => `
    <article class="topic-result-card">
      <button class="topic-result" data-topic-index="${index}" type="button">
        <strong>${match.learned ? '<span class="learned-topic-label">Learned</span> ' : ""}${escapeHtml(match.title)}</strong>
        <span>${escapeHtml(match.detail)}</span>
        <small>${escapeHtml(match.responsibleDiscipline)}</small>
      </button>
      ${match.learned ? `<button class="topic-unlearn" data-topic-term="${escapeHtml(match.term)}" type="button">Unlearn</button>` : ""}
    </article>
  `).join("");
}

function applyTopicSearchMatch(match) {
  const record = getRecordFromForm();
  record.responsibleDiscipline = match.responsibleDiscipline;
  record.assessmentArea = match.assessmentArea;
  record.assessmentItem = match.assessmentItem;
  record.inspectionFocus = match.inspectionFocus;
  renderRecord(record);
  topicSearchResults.innerHTML = `
    <p><strong>Selected:</strong> ${escapeHtml(match.title)}. The discipline, topic, and suggested inspection question were filled automatically.</p>
  `;
  saveRecord();
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
    assessmentItemInput.innerHTML = '<option value="">Select inspection topic</option>';
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
  const focusKey = inspectionFocusKeyForAssessmentItem(record.assessmentItem || "");
  const focusOptions = inspectionFocusByAssessmentItem[focusKey] || [];
  const showInspectionFocus = focusOptions.length > 0;

  if (activeInspectionFocusKey !== record.assessmentItem) {
    const selectedValue = record.inspectionFocus || "";
    inspectionFocusInput.innerHTML = showInspectionFocus
      ? '<option value="">Select a possible inspection focus</option>'
      : '<option value="">Select an inspection topic first</option>';
    focusOptions.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      inspectionFocusInput.appendChild(option);
    });
    inspectionFocusInput.value = focusOptions.includes(selectedValue) ? selectedValue : "";
    record.inspectionFocus = inspectionFocusInput.value;
    activeInspectionFocusKey = record.assessmentItem || "";
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
        <dt>Inspection Topic</dt><dd>${display(record.assessmentItem)}</dd>
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
    `Inspection Topic: ${record.assessmentItem || "Not documented"}`,
    `Suggested Inspection Question: ${record.inspectionFocus || "Not documented"}`,
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

topicSearchInput.addEventListener("input", renderTopicSearchResults);

topicSearchResults.addEventListener("click", (event) => {
  const unlearnButton = event.target.closest("[data-topic-term]");
  if (unlearnButton) {
    unlearnTopicSearchTerm(unlearnButton.dataset.topicTerm || "");
    return;
  }

  const button = event.target.closest("[data-topic-index]");
  if (!button) return;

  const match = topicSearchMatches[Number(button.dataset.topicIndex)];
  if (!match) return;
  applyTopicSearchMatch(match);
});

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
