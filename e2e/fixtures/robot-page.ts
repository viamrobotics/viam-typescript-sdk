import { test as base, type Page } from '@playwright/test';
import type { Robot, RobotClient } from '../../src/robot';
import type { ResolvedReturnType } from '../helpers/api-types';

export class RobotPage {
  private readonly connectionStatusID = 'connection-status';
  private readonly dialingStatusID = 'dialing-status';
  private readonly connectButtonID = 'connect-btn';
  private readonly disconnectButtonID = 'disconnect-btn';
  private readonly outputID = 'output';

  constructor(private readonly page: Page) {}

  async ensureReady(): Promise<void> {
    if (!this.page.url().includes('localhost:5173')) {
      await this.page.goto('/');
      await this.page.waitForSelector('body[data-ready="true"]');
    }
  }

  async connect(): Promise<void> {
    await this.ensureReady();
    await this.page.getByTestId(this.connectButtonID).click();
    await this.page.waitForSelector(
      `[data-testid="${this.connectionStatusID}"]:is(:text("Connected"))`
    );
  }

  async disconnect(): Promise<void> {
    await this.page.getByTestId(this.disconnectButtonID).click();
    await this.page.waitForSelector(
      `[data-testid="${this.connectionStatusID}"]:is(:text("Disconnected"))`
    );
  }

  async getConnectionStatus(): Promise<string> {
    const connectionStatusEl = this.page.getByTestId(this.connectionStatusID);
    const text = await connectionStatusEl.textContent();
    return text ?? 'Unknown';
  }

  async waitForDialing(): Promise<void> {
    await this.page.waitForSelector(
      `[data-testid="${this.dialingStatusID}"]:not(:empty)`,
      { timeout: 5000 }
    );
  }

  async waitForFirstDialingAttempt(): Promise<void> {
    await this.page.waitForFunction(
      (testId: string) => {
        const el = document.querySelector(`[data-testid="${testId}"]`);
        const text = el?.textContent ?? '';
        const match = text.match(/attempt (?<attemptNumber>\d+)/u);
        if (!match?.groups) {
          return false;
        }
        const attemptNumber = Number.parseInt(
          match.groups.attemptNumber ?? '0',
          10
        );
        return attemptNumber === 1;
      },
      this.dialingStatusID,
      { timeout: 10_000 }
    );
  }

  async waitForSubsequentDialingAttempts(): Promise<void> {
    await this.page.waitForFunction(
      (testId: string) => {
        const el = document.querySelector(`[data-testid="${testId}"]`);
        const text = el?.textContent ?? '';
        const match = text.match(/attempt (?<attemptNumber>\d+)/u);
        if (!match?.groups) {
          return false;
        }
        const attemptNumber = Number.parseInt(
          match.groups.attemptNumber ?? '0',
          10
        );
        return attemptNumber > 1;
      },
      this.dialingStatusID,
      { timeout: 10_000 }
    );
  }

  async getDialingStatus(): Promise<string> {
    const dialingStatusEl = this.page.getByTestId(this.dialingStatusID);
    const text = await dialingStatusEl.textContent();
    return text ?? '';
  }

  async getOutput<T extends Robot, K extends keyof T>(): Promise<
    ResolvedReturnType<T[K]>
  > {
    // Wait for the output to be updated by checking for the data-has-output attribute
    await this.page.waitForSelector(
      `[data-testid="${this.outputID}"][data-has-output="true"]`,
      { timeout: 30_000 }
    );
    const outputEl = this.page.getByTestId(this.outputID);
    const text = await outputEl.textContent();
    return JSON.parse(text ?? '{}') as ResolvedReturnType<T[K]>;
  }

  async clickButton(testId: string): Promise<void> {
    await this.page.click(`[data-testid="${testId}"]`);
  }

  async clickRobotAPIButton(apiName: keyof RobotClient): Promise<void> {
    await this.page.click(`[data-robot-api="${apiName}"]`);
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
