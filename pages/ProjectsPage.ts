import { Page, Locator } from '@playwright/test';
import { WebUtil } from '@pages/action-healing/web-util';
import CreateProjectPage from '@pages/CreateProjectPage';
import EditProjectPage from '@pages/EditProjectPage';

/**
 * Page Object for the Osool projects list page
 * (https://test.osool.cloud/workspace/projects).
 *
 * Follows the mandatory POM member order: web elements → constructor →
 * navigation → fills → clicks → validations. Every action routes through
 * WebUtil.
 *
 * The project card locator works around a duplicate-DOM-id quirk documented in
 * specs-plans/osool-add-project.plan.md: the visible project name lives in a
 * `<b data-toggle="tooltip">` deep inside the card, so the Edit Project link is
 * reached by climbing to the nearest ancestor that carries both the `users-list`
 * and `media` classes (the actual per-card wrapper — verified live).
 */
class ProjectsPage {
  private page: Page;
  private webUtil: WebUtil;

  // Web elements
  private pageTitleLabel: Locator;
  private createNewProjectLink: Locator;
  private searchTextField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.webUtil = new WebUtil(page);
    this.pageTitleLabel = page.locator('.breadcrumb-title');
    this.createNewProjectLink = page.locator('a[href*="/workspace/create-project"]');
    this.searchTextField = page.locator('#search');
  }

  // Navigation (composite step: sets the app language, then opens the projects list)
  async open(baseUrl: string, language: string): Promise<void> {
    // baseUrl is the app origin (config.baseUrl normalizes BASE_URL to one).
    // 'commit' on the language hop skips the slow landing-page render it
    // redirects to — the cookie is set by the server response itself.
    await this.webUtil.goto(`${baseUrl}/language/${language}`, 'commit');
    await this.webUtil.goto(`${baseUrl}/workspace/projects`);
    await this.pageTitleLabel.waitFor({ state: 'visible' });
  }

  // Fill methods
  // Search is keyup-driven — WebUtil.type sends real key events (fill() would
  // not trigger the AJAX list refresh). Waits briefly for the matching card to
  // settle so callers can immediately read isProjectListed().
  async searchForProject(name: string): Promise<void> {
    await this.webUtil.type(this.searchTextField, name);
    await this.getProjectCard(name)
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => undefined);
  }

  // Click methods
  async clickOnCreateNewProjectButton(): Promise<CreateProjectPage> {
    await this.webUtil.click(this.createNewProjectLink);
    return new CreateProjectPage(this.page);
  }

  async clickOnEditProjectForName(name: string): Promise<EditProjectPage> {
    const editProjectLink = this.getProjectCard(name).locator('a[href*="edit-project"]');
    await this.webUtil.click(editProjectLink);
    return new EditProjectPage(this.page);
  }

  // Validation methods
  async isCreateNewProjectVisible(): Promise<boolean> {
    return this.webUtil.isVisible(this.createNewProjectLink);
  }

  async getPageTitleText(): Promise<string> {
    return this.webUtil.getText(this.pageTitleLabel);
  }

  async isProjectListed(name: string): Promise<boolean> {
    return this.getProjectCard(name).first().isVisible();
  }

  // Locates the project card by its exact visible name. The name shown is the
  // EN name in the EN UI and the AR name in the AR UI (verified).
  private getProjectCard(name: string): Locator {
    return this.page
      .locator('b[data-toggle="tooltip"]')
      .filter({ hasText: this.exactNamePattern(name) })
      .locator(
        "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' users-list ') and contains(concat(' ', normalize-space(@class), ' '), ' media ')][1]"
      );
  }

  private exactNamePattern(name: string): RegExp {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${escaped}$`);
  }
}

export default ProjectsPage;
