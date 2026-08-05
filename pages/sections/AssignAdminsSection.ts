import { Page, Locator } from '@playwright/test';
import { WebUtil } from '@pages/action-healing/web-util';
import ProjectCreatedSection from '@pages/sections/ProjectCreatedSection';

/**
 * Section object for wizard step 2 of project creation
 * (https://test.osool.cloud/workspace/admins-assignment,
 * form `#project_assigned_admins`, POST `/workspace/save-project`).
 *
 * Admin selection is optional — verified live: submitting with no admin
 * selected proceeds straight to step 3.
 */
class AssignAdminsSection {
  private page: Page;
  private webUtil: WebUtil;

  // Web elements
  private headerLabel: Locator;
  private adminsMultiSelect: Locator;
  private saveAndSubmitButton: Locator;
  private cancelLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.webUtil = new WebUtil(page);
    this.headerLabel = page.locator('.card-header');
    this.adminsMultiSelect = page.locator('#adminSelect');
    this.saveAndSubmitButton = page.locator('#project_assigned_admins button[type="submit"]');
    this.cancelLink = page.locator('#project_assigned_admins a.btn');
  }

  // Select methods
  async selectAdmin(name: string): Promise<void> {
    await this.webUtil.selectOption(this.adminsMultiSelect, { label: name });
  }

  // Click methods
  // Submitting POSTs to /workspace/save-project. Waits for that navigation to
  // land before handing back step 3 — without it a caller can assert on the URL
  // while the browser is still on admins-assignment (seen on WebKit under load).
  async clickOnSaveAndSubmitButton(): Promise<ProjectCreatedSection> {
    await this.webUtil.click(this.saveAndSubmitButton);
    await this.webUtil.waitForUri('/workspace/save-project');
    return new ProjectCreatedSection(this.page);
  }

  async clickOnCancelButton(): Promise<void> {
    await this.webUtil.click(this.cancelLink);
  }

  // Validation methods
  async getHeaderText(): Promise<string> {
    return this.webUtil.getText(this.headerLabel);
  }
}

export default AssignAdminsSection;
