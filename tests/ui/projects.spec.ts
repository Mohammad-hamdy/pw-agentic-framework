import { Page } from '@playwright/test';
import { test, expect } from '@utils/fixtures/test-fixtures';
import LoginPage from '@pages/LoginPage';
import ProjectsPage from '@pages/ProjectsPage';
import configModule from '@config/config';
import { TAGS } from '@utils/tags/tags';

const { getLocale, getTestData, config } = configModule;

/**
 * Osool "Add New Project" suite. Runs against https://test.osool.cloud
 * (config BASE_URL). The LANGUAGE env selects both the app UI language and the
 * asserted locale strings, so the whole suite is executed once per language
 * (en, ar).
 *
 * Plan: specs-plans/osool-add-project.plan.md
 */
const baseUrl = config.baseUrl as string;
const language = config.language;

test.describe(`Osool Add New Project [${language}]`, () => {
  const projects = getLocale('projects');
  const { validUser, newProject } = getTestData;

  // Logs in as superadmin in the active language and lands on the projects list.
  async function loginToProjects(page: Page): Promise<ProjectsPage> {
    const loginPage = new LoginPage(page);
    await loginPage.open(baseUrl, language);
    await loginPage.login(validUser.email, validUser.password);
    await loginPage.waitForWorkspace();
    return new ProjectsPage(page);
  }

  test(
    '[OSOOL-PROJ-01] validate that superadmin login lands on the projects page with a visible create entry point',
    { tag: [TAGS.smoke, TAGS.ui, TAGS.p0, TAGS.projects] },
    async ({ page }) => {
      const projectsPage = await loginToProjects(page);

      expect(page.url()).toContain('/workspace/projects');
      expect(await projectsPage.getPageTitleText()).toBe(projects.projectsListTitle);
      expect(await projectsPage.isCreateNewProjectVisible()).toBe(true);
    }
  );

  test(
    '[OSOOL-PROJ-02] validate that a superadmin can create a new project with valid required data',
    { tag: [TAGS.smoke, TAGS.ui, TAGS.p0, TAGS.projects] },
    async ({ page }) => {
      const projectsPage = await loginToProjects(page);
      const englishName = newProject.generateEnglishName();
      const arabicName = newProject.generateArabicName();
      // The list shows the EN name in the EN UI and the AR name in the AR UI.
      const expectedName = language === 'ar' ? arabicName : englishName;

      const createProjectPage = await projectsPage.clickOnCreateNewProjectButton();
      expect(page.url()).toContain('/workspace/create-project');
      expect(await createProjectPage.getPageTitleText()).toBe(projects.createPageTitle);

      await createProjectPage.fillProjectDetails(englishName, arabicName, newProject.industryValue);
      const assignAdminsSection = await createProjectPage.clickOnSaveAndSubmitButton();

      // Admin selection is optional — submit with none selected (verified).
      const projectCreatedSection = await assignAdminsSection.clickOnSaveAndSubmitButton();

      expect(page.url()).toContain('/workspace/save-project');
      expect(await projectCreatedSection.getSuccessMessageText()).toBe(
        `${projects.successCreatedPrefix} ${expectedName} ${projects.successCreatedSuffix}`
      );
      expect(await projectCreatedSection.isGoToProjectsListVisible()).toBe(true);

      // Cleanup: delete the project this test created.
      const projectsListPage = await projectCreatedSection.clickOnGoToProjectsListButton();
      await projectsListPage.searchForProject(expectedName);
      expect(await projectsListPage.isProjectListed(expectedName)).toBe(true);

      const editProjectPage = await projectsListPage.clickOnEditProjectForName(expectedName);
      const { toastText, projectsPage: cleanedUpProjectsPage } = await editProjectPage.deleteProject();
      expect(toastText).toBe(projects.deletedToast);

      await cleanedUpProjectsPage.searchForProject(expectedName);
      expect(await cleanedUpProjectsPage.isProjectListed(expectedName)).toBe(false);
    }
  );

  test(
    '[OSOOL-PROJ-03] validate that submitting the create form with all required fields empty blocks creation',
    { tag: [TAGS.regression, TAGS.ui, TAGS.p1, TAGS.projects] },
    async ({ page }) => {
      const projectsPage = await loginToProjects(page);
      const createProjectPage = await projectsPage.clickOnCreateNewProjectButton();

      await createProjectPage.clickOnSaveAndSubmitButton();

      expect(page.url()).toContain('/workspace/create-project');
      expect.soft(await createProjectPage.getEnglishNameErrorText()).toBe(projects.requiredField);
      expect.soft(await createProjectPage.getArabicNameErrorText()).toBe(projects.requiredField);
      expect.soft(await createProjectPage.getIndustryErrorText()).toBe(projects.requiredField);
      expect.soft(await createProjectPage.isEnglishNameInvalid()).toBe(true);
      expect.soft(await createProjectPage.isArabicNameInvalid()).toBe(true);
    }
  );

  test(
    '[OSOOL-PROJ-04] validate that filling only the English name still blocks creation on the remaining required fields',
    { tag: [TAGS.regression, TAGS.ui, TAGS.p2, TAGS.projects] },
    async ({ page }) => {
      const projectsPage = await loginToProjects(page);
      const createProjectPage = await projectsPage.clickOnCreateNewProjectButton();

      await createProjectPage.enterEnglishName(newProject.generateEnglishName());
      await createProjectPage.clickOnSaveAndSubmitButton();

      expect(page.url()).toContain('/workspace/create-project');
      expect.soft(await createProjectPage.getEnglishNameErrorText()).toBe('');
      expect.soft(await createProjectPage.getArabicNameErrorText()).toBe(projects.requiredField);
      expect.soft(await createProjectPage.getIndustryErrorText()).toBe(projects.requiredField);
    }
  );

  test(
    '[OSOOL-PROJ-05] validate that the create-project form renders in the active language',
    { tag: [TAGS.regression, TAGS.ui, TAGS.p2, TAGS.projects] },
    async ({ page }) => {
      const projectsPage = await loginToProjects(page);
      const createProjectPage = await projectsPage.clickOnCreateNewProjectButton();

      expect.soft(await createProjectPage.getPageTitleText()).toBe(projects.createPageTitle);
      expect.soft(await createProjectPage.getStep1Text()).toContain(projects.step1);
      expect.soft(await createProjectPage.getStep2Text()).toContain(projects.step2);
      expect.soft(await createProjectPage.getStep3Text()).toContain(projects.step3);
      expect.soft(await createProjectPage.getEnglishNameLabelText()).toBe(projects.nameEnLabel);
      expect.soft(await createProjectPage.getArabicNameLabelText()).toBe(projects.nameArLabel);
      expect.soft(await createProjectPage.getIndustryLabelText()).toBe(projects.industryLabel);
      expect.soft(await createProjectPage.getSaveAndSubmitButtonText()).toBe(projects.saveAndSubmit);
      expect.soft(await createProjectPage.getCancelButtonText()).toBe(projects.cancel);

      const expectedDir = language === 'ar' ? 'rtl' : 'ltr';
      expect(await createProjectPage.getHtmlDir()).toBe(expectedDir);
    }
  );

  test(
    '[OSOOL-PROJ-06] validate that a created project can be deleted from the edit page',
    { tag: [TAGS.regression, TAGS.ui, TAGS.p1, TAGS.projects] },
    async ({ page }) => {
      const projectsPage = await loginToProjects(page);
      const englishName = newProject.generateEnglishName();
      const arabicName = newProject.generateArabicName();
      const expectedName = language === 'ar' ? arabicName : englishName;

      // Create its own throwaway project first.
      const createProjectPage = await projectsPage.clickOnCreateNewProjectButton();
      await createProjectPage.fillProjectDetails(englishName, arabicName, newProject.industryValue);
      const assignAdminsSection = await createProjectPage.clickOnSaveAndSubmitButton();
      const projectCreatedSection = await assignAdminsSection.clickOnSaveAndSubmitButton();

      const projectsListPage = await projectCreatedSection.clickOnGoToProjectsListButton();
      await projectsListPage.searchForProject(expectedName);
      const editProjectPage = await projectsListPage.clickOnEditProjectForName(expectedName);

      expect(await editProjectPage.getDeleteButtonText()).toBe(projects.deleteProjectBtn);

      await editProjectPage.clickOnDeleteProjectButton();
      expect.soft(await editProjectPage.getConfirmTitleText()).toBe(projects.deleteConfirmTitle);
      expect.soft(await editProjectPage.getConfirmBodyText()).toBe(projects.deleteConfirmText);

      await editProjectPage.clickOnConfirmDeleteButton();
      expect(await editProjectPage.getDeletedToastText()).toBe(projects.deletedToast);
      await editProjectPage.waitForProjectsRedirect();

      const finalProjectsPage = new ProjectsPage(page);
      await finalProjectsPage.searchForProject(expectedName);
      expect(await finalProjectsPage.isProjectListed(expectedName)).toBe(false);
    }
  );
});
