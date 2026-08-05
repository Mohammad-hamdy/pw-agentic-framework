import { Page, Locator } from '@playwright/test';
import { WebUtil } from '@pages/action-healing/web-util';
import ProjectsPage from '@pages/ProjectsPage';

/**
 * Section object for wizard step 3 / the creation success screen
 * (URL `/workspace/save-project`).
 *
 * This URL + the `h4.text-center` success heading is the verified success
 * signal — no toast is shown on creation. The EN heading interpolates the EN
 * project name; the AR heading interpolates the AR name (verified live).
 */
class ProjectCreatedSection {
  private page: Page;
  private webUtil: WebUtil;

  // Web elements
  private successHeading: Locator;
  private goToProjectsListLink: Locator;
  private enterProjectLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.webUtil = new WebUtil(page);
    this.successHeading = page.locator('h4.text-center');
    this.goToProjectsListLink = page.locator('a[href$="/workspace/projects"].btn-outline-light');
    this.enterProjectLink = page.locator('a[href*="/workspace/enter/"].btn-primary');
  }

  // Click methods
  async clickOnGoToProjectsListButton(): Promise<ProjectsPage> {
    await this.webUtil.click(this.goToProjectsListLink);
    return new ProjectsPage(this.page);
  }

  // Validation methods
  async getSuccessMessageText(): Promise<string> {
    const text = await this.webUtil.getText(this.successHeading);
    return text.replace(/\s+/g, ' ').trim();
  }

  async isGoToProjectsListVisible(): Promise<boolean> {
    return this.webUtil.isVisible(this.goToProjectsListLink);
  }

  async isEnterProjectVisible(): Promise<boolean> {
    return this.webUtil.isVisible(this.enterProjectLink);
  }
}

export default ProjectCreatedSection;
