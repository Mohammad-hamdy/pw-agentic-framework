# Test Plan — Osool Add New Project (with localization)

- **Story reference:** OSOOL-PROJ — "Superadmin creates a new project from the projects page."
- **App under test:** https://test.osool.cloud (`test` environment)
- **Explored:** 2026-08-01 via live headless-Chromium exploration (Playwright 1.61.1; MCP unavailable this session). All DOM evidence below was captured from the running app. Two throwaway projects (`QA-PLAN2-*`, `QA-PLAN-AR-*`) were created and **successfully deleted** during exploration.

## Summary
Project creation is a **3-step wizard**, not a single form:

1. **Project Information** — `/workspace/create-project` (entry point: visible "Create New Project" button on `/workspace/projects`). Required: EN name, AR name, industry (select2). Submitting posts to `/create-project` and redirects to step 2.
2. **Assigned Admins** — `/workspace/admins-assignment`. Admin selection is **optional** (verified: submitting with none selected proceeds). Posts to `/workspace/save-project`.
3. **Confirmation** — lands on URL `/workspace/save-project` showing the success heading "Project *name* has been Created" with "Go to Projects List" / "Enter Project" buttons. **This URL + heading is the success signal.** No toast is shown on creation.

Validation on step 1 is **jQuery-validate style inline errors** (the form has `novalidate`; HTML5 `validity.valid` stays `true`). Deletion exists: **Edit Project → "Delete Project" button → SweetAlert(v1) confirm → toastr "Successfully deleted" → redirect to `/workspace/projects`** — verified end-to-end and used as the cleanup step.

> **Duplicate-ID hazard (verified):** `#create_client_name` and `#create_client_industry` exist **twice** on the create page (once in the main form, once inside a hidden quick-create modal `#create_project_super_admin` / `#create_newproject`). Every field locator MUST be scoped under `#project_create_form`.

## Acceptance criteria
- **AC1** — Valid superadmin login lands on `/workspace/projects`. *(verified — reuses osool-login.plan.md evidence)*
- **AC2** — Projects page shows a visible, clickable "add new project" entry point. *(verified: `a[href*="/workspace/create-project"]`, text "Create New Project"/"إنشاء مشروع جديد")*
- **AC3** — Filling all required fields with valid data and submitting creates the project with an observable success signal. *(verified: wizard completes; success = URL `/workspace/save-project` + `h4.text-center` "Project <name> has been Created"; project then appears in the list — found via list search)*
- **AC4** — Submitting with required fields empty blocks creation with inline validation errors. *(verified: stays on `/workspace/create-project`; three inline "This field is required." errors; NOT HTML5 validation)*

## Evidence (live DOM)

### Projects page — `/workspace/projects`
| Element | Selector (proposed) | Evidence |
|---|---|---|
| Page title | `.breadcrumb-title` | `h4.text-capitalize.fw-500.breadcrumb-title` — EN "Projects List", AR "قائمة المشاريع" |
| Create New Project button | `a[href*="/workspace/create-project"]` | Unique (count 1), visible; `a.btn.btn-primary.btn-sm`, text "Create New Project"/"إنشاء مشروع جديد" |
| Search input | `#search` | `input#search.form-control` placeholder "Search by Name"/"البحث بالأسم". **Search is keyup-driven** — `fill()` does not trigger it; must type with key events (`pressSequentially`). List refreshes via AJAX `adminProjectsListAjax` |
| Project card name | `b[data-toggle="tooltip"]` filtered by text | `<b data-toggle="tooltip">` holds the project name. **The list shows the EN name in the EN UI and the AR name in the AR UI** (verified) |
| Edit Project link (per card) | card container → `a[href*="edit-project"]` | `a.btn.btn-outline-primary…` text "Edit Project"/"تحرير المشروع"; href contains an encrypted project id |
| Enter Project link (per card) | card container → `a[href*="/enter/"]` | text "Enter Project"/"الدخول للمشروع" |
| Hidden quick-create modal | `#create_project_super_admin` (avoid) | Hidden modal with duplicate `#create_client_name`/`#create_client_industry` — not the tested entry point; exists on both projects and create pages |

