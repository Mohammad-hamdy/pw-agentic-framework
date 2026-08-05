import { Page, Locator } from '@playwright/test';
import { WebUtil } from '@pages/action-healing/web-util';
import ProjectsPage from '@pages/ProjectsPage';

/**
 * Page Object for the Edit Project page
 * (https://test.osool.cloud/workspace/edit-project/<encrypted-id>) and its
 * delete flow.
 *
 * Delete flow (verified live end-to-end): Delete Project button → SweetAlert
 * v1 confirm (`.sweet-alert`, NOT swal2 classes) → AJAX delete → toastr
 * "Successfully deleted" → redirect to `/workspace/projects` after ~2.6s.
 *
 * The confirm dialog's body `<p>` is scoped as a direct child of `.sweet-alert`
 * because SweetAlert v1 also renders a second, normally-hidden
 * `.sa-error-container p` ("Not valid!") in the same DOM (verified live) —
 * a plain `.sweet-alert p` locator would violate strict mode.
 */
class EditProjectPage {
  private page: Page;
  private webUtil: WebUtil;

  // Web elements
  private deleteProjectButton: Locator;
  private confirmDialog: Locator;
  private confirmTitleLabel: Locator;
  private confirmBodyLabel: Locator;
  private confirmButton: Locator;
  private cancelButton: Locator;
  private deletedToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.webUtil = new WebUtil(page);
    this.deleteProjectButton = page.locator('button.delete_project');
    this.confirmDialog = page.locator('.sweet-alert.showSweetAlert.visible');
    this.confirmTitleLabel = page.locator('.sweet-alert h2');
    this.confirmBodyLabel = page.locator('.sweet-alert > p');
    this.confirmButton = page.locator('.sweet-alert button.confirm');
    this.cancelButton = page.locator('.sweet-alert button.cancel');
    this.deletedToast = page.locator('.toast.toast-success');
  }

  // Click methods
  async clickOnDeleteProjectButton(): Promise<void> {
    await this.webUtil.click(this.deleteProjectButton);
    await this.confirmDialog.waitFor({ state: 'visible' });
  }

  async clickOnConfirmDeleteButton(): Promise<void> {
    await this.webUtil.click(this.confirmButton);
  }

  async clickOnCancelDeleteButton(): Promise<void> {
    await this.webUtil.click(this.cancelButton);
  }

  // Composite step used as the cleanup utility by the project-creation tests:
  // opens the confirm dialog, confirms deletion, reads the toast, then waits
  // for the redirect back to the projects list.
  async deleteProject(): Promise<{ toastText: string; projectsPage: ProjectsPage }> {
    await this.clickOnDeleteProjectButton();
    await this.clickOnConfirmDeleteButton();
    const toastText = await this.getDeletedToastText();
    await this.waitForProjectsRedirect();
    return { toastText, projectsPage: new ProjectsPage(this.page) };
  }

  // Validation methods
  async getDeleteButtonText(): Promise<string> {
    return this.webUtil.getText(this.deleteProjectButton);
  }

  async getConfirmTitleText(): Promise<string> {
    return this.webUtil.getText(this.confirmTitleLabel);
  }

  async getConfirmBodyText(): Promise<string> {
    return this.webUtil.getText(this.confirmBodyLabel);
  }

  async getDeletedToastText(): Promise<string> {
    await this.deletedToast.waitFor({ state: 'visible' });
    return this.webUtil.getText(this.deletedToast);
  }

  async waitForProjectsRedirect(): Promise<void> {
    await this.webUtil.waitForUri('/workspace/projects');
  }
}

export default EditProjectPage;
