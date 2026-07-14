import { Page, Locator, ElementHandle } from '@playwright/test';

/**
 * WebUtil is a centralized action-healing wrapper around Playwright's Page.
 *
 * Every Page Object must route clicks / fills / uploads / reads through this
 * class instead of calling page.* directly. It provides:
 *   - contextual step logging (the caller method name is derived from the stack)
 *   - loader / spinner handling after each action
 *   - network-idle and URL synchronization helpers
 *   - Locator-or-string flexibility so POMs can pass either
 *
 * Configure LOADER_SELECTOR for the application under test (the spinner/loader
 * that appears during async actions). Leave it as-is if the app has no global
 * loader — the waits become no-ops when the element is absent.
 */
export class WebUtil {
  private page: Page;
  private loaderSelector: string;

  constructor(page: Page) {
    this.page = page;
    // TODO: point this at the application's global loader/spinner selector.
    this.loaderSelector = '[data-testid="loader"], img[alt="loader"]';
  }

  async waitForLoaderToDisappear(): Promise<void> {
    const loader = this.page.locator(this.loaderSelector);
    if (await loader.first().isVisible().catch(() => false)) {
      await loader.first().waitFor({ state: 'hidden', timeout: 100_000 });
    }
  }

  async networkIsIDLE(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 300_000 });
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForLoaderToDisappear();
  }

  private formatFunctionName(callerName: string): string {
    return callerName
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .toLowerCase();
  }

  private getCallingMethodName(): string {
    const stack = new Error().stack?.split('\n') || [];
    const callerLine = stack[3] || '';
    const match = callerLine.match(/at\s(?:\w+\.)?(\w+)\s/);
    const rawName = match?.[1] || 'unknown';
    return this.formatFunctionName(rawName);
  }

  private resolve(selector: string | Locator): Locator {
    if (typeof selector !== 'string') {
      return selector;
    }
    const looksLikeSelector =
      selector.startsWith('#') ||
      selector.startsWith('.') ||
      selector.startsWith('//') ||
      selector.includes('[');
    return looksLikeSelector
      ? this.page.locator(selector)
      : this.page.locator(`text="${selector}"`);
  }

  async click(selector: string | Locator): Promise<void> {
    console.log(`click on ${this.getCallingMethodName()}`);
    await this.resolve(selector).first().click();
    await this.waitForLoaderToDisappear();
  }

  async fill(selector: string | Locator, value: string): Promise<void> {
    console.log(`fill ${this.getCallingMethodName()} with value: "${value}"`);
    await this.resolve(selector).fill(value);
    await this.waitForLoaderToDisappear();
  }

  async uploadFile(selector: string | Locator, fileName: string): Promise<void> {
    console.log(`upload ${this.getCallingMethodName()} with file: "${fileName}"`);
    await this.resolve(selector).setInputFiles(fileName);
    await this.waitForLoaderToDisappear();
  }

  async check(selector: string | Locator): Promise<void> {
    await this.resolve(selector).check();
    await this.waitForLoaderToDisappear();
  }

  async uncheck(selector: string | Locator): Promise<void> {
    await this.resolve(selector).uncheck();
    await this.waitForLoaderToDisappear();
  }

  async selectOption(
    selector: string | Locator,
    values: string | string[] | { label?: string; value?: string; index?: number }
  ): Promise<void> {
    await this.resolve(selector).selectOption(values);
    await this.waitForLoaderToDisappear();
  }

  async hover(selector: string | Locator): Promise<void> {
    await this.resolve(selector).hover();
    await this.waitForLoaderToDisappear();
  }

  async getText(selector: string | Locator): Promise<string> {
    const text = await this.resolve(selector).textContent();
    const result = text?.trim() || '';
    console.log(`getText ${this.getCallingMethodName()}: "${result}"`);
    return result;
  }

  async getInputValue(selector: string | Locator): Promise<string> {
    return this.resolve(selector).inputValue();
  }

  async getAttribute(selector: string | Locator, attribute: string): Promise<string | null> {
    return this.resolve(selector).getAttribute(attribute);
  }

  async isVisible(selector: string | Locator): Promise<boolean> {
    return this.resolve(selector).isVisible();
  }

  async isHidden(selector: string | Locator): Promise<boolean> {
    return this.resolve(selector).isHidden();
  }

  async waitForUri(uri: string, timeout = 60_000): Promise<void> {
    await this.page.waitForURL(new RegExp(uri), { timeout });
  }

  async scrollToElement(selector: string | Locator): Promise<void> {
    const elementHandle: ElementHandle<Element> | null = await this.resolve(selector)
      .first()
      .elementHandle();
    if (elementHandle) {
      await elementHandle.scrollIntoViewIfNeeded();
    } else {
      throw new Error(`Unable to find element for scrolling: ${selector}`);
    }
  }
}