### Create project — step 1, `/workspace/create-project` (form `#project_create_form`, POST `/create-project`, `novalidate`)
All field selectors scoped: `#project_create_form <selector>`.

| Field | Required | Selector (scoped) | Evidence |
|---|---|---|---|
| Wizard steps rail | — | `.step` (3), current has `.step.current` | "1 Project Information", "2 Assigned Admins", "3 Confirmation" |
| Project image upload | optional | `#file_upload` (`input[type=file][name=profile_img].d-none`) | Hidden input triggered via `label[for="file_upload"]`; heading "Project Image"/"شعار المشروع" |
| Project name (English) | **required** | `#create_client_name` | `input[type=text][name=create_client_name]`; label "Enter Name [English] *". Uniqueness AJAX check exists (`/ajax/ajax_check_project_name_unique`) |
| Project name (Arabic) | **required** | `#create_client_name_ar` | `input[type=text][name=create_client_name_ar]`; label "Enter Name [Arabic] *" (label `for` mistakenly points to `create_client_name` — locate the input by id, not by label). AR uniqueness AJAX check exists |
| Client Industry | **required** | `select[name=create_client_industry]` (scoped) | select2-backed `<select>` (visually hidden, `aria-hidden`); label "Client Industry *". 12 options, values `1`–`12` (e.g. `4` = "Restaurants - مطاعم"). Automation: `selectOption` on the underlying select + dispatch `change` (verified working) |
| Use Osool Plus | optional | `#use_erp_module` | checkbox, label "Use Osool Plus (Plus Features/Modules)" |
| Enable User Actions Center | optional | `#enable_user_actions_center` | checkbox |
| Advanced KPI Mode | optional | `#advanced_kpi_mode` | checkbox (has an AJAX check URL `#advanced_kpi_mode_check_url`) |
| Use tenant app and Module | optional | `#use_tenent` | checkbox `name=usetenant`; checking it reveals hidden radio groups (`tenant_status`, `community_status`, `share_post`, `contract_status`) — not exercised |
| Activate CRM | disabled | `#use_crm_module` | checkbox with `disabled_checkbox pointer-events-none` — not interactable; hidden CRM sub-checkboxes exist |
| Save & Submit | — | `button.submit-project` | `button[type=submit].submit-project` text "Save & Submit"/"حفظ وإرسال"; sits **outside** the `<form>` element |
| Cancel | — | `.button-group a.btn-light[href*="/workspace/projects"]` | visible "Cancel"/"إلغاء" link back to the list (plain `a[href*="/workspace/projects"]` is NOT unique — nav sidebar matches too) |
| Inline error spans | — | `#create_client_name_error`, `#create_client_name_ar_error`, `#create_client_industry_error` | Empty spans that receive "This field is required." on invalid submit; jQuery-validate also injects `label.error.invalid-feedback` (`#create_client_name-error` etc.) and adds `is-invalid` class to inputs |

### Wizard step 2 — `/workspace/admins-assignment` (form `#project_assigned_admins`, POST `/workspace/save-project`)
| Element | Selector | Evidence |
|---|---|---|
| Section header | `.card-header` | "Assigned Admins"/"المشرفين المعينين" |
| Admins multiselect | `#adminSelect` | select2 `<select multiple>` of admin users; **optional** — submit with none selected proceeded to step 3 with no error (verified) |
| Save & Submit | `#project_assigned_admins button[type=submit]` | "Save & Submit"/"حفظ وإرسال" |
| Cancel | `#project_assigned_admins a.btn` | links back to `/workspace/create-project` |

### Wizard step 3 / success — URL `/workspace/save-project`
| Element | Selector | Evidence |
|---|---|---|
| Success heading | `h4.text-center` | `Project <span class="text_blue">QA-PLAN2-1785584415380</span> has been Created` — EN shows the **EN** name; AR: "المشروع <arabic-name> تم انشاءه" shows the **AR** name |
| Go to Projects List | `a[href$="/workspace/projects"].btn-outline-light` | visible |
| Enter Project | `a[href*="/workspace/enter/"].btn-primary` | visible, encrypted project id in href |
| Steps rail state | `.step.completed` ×2, `.step.current` = Confirmation | breadcrumb title on this page is "Create New Project" |

