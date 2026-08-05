import { Page, Locator } from '@playwright/test';
import { WebUtil } from '@pages/action-healing/web-util';
import AssignAdminsSection from '@pages/sections/AssignAdminsSection';

/**
 * Page Object for wizard step 1 of project creation
 * (https://test.osool.cloud/workspace/create-project, form `#project_create_form`).
 *
 * Duplicate-ID hazard (verified live, see specs-plans/osool-add-project.plan.md):
 * `#create_client_name` and `#create_client_industry` exist twice on this page —
 * once in the main form, once inside a hidden quick-create modal. Every field
 * locator below MUST stay scoped under `#project_create_form`.
 *
 * The name/industry `<label>` elements share a buggy `for="create_client_name"`
 * attribute on both the EN and AR labels, so they cannot be located via
 * `label[for=...]`. Verified live: each label is the immediate previous sibling
 * of its own field, so that structural relationship is used instead.
 *
 * `button.submit-project` sits outside the `<form>` element (verified) — it is
 * intentionally NOT scoped under `#project_create_form`.
 */
class CreateProjectPage {
  private page: Page;
  private webUtil: WebUtil;

  // Web elements
  private pageTitleLabel: Locator;
  private stepItems: Locator;
  private englishNameTextField: Locator;
  private arabicNameTextField: Locator;
  private englishNameLabel: Locator;
  private arabicNameLabel: Locator;
  private industryDropdown: Locator;
  private industryLabel: Locator;
  private englishNameErrorLabel: Locator;
  private arabicNameErrorLabel: Locator;
  private industryErrorLabel: Locator;
  private saveAndSubmitButton: Locator;
  private cancelLink: Locator;
  private htmlElement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.webUtil = new WebUtil(page);
    const form = page.locator('#project_create_form');

    this.pageTitleLabel = page.locator('.breadcrumb-title');
    this.stepItems = page.locator('.step');
    this.englishNameTextField = form.locator('#create_client_name');
    this.arabicNameTextField = form.locator('#create_client_name_ar');
    this.englishNameLabel = this.englishNameTextField.locator('xpath=preceding-sibling::label[1]');
    this.arabicNameLabel = this.arabicNameTextField.locator('xpath=preceding-sibling::label[1]');
    this.industryDropdown = form.locator('select[name="create_client_industry"]');
    this.industryLabel = this.industryDropdown.locator('xpath=preceding-sibling::label[1]');
    this.englishNameErrorLabel = form.locator('#create_client_name_error');
    this.arabicNameErrorLabel = form.locator('#create_client_name_ar_error');
    this.industryErrorLabel = form.locator('#create_client_industry_error');
    this.saveAndSubmitButton = page.locator('button.submit-project');
    this.cancelLink = page.locator('.button-group a.btn-light[href*="/workspace/projects"]');
    this.htmlElement = page.locator('html');
  }

  // Fill methods
  async enterEnglishName(name: string): Promise<void> {
    await this.webUtil.fill(this.englishNameTextField, name);
  }

  async enterArabicName(name: string): Promise<void> {
    await this.webUtil.fill(this.arabicNameTextField, name);
  }

  // Composite step (allowed to take more than one parameter): fills both names,
  // picks the industry, then gives the name-uniqueness AJAX checks (verified to
  // exist on both name fields) a moment to settle before the caller submits.
  async fillProjectDetails(englishName: string, arabicName: string, industryValue: string): Promise<void> {
    await this.enterEnglishName(englishName);
    await this.enterArabicName(arabicName);
    await this.selectClientIndustry(industryValue);
    await this.webUtil.wait(600);
  }

  // Click methods
  async clickOnSaveAndSubmitButton(): Promise<AssignAdminsSection> {
    await this.webUtil.click(this.saveAndSubmitButton);
    return new AssignAdminsSection(this.page);
  }

  async clickOnCancelButton(): Promise<void> {
    await this.webUtil.click(this.cancelLink);
  }

  // Select methods
  // select2 widget: selectOption on the underlying <select> fires the native
  // change event that select2/jQuery-validate listen to (verified working).
  async selectClientIndustry(value: string): Promise<void> {
    await this.webUtil.selectOption(this.industryDropdown, value);
  }

  // Validation methods
  async getPageTitleText(): Promise<string> {
    return this.webUtil.getText(this.pageTitleLabel);
  }

  async getStep1Text(): Promise<string> {
    return this.normalizeWhitespace(await this.webUtil.getText(this.stepItems.nth(0)));
  }

  async getStep2Text(): Promise<string> {
    return this.normalizeWhitespace(await this.webUtil.getText(this.stepItems.nth(1)));
  }

  async getStep3Text(): Promise<string> {
    return this.normalizeWhitespace(await this.webUtil.getText(this.stepItems.nth(2)));
  }

  async getEnglishNameLabelText(): Promise<string> {
    return this.normalizeWhitespace(await this.webUtil.getText(this.englishNameLabel));
  }

  async getArabicNameLabelText(): Promise<string> {
    return this.normalizeWhitespace(await this.webUtil.getText(this.arabicNameLabel));
  }

  async getIndustryLabelText(): Promise<string> {
    return this.normalizeWhitespace(await this.webUtil.getText(this.industryLabel));
  }

  async getSaveAndSubmitButtonText(): Promise<string> {
    return this.normalizeWhitespace(await this.webUtil.getText(this.saveAndSubmitButton));
  }

  async getCancelButtonText(): Promise<string> {
    return this.normalizeWhitespace(await this.webUtil.getText(this.cancelLink));
  }

  async getEnglishNameErrorText(): Promise<string> {
    return this.webUtil.getText(this.englishNameErrorLabel);
  }

  async getArabicNameErrorText(): Promise<string> {
    return this.webUtil.getText(this.arabicNameErrorLabel);
  }

  async getIndustryErrorText(): Promise<string> {
    return this.webUtil.getText(this.industryErrorLabel);
  }

  async isEnglishNameInvalid(): Promise<boolean> {
    return this.hasInvalidClass(this.englishNameTextField);
  }

  async isArabicNameInvalid(): Promise<boolean> {
    return this.hasInvalidClass(this.arabicNameTextField);
  }

  async getHtmlDir(): Promise<string> {
    return (await this.webUtil.getAttribute(this.htmlElement, 'dir')) || '';
  }

  private async hasInvalidClass(field: Locator): Promise<boolean> {
    const className = (await this.webUtil.getAttribute(field, 'class')) || '';
    return className.includes('is-invalid');
  }

  private normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}

export default CreateProjectPage;
