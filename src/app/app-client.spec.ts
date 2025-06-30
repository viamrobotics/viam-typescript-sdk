import * as pb from '../gen/app/v1/app_pb';

import { Struct, Timestamp, type PartialMessage } from '@bufbuild/protobuf';
import { createRouterTransport, type Transport } from '@connectrpc/connect';
import { createWritableIterable } from '@connectrpc/connect/protocol';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PackageType } from '../gen/app/packages/v1/packages_pb';
import { AppService } from '../gen/app/v1/app_connect';
import { LogEntry } from '../gen/common/v1/common_pb';
import { AppClient, createAuth } from './app-client';
vi.mock('../gen/app/v1/app_pb_service');

let testLogStream =
  createWritableIterable<PartialMessage<pb.TailRobotPartLogsResponse>>();

let mockTransport: Transport;
const subject = () => new AppClient(mockTransport);

describe('AppClient tests', () => {
  const org = new pb.Organization({
    id: 'id',
    cid: 'cid',
    name: 'name',
    defaultRegion: 'region',
    publicNamespace: 'namespace',
    createdOn: new Timestamp(),
  });

  const location = new pb.Location({
    createdOn: new Timestamp(),
    id: 'id',
    name: 'name',
    robotCount: 3,
    parentLocationId: 'parent',
  });

  const sharedSecret = new pb.SharedSecret({
    createdOn: new Timestamp(),
    state: 2,
    secret: 'super-secret',
    id: 'id',
  });
  const auth = new pb.LocationAuth({
    secrets: [sharedSecret],
    locationId: 'locId',
    secret: 'secret',
  });

  const robot = new pb.Robot({
    createdOn: new Timestamp(),
    id: 'id',
    location: 'location',
    name: 'name',
  });

  const roverRentalRobot = new pb.RoverRentalRobot({
    locationId: 'locId',
    robotId: 'robotId',
    robotName: 'name',
    robotMainPartId: 'mainPartId',
  });

  const robotPart = new pb.RobotPart({
    locationId: 'locId',
    createdOn: new Timestamp(),
    name: 'name',
    id: 'id',
    robot: 'robot',
    secrets: [sharedSecret],
    secret: 'secret',
    fqdn: 'fqdn',
  });

  const logEntry = new LogEntry({
    level: 'debug',
    loggerName: 'logger',
  });

  const apiKey = new pb.APIKey({
    id: 'id',
    name: 'name',
    createdOn: new Timestamp(),
    key: 'key',
  });

  const fragment = new pb.Fragment({
    id: 'id',
    createdOn: new Timestamp(),
    public: true,
    name: 'name',
  });

  const apiKeyWithAuths = new pb.APIKeyWithAuthorizations({
    apiKey,
  });

  const partHistory = new pb.RobotPartHistoryEntry({
    old: robotPart,
    part: 'part',
    when: new Timestamp(),
    robot: 'robot',
  });

  const authorization = createAuth(
    'orgId',
    'entityId',
    'role',
    'resourceType',
    '',
    'resourceId'
  );

  const invite = new pb.OrganizationInvite({
    email: 'email',
    organizationId: 'id',
    createdOn: new Timestamp(),
    authorizations: [authorization],
  });

  const permission = new pb.AuthorizedPermissions({
    resourceType: 'robot',
    resourceId: 'id',
    permissions: ['some', 'permissions'],
  });

  const registryItem = new pb.RegistryItem({
    organizationId: 'orgId',
    url: 'url',
    name: 'name',
    type: 2,
    itemId: 'itemId',
    visibility: 2,
  });

  const module = new pb.Module({
    url: 'url',
    moduleId: 'id',
    description: 'description',
    visibility: 2,
    organizationId: 'orgId',
    name: 'name',
  });

  describe('getUserIDByEmail tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getUserIDByEmail: () => {
            return new pb.GetUserIDByEmailResponse({
              userId: 'id',
            });
          },
        });
      });
    });

    it('getUserIDByEmail', async () => {
      const response = await subject().getUserIDByEmail('email');
      expect(response).toEqual('id');
    });
  });

  describe('createOrganization tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          createOrganization: () => {
            return new pb.CreateOrganizationResponse({
              organization: org,
            });
          },
        });
      });
    });

    it('createOrganization', async () => {
      const response = await subject().createOrganization('name');
      expect(response).toEqual(org);
    });
  });

  describe('listOrganizations tests', () => {
    const organizations = [org];
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listOrganizations: () => {
            return new pb.ListOrganizationsResponse({
              organizations,
            });
          },
        });
      });
    });

    it('listOrganizations', async () => {
      const response = await subject().listOrganizations();
      expect(response).toEqual(organizations);
    });
  });

  describe('getOrganizationsWithAccessToLocation tests', () => {
    const orgIdentity = new pb.OrganizationIdentity({
      name: 'name',
      id: 'id',
    });
    const orgIdentities = [orgIdentity];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getOrganizationsWithAccessToLocation: () => {
            return new pb.GetOrganizationsWithAccessToLocationResponse({
              organizationIdentities: orgIdentities,
            });
          },
        });
      });
    });

    it('getOrganizationsWithAccessToLocation', async () => {
      const response =
        await subject().getOrganizationsWithAccessToLocation('location-id');
      expect(response).toEqual(orgIdentities);
    });
  });

  describe('listOrganizationsByUser tests', () => {
    const orgDetail = new pb.OrgDetails({
      orgId: 'id',
      orgName: 'name',
    });
    const orgDetails = [orgDetail];
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listOrganizationsByUser: () => {
            return new pb.ListOrganizationsByUserResponse({
              orgs: orgDetails,
            });
          },
        });
      });
    });

    it('listOrganizationsByUser', async () => {
      const response = await subject().listOrganizationsByUser('user');
      expect(response).toEqual(orgDetails);
    });
  });

  describe('getOrganization tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getOrganization: () => {
            return new pb.GetOrganizationResponse({
              organization: org,
            });
          },
        });
      });
    });

    it('getOrganization', async () => {
      const response = await subject().getOrganization('orgId');
      expect(response).toEqual(org);
    });
  });

  describe('getOrganizationNamespaceAvailability tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getOrganizationNamespaceAvailability: () => {
            return new pb.GetOrganizationNamespaceAvailabilityResponse({
              available: true,
            });
          },
        });
      });
    });

    it('getOrganizationNamespaceAvailability', async () => {
      const response =
        await subject().getOrganizationNamespaceAvailability('namespace');
      expect(response).toEqual(true);
    });
  });

  describe('updateOrganization tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateOrganization: () => {
            return new pb.UpdateOrganizationResponse({
              organization: org,
            });
          },
        });
      });
    });

    it('updateOrganization', async () => {
      const response = await subject().updateOrganization(
        'id',
        'name',
        'namespace',
        'region',
        'cid'
      );
      expect(response).toEqual(org);
    });
  });

  describe('deleteOrganization tests', () => {
    const expectedRequest = new pb.DeleteOrganizationRequest({
      organizationId: 'id',
    });

    let capReq: pb.DeleteOrganizationRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteOrganization: (req) => {
            capReq = req;
            return new pb.DeleteOrganizationResponse();
          },
        });
      });
    });

    it('deleteOrganization', async () => {
      await subject().deleteOrganization('id');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('listOrganizationMembers tests', () => {
    const orgMember = new pb.OrganizationMember({
      userId: 'id',
      dateAdded: new Timestamp(),
      emails: ['email'],
    });
    const members = [orgMember];
    const invites = [invite];

    const expectedResponse = new pb.ListOrganizationMembersResponse({
      organizationId: 'orgId',
      members,
      invites,
    });

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listOrganizationMembers: () => {
            return expectedResponse;
          },
        });
      });
    });

    it('listOrganizationMembers', async () => {
      const response = await subject().listOrganizationMembers('id');
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('createOrganizationInvite tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          createOrganizationInvite: () => {
            return new pb.CreateOrganizationInviteResponse({
              invite,
            });
          },
        });
      });
    });

    it('createOrganizationInvite', async () => {
      const response = await subject().createOrganizationInvite(
        'orgId',
        'email',
        [],
        false
      );
      expect(response).toEqual(invite);
    });
  });

  describe('updateOrganizationInviteAuthorizations tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateOrganizationInviteAuthorizations: () => {
            return new pb.UpdateOrganizationInviteAuthorizationsResponse({
              invite,
            });
          },
        });
      });
    });

    it('updateOrganizationInviteAuthorizations', async () => {
      const response = await subject().updateOrganizationInviteAuthorizations(
        'orgId',
        'email',
        [authorization],
        []
      );
      expect(response).toEqual(invite);
    });
  });

  describe('deleteOrganizationMember tests', () => {
    const expectedRequest = new pb.DeleteOrganizationMemberRequest({
      organizationId: 'orgId',
      userId: 'userId',
    });

    let capReq: pb.DeleteOrganizationMemberRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteOrganizationMember: (req) => {
            capReq = req;
            return new pb.DeleteOrganizationInviteResponse();
          },
        });
      });
    });

    it('deleteOrganizationMember', async () => {
      await subject().deleteOrganizationMember('orgId', 'userId');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('deleteOrganizationInvite tests', () => {
    const expectedRequest = new pb.DeleteOrganizationInviteRequest({
      organizationId: 'orgId',
      email: 'email',
    });

    let capReq: pb.DeleteOrganizationInviteRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteOrganizationInvite: (req) => {
            capReq = req;
            return new pb.DeleteOrganizationInviteResponse();
          },
        });
      });
    });

    it('deleteOrganizationInvite', async () => {
      await subject().deleteOrganizationInvite('orgId', 'email');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('resendOrganizationInvite tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          resendOrganizationInvite: () => {
            return new pb.ResendOrganizationInviteResponse({
              invite,
            });
          },
        });
      });
    });

    it('resendOrganizationInvite', async () => {
      const response = await subject().resendOrganizationInvite(
        'orgId',
        'email'
      );
      expect(response).toEqual(invite);
    });
  });

  describe('createLocation tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          createLocation: () => {
            return new pb.CreateLocationResponse({
              location,
            });
          },
        });
      });
    });

    it('createLocation', async () => {
      const response = await subject().createLocation(
        'orgId',
        'name',
        'parent'
      );
      expect(response).toEqual(location);
    });
  });

  describe('getLocation tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getLocation: () => {
            return new pb.GetLocationResponse({
              location,
            });
          },
        });
      });
    });

    it('getLocation', async () => {
      const response = await subject().getLocation('locId');
      expect(response).toEqual(location);
    });
  });

  describe('updateLocation tests', () => {
    const newLocation = new pb.Location({
      ...location,
      id: 'newId',
      name: 'newName',
      parentLocationId: 'newParent',
    });

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateLocation: () => {
            return new pb.UpdateLocationResponse({
              location: newLocation,
            });
          },
        });
      });
    });

    it('updateLocation', async () => {
      const response = await subject().updateLocation(
        'newLoc',
        'newName',
        'newParent',
        'newRegion'
      );
      expect(response).toEqual(newLocation);
    });
  });

  describe('deleteLocation tests', () => {
    const expectedRequest = new pb.DeleteLocationRequest({
      locationId: 'id',
    });

    let capReq: pb.DeleteLocationRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteLocation: (req) => {
            capReq = req;
            return new pb.DeleteLocationResponse();
          },
        });
      });
    });

    it('deleteLocation', async () => {
      await subject().deleteLocation('id');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('listLocations tests', () => {
    const locations = [location];
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listLocations: () => {
            return new pb.ListLocationsResponse({
              locations,
            });
          },
        });
      });
    });

    it('listLocations', async () => {
      const response = await subject().listLocations('orgId');
      expect(response).toEqual(locations);
    });
  });

  describe('shareLocation tests', () => {
    const expectedRequest = new pb.ShareLocationRequest({
      locationId: 'locId',
      organizationId: 'orgId',
    });

    let capReq: pb.ShareLocationRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          shareLocation: (req) => {
            capReq = req;
            return new pb.ShareLocationResponse();
          },
        });
      });
    });

    it('shareLocation', async () => {
      await subject().shareLocation('orgId', 'locId');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('unshareLocation tests', () => {
    const expectedRequest = new pb.UnshareLocationRequest({
      organizationId: 'orgId',
      locationId: 'locId',
    });

    let capReq: pb.UnshareLocationRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          unshareLocation: (req) => {
            capReq = req;
            return new pb.UnshareLocationResponse();
          },
        });
      });
    });

    it('unshareLocation', async () => {
      await subject().unshareLocation('orgId', 'locId');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('locationAuth tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          locationAuth: () => {
            return new pb.LocationAuthResponse({
              auth,
            });
          },
        });
      });
    });

    it('locationAuth', async () => {
      const response = await subject().locationAuth('locId');
      expect(response).toEqual(auth);
    });
  });

  describe('createLocationSecret tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          createLocationSecret: () => {
            return new pb.CreateLocationSecretResponse({
              auth,
            });
          },
        });
      });
    });

    it('createLocationSecret', async () => {
      const response = await subject().createLocationSecret('locId');
      expect(response).toEqual(auth);
    });
  });

  describe('deleteLocationSecret tests', () => {
    const expectedRequest = new pb.DeleteLocationSecretRequest({
      locationId: 'locId',
      secretId: 'secret-id',
    });

    let capReq: pb.DeleteLocationSecretRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteLocationSecret: (req) => {
            capReq = req;
            return new pb.DeleteLocationSecretResponse();
          },
        });
      });
    });

    it('deleteLocationSecret', async () => {
      await subject().deleteLocationSecret('locId', 'secret-id');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('getRobot tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobot: () => {
            return new pb.GetRobotResponse({
              robot,
            });
          },
        });
      });
    });

    it('getRobot', async () => {
      const response = await subject().getRobot('robotId');
      expect(response).toEqual(robot);
    });
  });

  describe('getRoverRentalRobots tests', () => {
    const roverRentalRobots = [roverRentalRobot];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRoverRentalRobots: () => {
            return new pb.GetRoverRentalRobotsResponse({
              robots: roverRentalRobots,
            });
          },
        });
      });
    });

    it('getRoverRentalRobots', async () => {
      const response = await subject().getRoverRentalRobots('email');
      expect(response).toEqual(roverRentalRobots);
    });
  });

  describe('getRobotParts tests', () => {
    const parts = [robotPart];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobotParts: () => {
            return new pb.GetRobotPartsResponse({
              parts,
            });
          },
        });
      });
    });

    it('getRobotParts', async () => {
      const response = await subject().getRobotParts('robotId');
      expect(response).toEqual(parts);
    });
  });

  describe('getRobotPart tests', () => {
    const expectedResponse = new pb.GetRobotPartResponse({
      part: robotPart,
      configJson: 'isJson: true',
    });
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobotPart: () => {
            return expectedResponse;
          },
        });
      });
    });

    it('getRobotPart', async () => {
      const response = await subject().getRobotPart('email');
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('getRobotPartByNameAndLocation tests', () => {
    const expectedResponse = new pb.GetRobotPartByNameAndLocationResponse({
      part: robotPart,
    });
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobotPartByNameAndLocation: () => {
            return expectedResponse;
          },
        });
      });
    });

    it('getRobotPartByNameAndLocation', async () => {
      const response = await subject().getRobotPartByNameAndLocation(
        'name',
        'locationId'
      );
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('getRobotPartLogs tests', () => {
    const expectedResponse = new pb.GetRobotPartLogsResponse({
      logs: [logEntry],
      nextPageToken: 'nextPage',
    });

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobotPartLogs: () => {
            return expectedResponse;
          },
        });
      });
    });

    it('getRobotPartLogs', async () => {
      const response = await subject().getRobotPartLogs('email');
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('tailRobotPartLogs tests', () => {
    beforeEach(() => {
      testLogStream =
        createWritableIterable<PartialMessage<pb.TailRobotPartLogsResponse>>();
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          tailRobotPartLogs: () => {
            return testLogStream;
          },
        });
      });
    });

    afterEach(() => {
      testLogStream =
        createWritableIterable<PartialMessage<pb.TailRobotPartLogsResponse>>();
    });

    it('tailRobotPartLogs', async () => {
      const logs: LogEntry[] = [];
      const promise = subject().tailRobotPartLogs('id', logs);

      await testLogStream.write({
        logs: [logEntry],
      });

      const logEntry2 = new LogEntry({
        ...logEntry,
        loggerName: 'newLoggerName',
        level: 'error',
      });
      await testLogStream.write({
        logs: [logEntry2],
      });
      testLogStream.close();

      await promise;

      expect(logs.length).toEqual(2);

      const log1 = logs[0]!;
      expect(log1.loggerName).toEqual('logger');
      expect(log1.level).toEqual('debug');

      const log2 = logs[1]!;
      expect(log2.loggerName).toEqual('newLoggerName');
      expect(log2.level).toEqual('error');
    });
  });

  describe('getRobotPartHistory tests', () => {
    const histories = [partHistory];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobotPartHistory: () => {
            return new pb.GetRobotPartHistoryResponse({
              history: histories,
            });
          },
        });
      });
    });

    it('getRobotPartHistory', async () => {
      const response = await subject().getRobotPartHistory('email');
      expect(response).toEqual(histories);
    });
  });

  describe('updateRobotPart tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateRobotPart: () => {
            return new pb.UpdateRobotPartResponse({
              part: robotPart,
            });
          },
        });
      });
    });

    it('updateRobotPart', async () => {
      const response = await subject().updateRobotPart(
        'id',
        'name',
        new Struct()
      );
      expect(response).toEqual(robotPart);
    });
  });

  describe('newRobotPart tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          newRobotPart: () => {
            return new pb.NewRobotPartResponse({
              partId: 'id',
            });
          },
        });
      });
    });

    it('newRobotPart', async () => {
      const response = await subject().newRobotPart('robotId', 'partName');
      expect(response).toEqual('id');
    });
  });

  describe('deleteRobotPart tests', () => {
    const expectedRequest = new pb.DeleteRobotPartRequest({
      partId: 'partId',
    });

    let capReq: pb.DeleteRobotPartRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteRobotPart: (req) => {
            capReq = req;
            return new pb.DeleteRobotPartResponse();
          },
        });
      });
    });

    it('deleteRobotPart', async () => {
      await subject().deleteRobotPart('partId');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('getRobotAPIKeys tests', () => {
    const apiKeys = [apiKeyWithAuths];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobotAPIKeys: () => {
            return new pb.GetRobotAPIKeysResponse({
              apiKeys,
            });
          },
        });
      });
    });

    it('getRobotAPIKeys', async () => {
      const response = await subject().getRobotAPIKeys('robotId');
      expect(response).toEqual(apiKeys);
    });
  });

  describe('markPartAsMain tests', () => {
    const expectedRequest = new pb.MarkPartAsMainRequest({
      partId: 'id',
    });

    let capReq: pb.MarkPartAsMainRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          markPartAsMain: (req) => {
            capReq = req;
            return new pb.MarkPartAsMainResponse();
          },
        });
      });
    });

    it('markPartAsMain', async () => {
      await subject().markPartAsMain('id');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('markPartForRestart tests', () => {
    const expectedRequest = new pb.MarkPartForRestartRequest({
      partId: 'id',
    });

    let capReq: pb.MarkPartForRestartRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          markPartForRestart: (req) => {
            capReq = req;
            return new pb.MarkPartForRestartResponse();
          },
        });
      });
    });

    it('markPartForRestart', async () => {
      await subject().markPartForRestart('id');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('createRobotPartSecret tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          createRobotPartSecret: () => {
            return new pb.CreateRobotPartSecretResponse({
              part: robotPart,
            });
          },
        });
      });
    });

    it('createRobotPartSecret', async () => {
      const response = await subject().createRobotPartSecret('partId');
      expect(response).toEqual(robotPart);
    });
  });

  describe('deleteRobotPartSecret tests', () => {
    const expectedRequest = new pb.DeleteRobotPartSecretRequest({
      partId: 'id',
      secretId: 'secretId',
    });

    let capReq: pb.DeleteRobotPartSecretRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteRobotPartSecret: (req) => {
            capReq = req;
            return new pb.DeleteRobotPartSecretResponse();
          },
        });
      });
    });

    it('deleteRobotPartSecret', async () => {
      await subject().deleteRobotPartSecret('id', 'secretId');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('listRobots tests', () => {
    const robots = [robot];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listRobots: () => {
            return new pb.ListRobotsResponse({
              robots,
            });
          },
        });
      });
    });

    it('listRobots', async () => {
      const response = await subject().listRobots('locId');
      expect(response).toEqual(robots);
    });
  });

  describe('listMachineSummaries tests', () => {
    const locSummary1 = new pb.LocationSummary({});
    const locSummary2 = new pb.LocationSummary({});
    const locationSummaries = [locSummary1, locSummary2];
    let capturedReq: pb.ListMachineSummariesRequest | undefined;

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listMachineSummaries: (req: pb.ListMachineSummariesRequest) => {
            capturedReq = req;
            return new pb.ListMachineSummariesResponse({ locationSummaries });
          },
        });
      });
    });

    it('returns location summaries with only organizationId', async () => {
      const response = await subject().listMachineSummaries('orgId');
      expect(response).toEqual(locationSummaries);
      expect(capturedReq?.organizationId).toEqual('orgId');
      expect(capturedReq?.fragmentIds).toEqual([]);
      expect(capturedReq?.locationIds).toEqual([]);
      expect(capturedReq?.limit).toBeUndefined();
    });

    it('returns location summaries with all filters', async () => {
      const response = await subject().listMachineSummaries(
        'orgId',
        ['frag1', 'frag2'],
        ['loc1'],
        5
      );
      expect(response).toEqual(locationSummaries);
      expect(capturedReq?.organizationId).toEqual('orgId');
      expect(capturedReq?.fragmentIds).toEqual(['frag1', 'frag2']);
      expect(capturedReq?.locationIds).toEqual(['loc1']);
      expect(capturedReq?.limit).toEqual(5);
    });
  });

  describe('newRobot tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          newRobot: () => {
            return new pb.NewRobotResponse({
              id: 'robotId',
            });
          },
        });
      });
    });

    it('newRobot', async () => {
      const response = await subject().newRobot('locId', 'name');
      expect(response).toEqual('robotId');
    });
  });

  describe('updateRobot tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateRobot: () => {
            return new pb.UpdateRobotResponse({
              robot,
            });
          },
        });
      });
    });

    it('updateRobot', async () => {
      const response = await subject().updateRobot(
        'robotId',
        'locationId',
        'name'
      );
      expect(response).toEqual(robot);
    });
  });

  describe('deleteRobot tests', () => {
    const expectedRequest = new pb.DeleteRobotRequest({
      id: 'deleteRobotId',
    });

    let capReq: pb.DeleteRobotRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteRobot: (req) => {
            capReq = req;
            return new pb.DeleteRobotResponse();
          },
        });
      });
    });

    it('deleteRobot', async () => {
      await subject().deleteRobot('deleteRobotId');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('listFragments tests', () => {
    const fragments = [fragment];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listFragments: () => {
            return new pb.ListFragmentsResponse({
              fragments,
            });
          },
        });
      });
    });

    it('listFragments', async () => {
      const response = await subject().listFragments('orgId');
      expect(response).toEqual(fragments);
    });
  });

  describe('getFragment tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getFragment: () => {
            return new pb.GetFragmentResponse({
              fragment,
            });
          },
        });
      });
    });

    it('getFragment', async () => {
      const response = await subject().getFragment('id');
      expect(response).toEqual(fragment);
    });
  });

  describe('createFragment tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          createFragment: () => {
            return new pb.CreateFragmentResponse({
              fragment,
            });
          },
        });
      });
    });

    it('createFragment', async () => {
      const response = await subject().createFragment(
        'orgId',
        'name',
        new Struct()
      );
      expect(response).toEqual(fragment);
    });
  });

  describe('updateFragment tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateFragment: () => {
            return new pb.UpdateFragmentResponse({
              fragment,
            });
          },
        });
      });
    });

    it('updateFragment', async () => {
      const response = await subject().updateFragment(
        'id',
        'name',
        new Struct()
      );
      expect(response).toEqual(fragment);
    });
  });

  describe('deleteFragment tests', () => {
    const expectedRequest = new pb.DeleteFragmentRequest({
      id: 'id',
    });

    let capReq: pb.DeleteFragmentRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteFragment: (req) => {
            capReq = req;
            return new pb.DeleteFragmentResponse();
          },
        });
      });
    });

    it('deleteFragment', async () => {
      await subject().deleteFragment('id');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('listMachineFragment tests', () => {
    let request: pb.ListMachineFragmentsRequest;
    const response = [fragment];
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listMachineFragments: (req) => {
            request = req;
            return new pb.ListMachineFragmentsResponse({
              fragments: response,
            });
          },
        });
      });
    });

    it('listMachineFragments', async () => {
      const machineId = 'MACHINE_ID';
      const additionalFragmentIds = ['FRAGMENT ID 1', 'FRAGMENT ID 2'];
      const resp = await subject().listMachineFragments(
        machineId,
        additionalFragmentIds
      );
      expect(request.machineId).toEqual(machineId);
      expect(request.additionalFragmentIds).toEqual(additionalFragmentIds);
      expect(resp).toEqual(response);
    });
  });

  describe('addRole tests', () => {
    const expectedRequest = new pb.AddRoleRequest({
      authorization,
    });

    let capReq: pb.AddRoleRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          addRole: (req) => {
            capReq = req;
            return new pb.AddRoleResponse();
          },
        });
      });
    });

    it('addRole', async () => {
      await subject().addRole(
        'orgId',
        'entityId',
        'role',
        'resourceType',
        'resourceId'
      );
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('removeRole tests', () => {
    const expectedRequest = new pb.RemoveRoleRequest({
      authorization,
    });

    let capReq: pb.RemoveRoleRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          removeRole: (req) => {
            capReq = req;
            return new pb.RemoveRoleResponse();
          },
        });
      });
    });

    it('removeRole', async () => {
      await subject().removeRole(
        'orgId',
        'entityId',
        'role',
        'resourceType',
        'resourceId'
      );
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('changeRole tests', () => {
    const newAuthorization = new pb.Authorization({
      ...authorization,
      organizationId: 'newOrgId',
    });
    const expectedRequest = new pb.ChangeRoleRequest({
      oldAuthorization: authorization,
      newAuthorization,
    });

    let capReq: pb.ChangeRoleRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          changeRole: (req) => {
            capReq = req;
            return new pb.ChangeRoleResponse();
          },
        });
      });
    });

    it('changeRole', async () => {
      await subject().changeRole(authorization, newAuthorization);
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('listAuthorizations tests', () => {
    const authorizations = [authorization];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listAuthorizations: () => {
            return new pb.ListAuthorizationsResponse({
              authorizations,
            });
          },
        });
      });
    });

    it('listAuthorizations', async () => {
      const response = await subject().listAuthorizations('orgId');
      expect(response).toEqual(authorizations);
    });
  });

  describe('checkPermissions tests', () => {
    const permissions = [permission];
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          checkPermissions: () => {
            return new pb.CheckPermissionsResponse({
              authorizedPermissions: permissions,
            });
          },
        });
      });
    });

    it('checkPermissions', async () => {
      const response = await subject().checkPermissions(permissions);
      expect(response).toEqual(permissions);
    });
  });

  describe('getRegistryItem tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRegistryItem: () => {
            return new pb.GetRegistryItemResponse({
              item: registryItem,
            });
          },
        });
      });
    });

    it('getRegistryItem', async () => {
      const response = await subject().getRegistryItem('itemId');
      expect(response).toEqual(registryItem);
    });
  });

  describe('createRegistryItem tests', () => {
    const expectedRequest = new pb.CreateRegistryItemRequest({
      type: 2,
      name: 'name',
      organizationId: 'orgId',
    });

    let capReq: pb.CreateRegistryItemRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          createRegistryItem: (req) => {
            capReq = req;
            return new pb.CreateRegistryItemResponse();
          },
        });
      });
    });

    it('createRegistryItem', async () => {
      await subject().createRegistryItem('orgId', 'name', PackageType.ML_MODEL);
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('updateRegistryItem tests', () => {
    const expectedRequest = new pb.UpdateRegistryItemRequest({
      type: 2,
      visibility: 2,
      itemId: 'itemId',
      description: 'description',
    });

    let capReq: pb.UpdateRegistryItemRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateRegistryItem: (req) => {
            capReq = req;
            return new pb.UpdateRegistryItemResponse();
          },
        });
      });
    });

    it('updateRegistryItem', async () => {
      await subject().updateRegistryItem(
        'itemId',
        PackageType.ML_MODEL,
        'description',
        pb.Visibility.PUBLIC
      );
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('listRegistryItems tests', () => {
    const items = [registryItem];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listRegistryItems: () => {
            return new pb.ListRegistryItemsResponse({
              items,
            });
          },
        });
      });
    });

    it('listRegistryItems', async () => {
      const response = await subject().listRegistryItems(
        'orgId',
        [PackageType.ML_MODEL, PackageType.ARCHIVE],
        [pb.Visibility.PUBLIC],
        ['mac', 'unix'],
        [pb.RegistryItemStatus.PUBLISHED],
        'search',
        'token'
      );
      expect(response).toEqual(items);
    });
  });

  describe('deleteRegistryItem tests', () => {
    const expectedRequest = new pb.DeleteRegistryItemRequest({
      itemId: 'itemId',
    });

    let capReq: pb.DeleteRegistryItemRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteRegistryItem: (req) => {
            capReq = req;
            return new pb.DeleteRegistryItemResponse();
          },
        });
      });
    });

    it('deleteRegistryItem', async () => {
      await subject().deleteRegistryItem('itemId');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('createModule tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          createModule: () => {
            return new pb.CreateModuleResponse({
              url: 'url',
              moduleId: 'id',
            });
          },
        });
      });
    });

    it('createModule', async () => {
      const response = await subject().createModule('orgId', 'name');
      expect(response.url).toEqual('url');
      expect(response.moduleId).toEqual('id');
    });
  });

  describe('updateModule tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateModule: () => {
            return new pb.UpdateModuleResponse({
              url: 'url',
            });
          },
        });
      });
    });

    it('updateModule', async () => {
      const response = await subject().updateModule(
        'moduleId',
        pb.Visibility.PRIVATE,
        'url',
        'newDescription',
        [],
        'entrypoint'
      );
      expect(response).toEqual('url');
    });
  });

  describe('getModule tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getModule: () => {
            return new pb.GetModuleResponse({
              module,
            });
          },
        });
      });
    });

    it('getModule', async () => {
      const response = await subject().getModule('id');
      expect(response).toEqual(module);
    });
  });

  describe('listModules tests', () => {
    const modules = [module];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listModules: () => {
            return new pb.ListModulesResponse({
              modules,
            });
          },
        });
      });
    });

    it('listModules', async () => {
      const response = await subject().listModules('orgId');
      expect(response).toEqual(modules);
    });
  });

  describe('createKey tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          createKey: () => {
            return new pb.CreateKeyResponse({
              id: 'id',
              key: 'key',
            });
          },
        });
      });
    });

    it('createKey', async () => {
      const response = await subject().createKey([authorization], 'name');
      expect(response.id).toEqual('id');
      expect(response.key).toEqual('key');
    });
  });

  describe('deleteKey tests', () => {
    const expectedRequest = new pb.DeleteKeyRequest({
      id: 'id',
    });

    let capReq: pb.DeleteKeyRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteKey: (req) => {
            capReq = req;
            return new pb.DeleteKeyResponse();
          },
        });
      });
    });

    it('deleteKey', async () => {
      await subject().deleteKey('id');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('listKeys tests', () => {
    const keys = [apiKeyWithAuths];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listKeys: () => {
            return new pb.ListKeysResponse({
              apiKeys: keys,
            });
          },
        });
      });
    });

    it('listKeys', async () => {
      const response = await subject().listKeys('orgId');
      expect(response).toEqual(keys);
    });
  });

  describe('rotateKey tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          rotateKey: () => {
            return new pb.RotateKeyResponse({
              id: 'newId',
              key: 'eyK',
            });
          },
        });
      });
    });

    it('rotateKey', async () => {
      const response = await subject().rotateKey('id');
      expect(response.key).toEqual('eyK');
      expect(response.id).toEqual('newId');
    });
  });

  describe('createKeyFromExistingKeyAuthorizations tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          createKeyFromExistingKeyAuthorizations: () => {
            return new pb.CreateKeyFromExistingKeyAuthorizationsResponse({
              key: 'key',
              id: 'id',
            });
          },
        });
      });
    });

    it('createKeyFromExistingKeyAuthorizations', async () => {
      const response =
        await subject().createKeyFromExistingKeyAuthorizations('id');
      expect(response.key).toEqual('key');
      expect(response.id).toEqual('id');
    });
  });

  describe('getAppContent tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getAppContent: () =>
            new pb.GetAppContentResponse({
              blobPath: '/path/to/blob',
              entrypoint: 'index.html',
            }),
        });
      });
    });

    it('getAppContent', async () => {
      const response = await subject().getAppContent(
        'publicNamespace',
        'machineName'
      );
      expect(response.blobPath).toEqual('/path/to/blob');
      expect(response.entrypoint).toEqual('index.html');
    });
  });

  describe('getOrganizationMetadata', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getOrganizationMetadata: () =>
            new pb.GetOrganizationMetadataResponse(),
        });
      });
    });

    it('returns an empty object if there is no Struct', async () => {
      const response = await subject().getOrganizationMetadata('orgId');
      expect(response).toEqual({});
    });

    it('preserves the map key when a Struct is found', async () => {
      const testResponse = new pb.GetOrganizationMetadataResponse({
        data: Struct.fromJson({ key1: 'value1' }),
      });

      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getOrganizationMetadata: () => testResponse,
        });
      });

      const response = await subject().getOrganizationMetadata('orgId');
      expect(response).toEqual({ key1: 'value1' });
    });
  });

  describe('updateOrganizationMetadata', () => {
    let capturedRequest: pb.UpdateOrganizationMetadataRequest;

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateOrganizationMetadata: (req) => {
            capturedRequest = req;
            return new pb.UpdateOrganizationMetadataResponse();
          },
        });
      });
    });

    it('should handle empty metadata correctly', async () => {
      await subject().updateOrganizationMetadata('orgId', {});

      expect(capturedRequest).toEqual({
        organizationId: 'orgId',
        data: Struct.fromJson({}),
      });
    });

    it('should successfully update metadata with valid data', async () => {
      await subject().updateOrganizationMetadata('orgId', { key1: 'value1' });

      expect(capturedRequest).toEqual({
        organizationId: 'orgId',
        data: Struct.fromJson({ key1: 'value1' }),
      });
    });
  });

  describe('getLocationMetadata', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getLocationMetadata: () => new pb.GetLocationMetadataResponse(),
        });
      });
    });

    it('returns an empty object if there is no Struct', async () => {
      const response = await subject().getLocationMetadata('orgId');
      expect(response).toEqual({});
    });

    it('preserves the map key when a Struct is found', async () => {
      const testResponse = new pb.GetLocationMetadataResponse({
        data: Struct.fromJson({ key1: 'value1' }),
      });

      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getLocationMetadata: () => testResponse,
        });
      });

      const response = await subject().getLocationMetadata('orgId');
      expect(response).toEqual({ key1: 'value1' });
    });
  });

  describe('updateLocationMetadata', () => {
    let capturedRequest: pb.UpdateLocationMetadataResponse;

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateLocationMetadata: (req) => {
            capturedRequest = req;
            return new pb.UpdateLocationMetadataResponse();
          },
        });
      });
    });

    it('should handle empty metadata correctly', async () => {
      await subject().updateLocationMetadata('locId', {});

      expect(capturedRequest).toEqual({
        locationId: 'locId',
        data: Struct.fromJson({}),
      });
    });

    it('should successfully update metadata with valid data', async () => {
      await subject().updateLocationMetadata('locId', { key1: 'value1' });

      expect(capturedRequest).toEqual({
        locationId: 'locId',
        data: Struct.fromJson({ key1: 'value1' }),
      });
    });
  });

  describe('getRobotMetadata', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobotMetadata: () => new pb.GetRobotMetadataResponse(),
        });
      });
    });

    it('returns an empty object if there is no Struct', async () => {
      const response = await subject().getRobotMetadata('orgId');
      expect(response).toEqual({});
    });

    it('preserves the map key when a Struct is found', async () => {
      const testResponse = new pb.GetRobotMetadataResponse({
        data: Struct.fromJson({ key1: 'value1' }),
      });

      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobotMetadata: () => testResponse,
        });
      });

      const response = await subject().getRobotMetadata('orgId');
      expect(response).toEqual({ key1: 'value1' });
    });
  });

  describe('updateRobotMetadata', () => {
    let capturedRequest: pb.UpdateRobotMetadataResponse;

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateRobotMetadata: (req) => {
            capturedRequest = req;
            return new pb.UpdateLocationMetadataResponse();
          },
        });
      });
    });

    it('should handle empty metadata correctly', async () => {
      await subject().updateRobotMetadata('robotId', {});

      expect(capturedRequest).toEqual({
        id: 'robotId',
        data: Struct.fromJson({}),
      });
    });

    it('should successfully update metadata with valid data', async () => {
      await subject().updateRobotMetadata('robotId', { key1: 'value1' });

      expect(capturedRequest).toEqual({
        id: 'robotId',
        data: Struct.fromJson({ key1: 'value1' }),
      });
    });
  });

  describe('getRobotPartMetadata', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobotPartMetadata: () => new pb.GetRobotPartMetadataResponse(),
        });
      });
    });

    it('returns an empty object if there is no Struct', async () => {
      const response = await subject().getRobotPartMetadata('orgId');
      expect(response).toEqual({});
    });

    it('preserves the map key when a Struct is found', async () => {
      const testResponse = new pb.GetRobotPartMetadataResponse({
        data: Struct.fromJson({ key1: 'value1' }),
      });

      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobotPartMetadata: () => testResponse,
        });
      });

      const response = await subject().getRobotPartMetadata('orgId');
      expect(response).toEqual({ key1: 'value1' });
    });
  });

  describe('updateRobotPartMetadata', () => {
    let capturedRequest: pb.UpdateRobotPartMetadataResponse;

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateRobotPartMetadata: (req) => {
            capturedRequest = req;
            return new pb.UpdateRobotPartMetadataResponse();
          },
        });
      });
    });

    it('should handle empty metadata correctly', async () => {
      await subject().updateRobotPartMetadata('robotPartId', {});

      expect(capturedRequest).toEqual({
        id: 'robotPartId',
        data: Struct.fromJson({}),
      });
    });

    it('should successfully update metadata with valid data', async () => {
      await subject().updateRobotPartMetadata('robotPartId', {
        key1: 'value1',
      });

      expect(capturedRequest).toEqual({
        id: 'robotPartId',
        data: Struct.fromJson({ key1: 'value1' }),
      });
    });
  });

  describe('getAppBranding tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getAppBranding: () =>
            new pb.GetAppBrandingResponse({
              logoPath: '/branding/logo.png',
              textCustomizations: {
                machinePicker: new pb.TextOverrides({
                  fields: {
                    heading: 'Welcome',
                    subheading: 'Select your machine.',
                  },
                }),
              },
            }),
        });
      });
    });

    it('getAppBranding', async () => {
      const response = await subject().getAppBranding(
        'publicNamespace',
        'appName'
      );
      expect(response.logoPath).toEqual('/branding/logo.png');
      expect(response.textCustomizations.machinePicker!.fields.heading).toEqual(
        'Welcome'
      );
      expect(
        response.textCustomizations.machinePicker!.fields.subheading
      ).toEqual('Select your machine.');
    });
  });
});