### Delete flow (cleanup) — Edit Project page (`/workspace/edit-project/<encrypted-id>`)
| Element | Selector | Evidence |
|---|---|---|
| Delete Project button | `button.delete_project` | `button.btn-outline-danger.delete_project[data-value="<numeric project id>"]`, text "Delete Project"; visible on edit page (verified) |
| Confirm dialog | `.sweet-alert` (SweetAlert **v1**: `.sweet-alert.showSweetAlert.visible`) | title (h2) "Are you sure you want to delete this project?", text (p) "Caution: deleting a project will remove all of its related data" |
| Confirm / Cancel | `.sweet-alert button.confirm` / `.sweet-alert button.cancel` | "Delete" / "Cancel" (NOT swal2 classes) |
| Success toast | `.toast.toast-success` (toastr, `toast-top-center`) | "Successfully deleted"/"تم الحذف بنجاح"; page then auto-redirects to `/workspace/projects` after ~2.6 s |
| Post-delete check | search list for name | project no longer found (verified in both runs) |

### Loaders / async waits the tests must handle
- Projects list and search results load via AJAX (`adminProjectsListAjax`); a spinner (`.atbd-spin-dots`) exists. Wait for the searched card to appear/disappear rather than fixed sleeps.
- `#search` requires real key events (WebUtil must type, not fill).
- Name-uniqueness AJAX fires on the name fields; allow it to settle before submit.
- Delete = swal confirm → AJAX GET `/workspace/delete-project/<id>` → toastr → ~2.6 s delayed redirect: wait for URL `/workspace/projects`.
- select2 widgets: interact through the underlying `<select>` + `change` event (verified reliable headless).

## Localized strings (captured live)
| key | en | ar |
|---|---|---|
| projectsListTitle | Projects List | قائمة المشاريع |
| createNewProject | Create New Project | إنشاء مشروع جديد |
| searchPlaceholder | Search by Name | البحث بالأسم |
| enterProject | Enter Project | الدخول للمشروع |
| editProject | Edit Project | تحرير المشروع |
| createPageTitle | Create New Project | إنشاء مشروع جديد |
| step1 | Project Information | معلومات المشروع |
| step2 | Assigned Admins | المشرفين المعينين |
| step3 | Confirmation | التأكيد |
| projectImage | Project Image | شعار المشروع |
| nameEnLabel | Enter Name [English] * | ادخل اسم المشروع [بالإنجليزي] * |
| nameArLabel | Enter Name [Arabic] * | ادخل اسم المشروع [بالعربي] * |
| industryLabel | Client Industry * | قطاع المشروع * |
| industryPlaceholder | Choose | اختر |
| saveAndSubmit | Save & Submit | حفظ وإرسال |
| cancel | Cancel | إلغاء |
| requiredField | This field is required. | هذا الحقل مطلوب |
| successCreatedPrefix | Project | المشروع |
| successCreatedSuffix | has been Created | تم انشاءه |
| goToProjectsList | Go to Projects List | الذهاب الى قائمة المشاريع |
| deleteProjectBtn | Delete Project | *(capture at generation — button text observed EN only; swal strings below confirmed AR)* |
| deleteConfirmTitle | Are you sure you want to delete this project? | هل أنت متأكد من أنك تود حذف هذا المشروع؟ |
| deleteConfirmText | Caution: deleting a project will remove all of its related data | تنبيه: حذف المشروع يقوم بحذف جميع البيانات المرتبطة به |
| deleteConfirmYes | Delete | حذف |
| deleteConfirmNo | Cancel | إلغاء |
| deletedToast | Successfully deleted | تم الحذف بنجاح |

Note (verified): EN success heading interpolates the **English** name; AR interpolates the **Arabic** name. Assert `successCreatedPrefix` + the language-appropriate name + `successCreatedSuffix`. Likewise, list search in AR matches the **Arabic** name.

