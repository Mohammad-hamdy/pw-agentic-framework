# Test Plan — Osool Login (with localization)

- **Story reference:** inline — "Apply the framework on the Osool login page for all
  scenarios including localization."
- **App under test:** https://test.osool.cloud/login (`test` environment)
- **Explored:** 2026-07-09 via Playwright MCP (live DOM evidence captured below).

## Summary
The Osool login page authenticates a user by email + password. On success the app
redirects to `/workspace/projects`. On failure it renders an inline error in
`#loginMessage`. The UI is bilingual (Arabic default, English) switched via the
server route `/language/{en|ar}`; the framework's `LANGUAGE` env selects both the
app language (navigation) and the asserted locale strings.

## Acceptance criteria
- **AC1** — A user with valid credentials is authenticated and lands on the
  workspace (`/workspace/projects`).
- **AC2** — A user with invalid credentials stays on `/login` and sees a localized
  error message.
- **AC3** — Submitting with an empty (required) email is blocked by field
  validation; the user stays on `/login`.
- **AC4** — The login page renders all user-facing strings in the active language
  (English and Arabic), and exposes a switch to the other language.

## Evidence (live DOM)
| Element | Selector (proposed) | Evidence |
|---|---|---|
| Email input | `#email` | `input#email[name=email][type=email]`, `required=true`, placeholder = email label |
| Password input | `#password-field` | `input#password-field[name=password][type=password]` |
| Login button | `button.signIn-createBtn` | `button[type=submit]` text "تسجيل الدخول"/"Log In"; **`button[type=submit]` alone is NOT unique** — a hidden OTP "Verify" submit button also matches |
| Error message | `#loginMessage` | `div#loginMessage.text-danger`; observed EN "These credentials do not match our records.", AR "هذا البريد الالكتروني لا يطابق سجلاتنا" |
| Forgot password | `a[href*="/password/reset"]` | text "Forgot password?"/"هل نسيت كلمة السر ؟" |
| Language switch | `a[href*="/language/"]` | EN page → text "عربي" href `/language/ar`; AR page → text "English" href `/language/en` |
| Success signal | URL `/workspace/projects` | valid superadmin login redirected there (no OTP for this account) |

> Note: an `#otpVerificationModal` exists in the DOM (Resend OTP / Verify). It did
> NOT trigger for the superadmin account during exploration, so success is asserted
> by the workspace redirect. If OTP is later enabled for a test account this plan
> must be revisited.

## Localized strings (captured live)
| key | en | ar |
|---|---|---|
| title | Osool | أصول |
| emailLabel | Email Address | البريد الإلكتروني |
| passwordLabel | Password | كلمة السر |
| submitButton | Log In | تسجيل الدخول |
| invalidCredentials | These credentials do not match our records. | هذا البريد الالكتروني لا يطابق سجلاتنا |
| forgotPassword | Forgot password? | هل نسيت كلمة السر ؟ |
| otherLanguageLink | عربي | English |

## Test scenarios

### [OSOOL-LOGIN-01] validate that a user can log in with valid credentials — VERIFIED
- **Tags:** `@smoke @login @p0`
- **Data:** valid superadmin (email from test data, password from `SUPERADMIN_PASSWORD` env).
- **Steps:** open login in active language → enter email → enter password → click Log In.
- **Expected:** URL becomes `/workspace/projects`.

### [OSOOL-LOGIN-02] validate that login fails with invalid credentials — VERIFIED
- **Tags:** `@regression @login @p1`
- **Data:** invalid user (`wrong@osool.sa` / `WrongPass123`).
- **Steps:** open login → enter invalid email/password → click Log In.
- **Expected:** stays on `/login`; `#loginMessage` shows `login.invalidCredentials`
  for the active language.

### [OSOOL-LOGIN-03] validate that an empty email blocks submission — VERIFIED
- **Tags:** `@regression @login @p2`
- **Steps:** open login → click Log In without filling fields.
- **Expected:** stays on `/login`; the email field reports HTML5 invalid state
  (`validity.valid === false`).

### [OSOOL-LOGIN-04] validate that the login page renders in the active language — VERIFIED
- **Tags:** `@regression @login @ui`
- **Steps:** open login in active language.
- **Expected:** submit button text = `login.submitButton`; email placeholder =
  `login.emailLabel`; forgot-password link = `login.forgotPassword`; language switch
  link = `login.otherLanguageLink`.

All four scenarios are parameterized by the `LANGUAGE` env and executed in **both**
`en` and `ar`.

## Proposed Page Object
`pages/LoginPage.ts` — `open(baseUrl, language)` (navigates `/language/{lang}` then
`/login`), `enterEmail`, `enterPassword`, `clickOnLoginButton`, `login(email,password)`
composite, and validation getters (`getErrorMessageText`, `isEmailFieldValid`,
`getSubmitButtonText`, `getEmailPlaceholder`, `getForgotPasswordText`,
`getLanguageSwitchText`, `waitForWorkspace`). All actions via `WebUtil`.

## Open questions for QA
1. OTP: under what condition does `#otpVerificationModal` trigger? If it can fire for
   the automation account, OSOOL-LOGIN-01 needs an OTP-handling strategy (fixed test
   OTP or bypass).
2. AC2 wording: the AR message references the email ("this email…") while EN
   references credentials — confirm this is intended copy, not a localization bug.
