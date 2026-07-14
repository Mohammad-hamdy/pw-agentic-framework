# User Story: User Login

**ID:** DEMO-1
**As a** registered user
**I want to** log in with my username and password
**So that** I can access my account.

## Acceptance Criteria
- **AC1:** Given valid credentials, when I submit the login form, then a success
  message "Login successful" is shown.
- **AC2:** Given invalid credentials, when I submit the login form, then an error
  message "Invalid credentials" is shown and I remain on the login page.

## Notes
- The bundled worked example (`tests/ui/login.spec.ts`) already implements this
  story against the local fixture, so you can compare the generator's output to a
  known-good reference.
