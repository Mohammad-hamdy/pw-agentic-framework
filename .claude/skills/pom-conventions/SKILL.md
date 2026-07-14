---
name: pom-conventions
description: >-
  The Page Object Model conventions, naming rules, WebUtil usage, tagging and
  clean-code standards every generated test must follow. Read this BEFORE writing
  or editing any Page Object, spec, locale, or test-data file in this framework.
---

# POM & coding conventions

## Mandatory POM class structure (in this order)
1. Sub-pages (e.g. `private header: HeaderSection`)
2. Web elements (`Locator` fields)
3. Variables
4. Constructor (instantiate `WebUtil`, assign locators)
5. Getters & setters
6. Fill methods (`enterUsername`, `enterPassword`)
7. Click methods (`clickOnLoginButton`)
8. Upload methods (`uploadImage`, `uploadPdf`)
9. Select methods (`selectCountryDropdown`)
10. Validation methods (`isLabelVisible`, `getSuccessMessageText`)

- One class per web page; sub-components go under `pages/sections/`.
- Navigation/login methods that lead to another page should **return the next
  Page Object** so tests chain naturally.
- See `pages/LoginPage.ts` for the canonical example.

## WebUtil is mandatory
- Every action goes through `WebUtil` (`pages/action-healing/web-util.ts`):
  `this.webUtil.click(...)`, `.fill(...)`, `.uploadFile(...)`, `.selectOption(...)`,
  `.getText(...)`, `.scrollToElement(...)`.
- ❌ Never call `page.click` / `page.fill` directly in a Page Object or test.
- WebUtil handles loader waits and step logging for you — do not add manual
  `waitForLoadState('networkidle')` in every method.

## Naming
| Type | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase | `LoginPage`, `CheckoutPage` |
| Test files | kebab-case | `login-test.spec.ts` |
| Variables / objects | camelCase | `userData`, `authEndpoints` |
| JSON test data keys | snake_case | `login_valid_credentials` |
| Web elements | camelCase + type suffix | `usernameTextField`, `loginButton`, `countryDropdown`, `termsCheckbox`, `forgotPasswordLink`, `profileIcon`, `usernameLabel` |
| Method params | camelCase | `enterUsername(username: string)` |

No abbreviations: `loginButton` not `logBTN`; `passwordTextField` not `pwdTF`.

## Test files
- Titles start with `validate that ...` and describe action + context.
- Prefix with the case/story id for traceability:
  `[SCRUM-123] validate that the user can login with valid credentials`.
- Never define locators inline in a test — always via Page Object getters/elements.
- Use tags from `utils/tags/tags.ts` (never hardcode `'@smoke'`).
- Assertions: hard `await expect(locator).toHaveText(...)`; soft `expect.soft(...)`
  when you want to collect multiple failures.

## Localization
- User-facing strings come from `locales/<lang>/<feature>.ts` via
  `getLocale('feature')`. Always provide an `en` file (the fallback); keep keys
  identical across languages; use `export default {}`.

## Clean code
- One responsibility per method; meaningful private method names.
- ≤ 1 parameter per method, except composite steps (e.g. `login(user, pass)`).
- No `console.log` in Page Objects (WebUtil already logs steps).
- Minimize duplication; prioritize reuse and scalability.

## API layer (when a story needs backend setup)
- `api/model/` — builder-pattern payloads (`LoginRequestBuilder`).
- `api/service/` — raw HTTP only (`AuthService`).
- `api/request-flow/` — high-level workflows tests call (`AuthFlow`).
