import { test as base, type Page } from '@playwright/test';
import type { ResolvedReturnType } from '../helpers/api-types';

export class RobotPage {
  constructor(private readonly page: Page) {}

  async ensureReady(): Promise<void> {
    if (!this.page.url().includes('localhost:5173')) {
      await this.page.goto('/');
      await this.page.waitForSelector('body[data-ready="true"]');
    }
  }

  async connect(): Promise<void> {
    await this.ensureReady();
    await this.page.click('[data-connect]');
    await this.page.waitForSelector(
      '[data-connection-status]:is(:text("Connected"))',
      { timeout: 10_000 }
    );
  }

  async connectInvalid(): Promise<void> {
    await this.ensureReady();
    await this.page.click('[data-connect-invalid]');
    await this.page.waitForSelector(
      '[data-connection-status]:is(:text("Disconnected"))'
    );
  }

  async disconnect(): Promise<void> {
    await this.page.click('[data-disconnect]');
    await this.page.waitForSelector(
      '[data-connection-status]:is(:text("Disconnected"))'
    );
  }

  async getConnectionStatus(): Promise<string> {
    const connectionStatusEl = this.page.locator('[data-connection-status]');
    const text = await connectionStatusEl.textContent();
    return text ?? 'Unknown';
  }

  async getDialingStatus(): Promise<string> {
    const dialingStatusEl = this.page.locator('[data-dialing-status]');
    const text = await dialingStatusEl.textContent();
    return text ?? '';
  }

  async waitForDialing(): Promise<void> {
    await this.page.waitForSelector('[data-dialing-status]:not(:empty)', {
      timeout: 10_000,
    });
  }

  async waitForDialingAttempt(first: boolean): Promise<void> {
    const locator = first
      ? this.page.locator('[data-dialing-status]:is(:text("Dial attempt 1"))')
      : this.page
          .locator('[data-dialing-status]')
          .filter({ hasText: /Dial attempt (?:[2-9]|[1-9]\d+)/u });
    await locator.waitFor({ timeout: 10_000 });
  }

  async getOutput<T, K extends keyof T>(): Promise<ResolvedReturnType<T[K]>> {
    // Wait for the output to be updated by checking for the data-has-output attribute
    await this.page.waitForSelector('[data-output][data-has-output="true"]', {
      timeout: 30_000,
    });
    const outputEl = this.page.locator('[data-output]');
    const text = await outputEl.textContent();
    return JSON.parse(text ?? '{}') as ResolvedReturnType<T[K]>;
  }

  async getResourceNames() {
    await this.page.click(`[data-robot-api="resourceNames"]`);
  }

  async getMachineStatus() {
    await this.page.click(`[data-robot-api="getMachineStatus"]`);
  }

  async getVersion() {
    await this.page.click(`[data-robot-api="getVersion"]`);
  }

  async getEndPosition() {
    await this.page.click(`[data-arm-api="getEndPosition"]`);
  }

  async getJointPositions() {
    await this.page.click(`[data-arm-api="getJointPositions"]`);
  }

  async moveToPosition() {
    await this.page.click(`[data-arm-api="moveToPosition"]`);
  }

  async getCameraProperties() {
    await this.page.click(`[data-camera-api="getProperties"]`);
  }

  async getCameraImages() {
    await this.page.click(`[data-camera-api="getImages"]`);
  }

  async getVisionProperties() {
    await this.page.click(`[data-vision-api="getProperties"]`);
  }

  async getVisionDetectionsFromCamera() {
    await this.page.click(`[data-vision-api="getDetectionsFromCamera"]`);
  }

  async captureAllFromCamera() {
    await this.page.click(`[data-vision-api="captureAllFromCamera"]`);
  }

  getPage(): Page {
    return this.page;
  }
}

export const withRobot = base.extend<{ robotPage: RobotPage }>({
  robotPage: async ({ page }, use) => {
    const robotPage = new RobotPage(page);
    await use(robotPage);
  },
});
