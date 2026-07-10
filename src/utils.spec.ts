// @vitest-environment happy-dom

import { Struct } from '@bufbuild/protobuf';
import { describe, expect, it, vi } from 'vitest';
import {
  type DoCommandRequest,
  DoCommandResponse,
  GetKinematicsResponse,
  type GetStatusRequest,
  GetStatusResponse,
  KinematicsFileFormat,
} from './gen/common/v1/common_pb';
import { doCommandFromClient, getKinematicsFromClient, getStatusFromClient } from './utils';

const encode = (value: string) => new TextEncoder().encode(value);

describe('doCommandFromClient', () => {
  it('accepts a Struct command', async () => {
    const command = Struct.fromJson({ foo: 'bar' });
    const doCommander = vi.fn().mockResolvedValue(
      new DoCommandResponse({
        result: Struct.fromJson({ result: 'ok' }),
      }),
    );

    const result = await doCommandFromClient(doCommander, 'test', command);

    expect(result).toStrictEqual({ result: 'ok' });
    const [request] = doCommander.mock.calls[0] as [DoCommandRequest];
    expect(request.name).toBe('test');
    expect(request.command?.toJson()).toStrictEqual({ foo: 'bar' });
  });

  it('accepts a plain object and converts it to a Struct', async () => {
    const doCommander = vi.fn().mockResolvedValue(
      new DoCommandResponse({
        result: Struct.fromJson({ result: 'ok' }),
      }),
    );

    const result = await doCommandFromClient(doCommander, 'test', {
      foo: 'bar',
    });

    expect(result).toStrictEqual({ result: 'ok' });
    const [request] = doCommander.mock.calls[0] as [DoCommandRequest];
    expect(request.name).toBe('test');
    expect(request.command?.toJson()).toStrictEqual({ foo: 'bar' });
  });

  it('returns empty object when result is undefined', async () => {
    const doCommander = vi.fn().mockResolvedValue(new DoCommandResponse({}));

    const result = await doCommandFromClient(doCommander, 'test', Struct.fromJson({}));

    expect(result).toStrictEqual({});
  });

  it('calls requestLogger when provided', async () => {
    const doCommander = vi.fn().mockResolvedValue(new DoCommandResponse({}));
    const requestLogger = vi.fn();

    await doCommandFromClient(doCommander, 'test', { foo: 'bar' }, { requestLogger });

    expect(requestLogger).toHaveBeenCalledOnce();
    const [loggedRequest] = requestLogger.mock.calls[0] as [DoCommandRequest];
    expect(loggedRequest.name).toBe('test');
    expect(loggedRequest.command?.toJson()).toStrictEqual({ foo: 'bar' });
  });
});

describe('getStatusFromClient', () => {
  it('returns the status as JSON', async () => {
    const getStatusMethod = vi.fn().mockResolvedValue(
      new GetStatusResponse({
        result: Struct.fromJson({ state: 'running' }),
      }),
    );

    const result = await getStatusFromClient(getStatusMethod, 'test');

    expect(result).toStrictEqual({ state: 'running' });
    const [request] = getStatusMethod.mock.calls[0] as [GetStatusRequest];
    expect(request.name).toBe('test');
  });

  it('returns empty object when result is undefined', async () => {
    const getStatusMethod = vi.fn().mockResolvedValue(new GetStatusResponse({}));

    const result = await getStatusFromClient(getStatusMethod, 'test');

    expect(result).toStrictEqual({});
  });

  it('calls requestLogger when provided', async () => {
    const getStatusMethod = vi.fn().mockResolvedValue(new GetStatusResponse({}));
    const requestLogger = vi.fn();

    await getStatusFromClient(getStatusMethod, 'test', { requestLogger });

    expect(requestLogger).toHaveBeenCalledOnce();
    const [loggedRequest] = requestLogger.mock.calls[0] as [GetStatusRequest];
    expect(loggedRequest.name).toBe('test');
  });
});

describe('getKinematicsFromClient', () => {
  it('parses SVA (JSON) kinematics data', async () => {
    const sva = {
      name: 'test',
      kinematic_param_type: 'SVA',
      joints: [{ id: 'j0', type: 'revolute', parent: 'world', max: 90, min: -90 }],
      links: [],
    };
    const getKinematicsMethod = vi.fn().mockResolvedValue(
      new GetKinematicsResponse({
        format: KinematicsFileFormat.SVA,
        kinematicsData: encode(JSON.stringify(sva)),
      }),
    );

    const result = await getKinematicsFromClient(getKinematicsMethod, 'test');

    expect(result).toMatchObject({
      kinematic_param_type: 'SVA',
      joints: [{ id: 'j0', max: 90, min: -90 }],
    });
  });

  it('parses URDF (XML) kinematics data into SVA joints/links', async () => {
    const urdf = `<?xml version="1.0"?>
<robot name="test">
  <link name="base"/>
  <link name="link1"/>
  <joint name="joint1" type="revolute">
    <parent link="base"/>
    <child link="link1"/>
    <origin rpy="0 0 0" xyz="0 0 0.1"/>
    <axis xyz="0 0 1"/>
    <limit lower="-3.14" upper="3.14"/>
  </joint>
</robot>`;
    const getKinematicsMethod = vi.fn().mockResolvedValue(
      new GetKinematicsResponse({
        format: KinematicsFileFormat.URDF,
        kinematicsData: encode(urdf),
      }),
    );

    const result = await getKinematicsFromClient(getKinematicsMethod, 'test');

    expect(result).toMatchObject({
      name: 'test',
      // Parsed URDF is reported as SVA (converted units) so downstream
      // consumers gated on 'SVA' pick up the joint limits.
      kinematic_param_type: 'SVA',
      joints: [{ id: 'joint1', type: 'revolute' }],
      urdf,
    });
    expect((result as { links: unknown[] }).links).toHaveLength(2);
    expect((result as { joints: unknown[] }).joints).toHaveLength(1);
  });

  it('falls back to a raw-XML result when URDF cannot be parsed', async () => {
    const urdf = '<nope/>'; // no <robot> element -> parseUrdf throws
    const getKinematicsMethod = vi.fn().mockResolvedValue(
      new GetKinematicsResponse({
        format: KinematicsFileFormat.URDF,
        kinematicsData: encode(urdf),
      }),
    );

    const result = await getKinematicsFromClient(getKinematicsMethod, 'test');

    expect(result).toMatchObject({
      name: 'test',
      kinematic_param_type: 'URDF',
      joints: [],
      links: [],
      urdf,
    });
  });

  it('returns an empty UNSPECIFIED result when there is no kinematics data', async () => {
    const getKinematicsMethod = vi.fn().mockResolvedValue(
      new GetKinematicsResponse({
        format: KinematicsFileFormat.UNSPECIFIED,
      }),
    );

    const result = await getKinematicsFromClient(getKinematicsMethod, 'test');

    expect(result).toMatchObject({
      name: 'test',
      kinematic_param_type: 'UNSPECIFIED',
      joints: [],
      links: [],
    });
  });
});
