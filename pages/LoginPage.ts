import { Page, Locator } from '@playwright/test';
import { WebUtil } from '@pages/action-healing/web-util';

/**
 * Page Object for the Osool login page (https://test.osool.cloud/login).
 *
 * Follows the mandatory POM member order: web elements → constructor → fills →
 * clicks → validations. Every action routes through WebUtil.
 *
 * Locators use ids / stable CSS because the page exposes no data-testid.
 * NOTE: the login button is scoped by its `signIn-createBtn` class — a plain
 * `button[type="submit"]` also matches a hidden OTP "Verify" button.
 */
class LoginPage {
  private page: Page;
  private webUtil: WebUtil;

  // Web elements
  private emailTextField: Locator;
  private passwordTextField: Locator;
  private loginButton: Locator;
  private errorMessageLabel: Locator;
  private forgotPasswordLink: Locator;
  private languageSwitchLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.webUtil = new WebUtil(page);
    this.emailTextField = page.locator('#email');
    this.passwordTextField = page.locator('#password-field');
    this.loginButton = page.locator('button.signIn-createBtn');
    this.errorMessageLabel = page.locator('#loginMessage');
    this.forgotPasswordLink = page.locator('a[href*="/password/reset"]');
    this.languageSwitchLink = page.locator('a[href*="/language/"]');
  }

  // Navigation (composite step: sets the app language, then opens the login page)
  async open(baseUrl: string, language: string): Promise<void> {
    await this.webUtil.goto(`${baseUrl}/language/${language}`);
    await this.webUtil.goto(`${baseUrl}/login`);
    // Wait until the form is interactive so parallel runs don't act too early.
    await this.emailTextField.waitFor({ state: 'visible' });
  }

  // Fill methods
  async enterEmail(email: string): Promise<void> {
    await this.webUtil.fill(this.emailTextField, email);
  }

  async enterPassword(password: string): Promise<void> {
    await this.webUtil.fill(this.passwordTextField, password);
  }

  // Click methods
  async clickOnLoginButton(): Promise<void> {
    await this.webUtil.click(this.loginButton);
  }

  // Composite step (allowed to take more than one parameter)
  async login(email: string, password: string): Promise<void> {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickOnLoginButton();
  }

  // Validation methods
  async waitForWorkspace(): Promise<void> {
    await this.webUtil.waitForUri('/workspace/projects');
  }

  // Exposed for web-first assertions: the message shows a transient
  // "Verifying credentials..." status before settling to the final text.
  getErrorMessage(): Locator {
    return this.errorMessageLabel;
  }

  async getErrorMessageText(): Promise<string> {
    return this.webUtil.getText(this.errorMessageLabel);
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return this.webUtil.isVisible(this.errorMessageLabel);
  }

  async isEmailFieldValid(): Promise<boolean> {
    return this.emailTextField.evaluate(
      (element: HTMLInputElement) => element.validity.valid
    );
  }

  async getEmailPlaceholder(): Promise<string> {
    return (await this.webUtil.getAttribute(this.emailTextField, 'placeholder')) || '';
  }

  async getSubmitButtonText(): Promise<string> {
    return this.webUtil.getText(this.loginButton);
  }

  async getForgotPasswordText(): Promise<string> {
    return this.webUtil.getText(this.forgotPasswordLink);
  }

  async getLanguageSwitchText(): Promise<string> {
    return this.webUtil.getText(this.languageSwitchLink);
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}

export default LoginPage;
