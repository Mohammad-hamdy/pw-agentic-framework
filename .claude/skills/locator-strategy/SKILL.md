---
name: locator-strategy
description: >-
  The locator priority and banned patterns for authoring reliable, localization-
  safe Playwright locators. Read this whenever proposing or writing a selector in
  a Page Object, and when the healer replaces a brittle locator.
---

# Locator strategy (priority order)

Choose the highest-priority strategy that works for the element.

### 1. `data-testid` / `data-test` (preferred)
Resilient to UI and text/localization changes.
```ts
const loginButton = page.getByTestId('login-button');
```
Ask the dev team to add `data-testid` attributes where they are missing.

### 2. CSS selectors
Fast, readable, less brittle than XPath.
```ts
page.locator('button[type="submit"]');
page.locator('#username');
page.locator('#RequestNumber + span');
```

### 3. Semantic XPath (only when CSS cannot express it)
Use for relative navigation or text content when no id/attribute exists.
```ts
page.locator('//label[@for="RequestNumber"]');
page.locator('//label[@for="RequestNumber"]/following-sibling::span');
```

### 4. Localized-text XPath (multi-language UIs)
Load the localized string first, then match on it.
```ts
const { requestNumberLabel } = getLocale('request');
page.locator(`//label[text()="${requestNumberLabel}"]`);
```

## Also good: role/label/text engines
Playwright's accessible locators are stable and encouraged:
```ts
page.getByRole('button', { name: 'Log in' });
page.getByLabel('Username');
```

## Banned — never generate these
- Absolute XPath: `/html/body/div[2]/main/div[3]/form/div[2]/span` ❌
- Deep positional chains: `//div[2]/div[4]/span[3]` ❌
- `nth-child()` unless the layout is provably stable ❌

## Resilience checklist
- Validate locators in both languages (en/ar) for localized UIs.
- Encapsulate every locator inside a Page Object — never inline in a test.
- Prefer one precise locator over chaining fragile ones.