## Test scenarios
All scenarios run in **both `en` and `ar`** (parameterized by `LANGUAGE`; navigation via `/language/{lang}`), reusing `LoginPage` for auth. Test data: name pattern `QA-AUTO-<timestamp>` (EN) / `مشروع-آلي-<timestamp>` (AR) to keep names unique (server enforces name uniqueness via AJAX) and recognizable for cleanup.

### [OSOOL-PROJ-01] validate that superadmin login lands on the projects page with a visible create entry point — VERIFIED
- **Tags:** `@smoke @ui @p0` *(+ proposed `@projects` — see open questions)*
- **Steps:** log in as superadmin in the active language → wait for `/workspace/projects`.
- **Expected:** URL is `/workspace/projects`; `.breadcrumb-title` = `projects.projectsListTitle`; `a[href*="/workspace/create-project"]` is visible and enabled with text `projects.createNewProject`.

### [OSOOL-PROJ-02] validate that a superadmin can create a new project with valid required data — VERIFIED
- **Tags:** `@smoke @ui @p0`
- **Data:** unique EN + AR names (timestamped), industry option value `4` (Restaurants).
- **Steps:** login → click Create New Project → (assert step-1 page: URL `/workspace/create-project`, title `createPageTitle`) → fill EN name → fill AR name → select industry → click Save & Submit → on `/workspace/admins-assignment` click Save & Submit (no admin selected — verified optional) → assert success → **cleanup: delete the created project** (search list → Edit Project → Delete Project → confirm swal → assert `deletedToast` → wait for `/workspace/projects` → search again and assert absent).
- **Expected (success signal):** URL becomes `/workspace/save-project`; `h4.text-center` text = `successCreatedPrefix` + created name (EN name in en, AR name in ar) + `successCreatedSuffix`; "Go to Projects List" and "Enter Project" buttons visible; after navigating to the list and searching (typed keystrokes), a card with the created name and an Edit Project link is present.

### [OSOOL-PROJ-03] validate that submitting the create form with all required fields empty blocks creation — VERIFIED
- **Tags:** `@regression @ui @p1`
- **Steps:** login → open `/workspace/create-project` → click Save & Submit with nothing filled.
- **Expected:** URL stays `/workspace/create-project`; `#create_client_name_error`, `#create_client_name_ar_error`, `#create_client_industry_error` each show `requiredField` ("This field is required."/"هذا الحقل مطلوب"); name inputs get class `is-invalid`. Mechanism is **inline jQuery-validate errors, not HTML5** (form is `novalidate`; `input.validity.valid` remains `true` — verified). No new project is created.

### [OSOOL-PROJ-04] validate that filling only the English name still blocks creation on the remaining required fields — VERIFIED
- **Tags:** `@regression @ui @p2`
- **Steps:** login → open create form → fill EN name only → Save & Submit.
- **Expected:** stays on `/workspace/create-project`; `#create_client_name_error` is empty/hidden, while `#create_client_name_ar_error` and `#create_client_industry_error` show `requiredField`.

### [OSOOL-PROJ-05] validate that the create-project form renders in the active language — VERIFIED
- **Tags:** `@regression @ui @p2`
- **Steps:** login → open create form in active language.
- **Expected:** page title = `createPageTitle`; wizard steps = `step1/step2/step3`; the two name labels = `nameEnLabel`/`nameArLabel`; industry label = `industryLabel`; submit button = `saveAndSubmit`; cancel = `cancel`; `<html dir>` is `rtl` in ar (verified) / `ltr` in en.

### [OSOOL-PROJ-06] validate that a created project can be deleted from the edit page (cleanup mechanism) — VERIFIED
- **Tags:** `@regression @ui @p1`
- **Data:** its own throwaway project (created via the OSOOL-PROJ-02 composite flow).
- **Steps:** create project → search it in the list → open its Edit Project link → click `button.delete_project` → assert swal title/text (`deleteConfirmTitle`/`deleteConfirmText`) → click `.sweet-alert button.confirm`.
- **Expected:** toastr `.toast-success` shows `deletedToast`; page redirects to `/workspace/projects` (~2.6 s); searching the name again yields no card.
- *(This scenario doubles as the cleanup utility; if it is not kept as a standalone test, its steps must still ship as the cleanup composite used by OSOOL-PROJ-02.)*

