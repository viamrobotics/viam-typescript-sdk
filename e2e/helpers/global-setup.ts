/* eslint-disable no-console, no-await-in-loop */
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

let serverProcess: ChildProcess | undefined;

const VIAM_SERVER_PORT = 9090;
const VIAM_SERVER_HOST = 'localhost';
const VIAM_SERVER_FQDN = 'e2e-ts-sdk';

const waitForServer = async (
  host: string,
  port: number,
  maxAttempts = 30
): Promise<void> => {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const response = await fetch(`http://${host}:${port}/`);
      if (response.ok) {
        console.log(`✓ viam-server is ready at ${host}:${port}`);
        return;
      }
    } catch {
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    }
  }
  throw new Error(`viam-server failed to start within ${maxAttempts} seconds`);
};

export const setup = async (): Promise<() => Promise<void>> => {
  console.log('Starting viam-server for E2E tests...');

  const binaryPath = path.resolve(dirname, '../bin/viam-server');
  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      `viam-server binary not found at ${binaryPath}. Run 'cd e2e && ./setup.sh' to download it.`
    );
  }

  const configPath = path.resolve(dirname, '../fixtures/configs/base.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Test robot config not found at ${configPath}`);
  }

  serverProcess = spawn(binaryPath, ['-config', configPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  serverProcess.stdout?.on('data', (data) => {
    console.log(`[viam-server]: ${String(data).trim()}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    console.error(`[viam-server ERROR]: ${String(data).trim()}`);
  });

  serverProcess.on('error', (error) => {
    console.error('Failed to start viam-server:', error);
    throw error;
  });

  serverProcess.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`viam-server exited with code ${code}`);
    }
    if (signal) {
      console.log(`viam-server killed with signal ${signal}`);
    }
  });

  await waitForServer(VIAM_SERVER_HOST, VIAM_SERVER_PORT);

  process.env.VIAM_SERVER_HOST = VIAM_SERVER_HOST;
  process.env.VIAM_SERVER_PORT = String(VIAM_SERVER_PORT);
  process.env.VIAM_SERVER_FQDN = VIAM_SERVER_FQDN;
  process.env.VIAM_SERVER_URL = `http://${VIAM_SERVER_HOST}:${VIAM_SERVER_PORT}`;

  console.log('✓ Global setup complete');
  return teardown;
};

export const teardown = async (): Promise<void> => {
  console.log('Stopping viam-server...');

  if (serverProcess) {
    const exitPromise = new Promise<void>((resolve) => {
      if (!serverProcess) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        console.warn('viam-server did not exit gracefully, forcing kill...');
        if (serverProcess) {
          serverProcess.kill('SIGKILL');
        }
        resolve();
      }, 5000);

      serverProcess.on('exit', () => {
        clearTimeout(timeout);
        serverProcess = undefined;
        resolve();
      });
    });

    serverProcess.kill('SIGTERM');
    await exitPromise;
  }

  console.log('✓ Global teardown complete');
};

export default setup;
