# Spot Inspection Documentation

This project standardizes how spot inspections are documented from opening scope through report closeout.

## Process

1. Capture the unit, functional area, responsible discipline, inspection type tier 1, inspection type tier 2, date, time, inspector name, and inspector email address.
2. Document the area, equipment, processes, or procedures reviewed.
3. Record whether a hazard, risk, deficiency, unsafe work practice, or positive finding was identified.
4. If a finding exists, document the hazard/discrepancy, cause, corrective action, responsible person, and responsible contact.
5. Track follow-up due dates, 30-day follow-up actions, correction status, closure date, and closure verification until closure.
6. Capture supervisor review and follow-up updates.
7. Save completed spot inspections to the shared library, then filter archived inspections by unit.
8. Update 30-day follow-up actions from the shared library when returning to a saved inspection.
9. Print or copy the report preview for records management and closeout.

## Draft DAFI 91-202 Alignment

The form is shaped around the draft spot-inspection documentation elements in paragraph 9.6:

- Organization, unit, activity, or work area inspected
- Date and time of inspection
- Inspector name
- Description of areas, equipment, processes, or procedures reviewed
- Observations, including optional positive findings
- Hazards, deficiencies, or unsafe work practices
- Causes of deficiencies and hazards, as noted
- Recommendations or corrective action taken/planned
- Responsible person name and phone and/or email
- Follow-up actions documented through closure

## Use

Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8000
```

The form saves the current in-progress inspection in browser storage so the record survives refreshes on the same device.

Use **Save Completed** in the blue banner to add the current spot inspection to the shared completed inspections library. Use **Library** to open the standalone library page, filter saved inspections by unit, search records, preview reports, or delete records when authorized.

## Render Shared Library Setup

Deploy this repository as a Render Web Service.

- Build command: `npm install`
- Start command: `npm start`
- Runtime: Node 20

Set these Render environment variables:

- `GITHUB_TOKEN`: GitHub token with repository contents read/write access
- `GITHUB_OWNER`: GitHub owner, for example `jgrimm24`
- `GITHUB_REPO`: repository name for this spot inspection app
- `GITHUB_BRANCH`: usually `main`
- `GITHUB_LIBRARY_PATH`: folder where completed inspection JSON files are saved, default `Spot-Inspection-Library`
- `LIBRARY_DELETE_TOKEN`: optional delete code for removing records
- `RESEND_API_KEY`: optional Resend API key for save-confirmation emails
- `RESEND_FROM_EMAIL`: optional sender, for example `Spot Inspections <onboarding@resend.dev>`
- `PUBLIC_LIBRARY_URL`: optional public library page URL for confirmation emails

The service exposes:

- `POST /api/inspections` to save completed inspections
- `GET /api/inspections` to load the shared library
- `DELETE /api/inspections` to remove a saved inspection
