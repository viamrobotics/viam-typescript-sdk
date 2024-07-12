import { createPromiseClient } from '@connectrpc/connect';
import { BaseService } from '@viamrobotics/sdk/proto/component/base/v1/base_connect';
import { RobotService } from '@viamrobotics/sdk/proto/robot/v1/robot_connect';
import { dialDirect } from '@viamrobotics/sdk';

const HOST = import.meta.env.VITE_HOST;
const API_KEY_ID = import.meta.env.VITE_API_KEY_ID;
const API_KEY = import.meta.env.VITE_API_KEY;

const transport = await dialDirect({
  host: HOST,
  authEntity: API_KEY_ID,
  credential: { type: 'api-key', payload: API_KEY },
});

const robot = createPromiseClient(RobotService, transport);
console.log(await robot.resourceNames({}));

const base = createPromiseClient(BaseService, transport);
await base.spin({ name: 'viam_base', angleDeg: 360, degsPerSec: 45 });