## Proposed Page Objects
Follow `pom-conventions` (elements → constructor → fills → clicks → uploads → selects → validations; all actions via `WebUtil`; strings via `getLocale('projects')`; reuse existing `pages/LoginPage.ts` for auth).

- **`pages/ProjectsPage.ts`** — elements: page title, create-new-project link, search input, project card by name, edit/enter links scoped to a card. Methods: `open(baseUrl, language)`, `searchForProject(name)` (**typed keystrokes**, then wait for card presence/absence), `clickOnCreateNewProjectButton`, `clickOnEditProjectForName(name)`, validations: `isCreateNewProjectVisible`, `getPageTitleText`, `isProjectListed(name)`.
- **`pages/CreateProjectPage.ts`** — step-1 form, all locators scoped under `#project_create_form`. Fills: `enterEnglishName`, `enterArabicName`; selects: `selectClientIndustry(value)` (underlying select + change event); clicks: `clickOnSaveAndSubmitButton` (`button.submit-project`), `clickOnCancelButton`; validations: `getEnglishNameErrorText`, `getArabicNameErrorText`, `getIndustryErrorText`, `getPageTitleText`, label getters for localization assertions.
- **`pages/sections/AssignAdminsSection.ts`** (step 2, under `pages/sections/`) — optional `selectAdmin(name)`, `clickOnSaveAndSubmitButton`, `getHeaderText`.
- **`pages/sections/ProjectCreatedSection.ts`** (step 3) — validations: `getSuccessMessageText`, `isGoToProjectsListVisible`; clicks: `clickOnGoToProjectsListButton`.
- **`pages/EditProjectPage.ts`** — click: `clickOnDeleteProjectButton`; section or inline: swal confirm (`getConfirmTitleText`, `getConfirmBodyText`, `clickOnConfirmDeleteButton`, `clickOnCancelDeleteButton`) and `getDeletedToastText`; composite `deleteProject()` used for cleanup.
- **Locales:** new `locales/en/projects.ts` + `locales/ar/projects.ts` with the table above (matching keys, `en` fallback).
- **Test data:** timestamped name factory in `test-data` (EN + AR variants); industry option value as data, not hardcoded in the PO.

## Open questions for QA
1. **Missing `projects` tag family** — `utils/tags/tags.ts` has no projects feature tag (only `login`, `search`, `checkout`). Proposal: add `projects: '@projects'` to the Feature section. Approve before generation; the generator must not invent it silently.
2. **Abandoned wizard leaves state?** A project submitted through step 1 only (wizard abandoned before step 2) does **not** appear in the projects list (verified by list search), but step 2's breadcrumb reads "Edit Project", hinting a server-side record may exist in draft state. One such orphan (`QA-PLAN-1785584107950`) may remain in the test DB — confirm whether drafts need DB cleanup.
3. **Duplicate DOM ids** (`#create_client_name`, `#create_client_industry` twice per page; both name labels `for="create_client_name"`) — flagging as an app-quality bug worth reporting; automation works around it by scoping to `#project_create_form`.
4. **Name-format rules unverified:** we did not probe whether the Arabic name field enforces Arabic script, max lengths, or the exact duplicate-name error message (uniqueness AJAX endpoints exist). If QA wants negative coverage here, a follow-up exploration is needed — currently ASSUMPTION_NEEDS_REVIEW, so no scenario was written.
5. **Optional toggles not exercised:** Osool Plus / User Actions Center / Advanced KPI / tenant radios (revealed when tenant is checked) and the disabled CRM checkbox were catalogued but not tested. Confirm they are out of scope for OSOOL-PROJ.
6. **Delete button AR label:** swal/toastr AR strings were captured from `window.translations`, but the "Delete Project" button text itself was only read in the EN UI. The generator should assert it after capturing it in ar (one-line check during generation).
7. **Cleanup dependency:** cleanup relies on the UI delete flow (verified working). If it ever fails mid-run, timestamped `QA-AUTO-*` projects may accumulate in the test environment; fallback is manual deletion via the same UI (no API endpoint was catalogued for teardown).

---
**Status:** ready for QA review. `pw-test-generator` must only run after this plan is approved.
