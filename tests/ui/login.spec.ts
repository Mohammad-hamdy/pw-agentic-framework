import { test, expect } from '@playwright/test';
import LoginPage from '@pages/LoginPage';
import configModule from '@config/config';
import { TAGS } from '@utils/tags/tags';

const { getLocale, getTestData, config } = configModule;

/**
 * Osool login suite. Runs against https://test.osool.cloud/login (config BASE_URL).
 * The LANGUAGE env selects both the app UI language and the asserted locale
 * strings, so the whole suite is executed once per language (en, ar).
 *
 * Plan: specs-plans/osool-login.plan.md
 */
const baseUrl = config.baseUrl as string;
const language = config.language;

test.describe(`Osool Login [${language}]`, () => {
  const login = getLocale('login');
  const { validUser, invalidUser } = getTestData;

  test(
    '[OSOOL-LOGIN-01] validate that a user can log in with valid credentials',
    { tag: [TAGS.smoke, TAGS.login, TAGS.p0] },
    async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.open(baseUrl, language);

      await loginPage.login(validUser.email, validUser.password);

      await loginPage.waitForWorkspace();
      expect(await loginPage.getCurrentUrl()).toContain('/workspace/projects');
    }
  );

  test(
    '[OSOOL-LOGIN-02] validate that login fails with invalid credentials',
    { tag: [TAGS.regression, TAGS.login, TAGS.p1] },
    async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.open(baseUrl, language);

      await loginPage.login(invalidUser.email, invalidUser.password);

      // The status field shows a transient "Verifying credentials..." message
      // first; web-first assertion auto-retries until it settles to the error.
      await expect(loginPage.getErrorMessage()).toHaveText(login.invalidCredentials);
      expect(await loginPage.getCurrentUrl()).toContain('/login');
    }
  );

  test(
    '[OSOOL-LOGIN-03] validate that an empty email blocks submission',
    { tag: [TAGS.regression, TAGS.login, TAGS.p2] },
    async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.open(baseUrl, language);

      await loginPage.clickOnLoginButton();

      expect(await loginPage.isEmailFieldValid()).toBe(false);
      expect(await loginPage.getCurrentUrl()).toContain('/login');
    }
  );

  test(
    '[OSOOL-LOGIN-04] validate that the login page renders in the active language',
    { tag: [TAGS.regression, TAGS.login, TAGS.ui] },
    async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.open(baseUrl, language);

      expect.soft(await loginPage.getSubmitButtonText()).toBe(login.submitButton);
      expect.soft(await loginPage.getEmailPlaceholder()).toBe(login.emailLabel);
      expect.soft(await loginPage.getForgotPasswordText()).toBe(login.forgotPassword);
      expect.soft(await loginPage.getLanguageSwitchText()).toBe(login.otherLanguageLink);
    }
  );
});
