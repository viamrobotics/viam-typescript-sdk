import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create, type MessageInitShape } from '@bufbuild/protobuf';
import { timestampNow } from '@bufbuild/protobuf/wkt';
import { createRouterTransport, type Transport } from '@connectrpc/connect';
import { createWritableIterable } from '@connectrpc/connect/protocol';

import { PackageType } from '../gen/app/packages/v1/packages_pb';
import * as pb from '../gen/app/v1/app_pb';
import {
  AppService,
  DeleteOrganizationMemberResponseSchema,
} from '../gen/app/v1/app_pb';
import { type LogEntry, LogEntrySchema } from '../gen/common/v1/common_pb';
import { AppClient, createAuth } from './app-client';

let testLogStream =
  createWritableIterable<
    MessageInitShape<typeof pb.TailRobotPartLogsResponseSchema>
  >();

let mockTransport: Transport;
const subject = () => new AppClient(mockTransport);

describe('AppClient tests', () => {
  const org = create(pb.OrganizationSchema, {
    id: 'id',
    cid: 'cid',
    name: 'name',
    defaultRegion: 'region',
    publicNamespace: 'namespace',
    createdOn: timestampNow(),
  });

  const location = create(pb.LocationSchema, {
    createdOn: timestampNow(),
    id: 'id',
    name: 'name',
    robotCount: 3,
    parentLocationId: 'parent',
  });

  const sharedSecret = create(pb.SharedSecretSchema, {
    createdOn: timestampNow(),
    state: 2,
    secret: 'super-secret',
    id: 'id',
  });
  const auth = create(pb.LocationAuthSchema, {
    secrets: [sharedSecret],
    locationId: 'locId',
    secret: 'secret',
  });

  const robot = create(pb.RobotSchema, {
    createdOn: timestampNow(),
    id: 'id',
    location: 'location',
    name: 'name',
  });

  const roverRentalRobot = create(pb.RoverRentalRobotSchema, {
    locationId: 'locId',
    robotId: 'robotId',
    robotName: 'name',
    robotMainPartId: 'mainPartId',
  });

  const robotPart = create(pb.RobotPartSchema, {
    locationId: 'locId',
    createdOn: timestampNow(),
    name: 'name',
    id: 'id',
    robot: 'robot',
    secrets: [sharedSecret],
    secret: 'secret',
    fqdn: 'fqdn',
  });

  const logEntry = create(LogEntrySchema, {
    level: 'debug',
    loggerName: 'logger',
  });

  const apiKey = create(pb.APIKeySchema, {
    id: 'id',
    name: 'name',
    createdOn: timestampNow(),
    key: 'key',
  });

  const fragment = create(pb.FragmentSchema, {
    id: 'id',
    createdOn: timestampNow(),
    public: true,
    name: 'name',
  });

  const apiKeyWithAuths = create(pb.APIKeyWithAuthorizationsSchema, {
    apiKey,
  });

  const partHistory = create(pb.RobotPartHistoryEntrySchema, {
    old: robotPart,
    part: 'part',
    when: timestampNow(),
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

  const invite = create(pb.OrganizationInviteSchema, {
    email: 'email',
    organizationId: 'id',
    createdOn: timestampNow(),
    authorizations: [authorization],
  });

  const permission = create(pb.AuthorizedPermissionsSchema, {
    resourceType: 'robot',
    resourceId: 'id',
    permissions: ['some', 'permissions'],
  });

  const registryItem = create(pb.RegistryItemSchema, {
    organizationId: 'orgId',
    url: 'url',
    name: 'name',
    type: 2,
    itemId: 'itemId',
    visibility: 2,
  });

  const module = create(pb.ModuleSchema, {
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
            return create(pb.GetUserIDByEmailResponseSchema, {
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
            return create(pb.CreateOrganizationResponseSchema, {
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
            return create(pb.ListOrganizationsResponseSchema, {
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
    const orgIdentity = create(pb.OrganizationIdentitySchema, {
      name: 'name',
      id: 'id',
    });
    const orgIdentities = [orgIdentity];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getOrganizationsWithAccessToLocation: () => {
            return create(
              pb.GetOrganizationsWithAccessToLocationResponseSchema,
              {
                organizationIdentities: orgIdentities,
              }
            );
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
    const orgDetail = create(pb.OrgDetailsSchema, {
      orgId: 'id',
      orgName: 'name',
    });
    const orgDetails = [orgDetail];
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listOrganizationsByUser: () => {
            return create(pb.ListOrganizationsByUserResponseSchema, {
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
            return create(pb.GetOrganizationResponseSchema, {
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
            return create(
              pb.GetOrganizationNamespaceAvailabilityResponseSchema,
              {
                available: true,
              }
            );
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
            return create(pb.UpdateOrganizationResponseSchema, {
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
    const expectedRequest = create(pb.DeleteOrganizationRequestSchema, {
      organizationId: 'id',
    });

    let capReq: pb.DeleteOrganizationRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteOrganization: (req) => {
            capReq = req;
            return create(pb.DeleteOrganizationResponseSchema);
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
    const orgMember = create(pb.OrganizationMemberSchema, {
      userId: 'id',
      dateAdded: timestampNow(),
      emails: ['email'],
    });
    const members = [orgMember];
    const invites = [invite];

    const expectedResponse = create(pb.ListOrganizationMembersResponseSchema, {
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
            return create(pb.CreateOrganizationInviteResponseSchema, {
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
            return create(
              pb.UpdateOrganizationInviteAuthorizationsResponseSchema,
              {
                invite,
              }
            );
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
    const expectedRequest = create(pb.DeleteOrganizationMemberRequestSchema, {
      organizationId: 'orgId',
      userId: 'userId',
    });

    let capReq: pb.DeleteOrganizationMemberRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteOrganizationMember: (req) => {
            capReq = req;
            return create(DeleteOrganizationMemberResponseSchema);
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
    const expectedRequest = create(pb.DeleteOrganizationInviteRequestSchema, {
      organizationId: 'orgId',
      email: 'email',
    });

    let capReq: pb.DeleteOrganizationInviteRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteOrganizationInvite: (req) => {
            capReq = req;
            return create(pb.DeleteOrganizationInviteResponseSchema);
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
            return create(pb.ResendOrganizationInviteResponseSchema, {
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
            return create(pb.CreateLocationResponseSchema, {
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
            return create(pb.GetLocationResponseSchema, {
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
    const newLocation = create(pb.LocationSchema, {
      ...location,
      id: 'newId',
      name: 'newName',
      parentLocationId: 'newParent',
    });

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateLocation: () => {
            return create(pb.UpdateLocationResponseSchema, {
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
    const expectedRequest = create(pb.DeleteLocationRequestSchema, {
      locationId: 'id',
    });

    let capReq: pb.DeleteLocationRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteLocation: (req) => {
            capReq = req;
            return create(pb.DeleteLocationResponseSchema);
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
            return create(pb.ListLocationsResponseSchema, {
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
    const expectedRequest = create(pb.ShareLocationRequestSchema, {
      locationId: 'locId',
      organizationId: 'orgId',
    });

    let capReq: pb.ShareLocationRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          shareLocation: (req) => {
            capReq = req;
            return create(pb.ShareLocationResponseSchema);
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
    const expectedRequest = create(pb.UnshareLocationRequestSchema, {
      organizationId: 'orgId',
      locationId: 'locId',
    });

    let capReq: pb.UnshareLocationRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          unshareLocation: (req) => {
            capReq = req;
            return create(pb.UnshareLocationResponseSchema);
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
            return create(pb.LocationAuthResponseSchema, {
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
            return create(pb.CreateLocationSecretResponseSchema, {
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
    const expectedRequest = create(pb.DeleteLocationSecretRequestSchema, {
      locationId: 'locId',
      secretId: 'secret-id',
    });

    let capReq: pb.DeleteLocationSecretRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteLocationSecret: (req) => {
            capReq = req;
            return create(pb.DeleteLocationSecretResponseSchema);
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
            return create(pb.GetRobotResponseSchema, {
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
            return create(pb.GetRoverRentalRobotsResponseSchema, {
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
            return create(pb.GetRobotPartsResponseSchema, {
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
    const expectedResponse = create(pb.GetRobotPartResponseSchema, {
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
    const expectedResponse = create(
      pb.GetRobotPartByNameAndLocationResponseSchema,
      {
        part: robotPart,
      }
    );
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
    const expectedResponse = create(pb.GetRobotPartLogsResponseSchema, {
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
        createWritableIterable<
          MessageInitShape<typeof pb.TailRobotPartLogsResponseSchema>
        >();
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
        createWritableIterable<
          MessageInitShape<typeof pb.TailRobotPartLogsResponseSchema>
        >();
    });

    it('tailRobotPartLogs', async () => {
      const logs: LogEntry[] = [];
      const promise = subject().tailRobotPartLogs('id', logs);

      await testLogStream.write({
        logs: [logEntry],
      });

      const logEntry2 = create(LogEntrySchema, {
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

      const log1 = logs[0];
      expect(log1?.loggerName).toEqual('logger');
      expect(log1?.level).toEqual('debug');

      const log2 = logs[1];
      expect(log2?.loggerName).toEqual('newLoggerName');
      expect(log2?.level).toEqual('error');
    });
  });

  describe('getRobotPartHistory tests', () => {
    const histories = [partHistory];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobotPartHistory: () => {
            return create(pb.GetRobotPartHistoryResponseSchema, {
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
            return create(pb.UpdateRobotPartResponseSchema, {
              part: robotPart,
            });
          },
        });
      });
    });

    it('updateRobotPart', async () => {
      const response = await subject().updateRobotPart('id', 'name', {});
      expect(response).toEqual(robotPart);
    });
  });

  describe('newRobotPart tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          newRobotPart: () => {
            return create(pb.NewRobotPartResponseSchema, {
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
    const expectedRequest = create(pb.DeleteRobotPartRequestSchema, {
      partId: 'partId',
    });

    let capReq: pb.DeleteRobotPartRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteRobotPart: (req) => {
            capReq = req;
            return create(pb.DeleteRobotPartResponseSchema);
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
            return create(pb.GetRobotAPIKeysResponseSchema, {
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
    const expectedRequest = create(pb.MarkPartAsMainRequestSchema, {
      partId: 'id',
    });

    let capReq: pb.MarkPartAsMainRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          markPartAsMain: (req) => {
            capReq = req;
            return create(pb.MarkPartAsMainResponseSchema);
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
    const expectedRequest = create(pb.MarkPartForRestartRequestSchema, {
      partId: 'id',
    });

    let capReq: pb.MarkPartForRestartRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          markPartForRestart: (req) => {
            capReq = req;
            return create(pb.MarkPartForRestartResponseSchema);
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
            return create(pb.CreateRobotPartSecretResponseSchema, {
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
    const expectedRequest = create(pb.DeleteRobotPartSecretRequestSchema, {
      partId: 'id',
      secretId: 'secretId',
    });

    let capReq: pb.DeleteRobotPartSecretRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteRobotPartSecret: (req) => {
            capReq = req;
            return create(pb.DeleteRobotPartSecretResponseSchema);
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
            return create(pb.ListRobotsResponseSchema, {
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
    const locSummary1 = create(pb.LocationSummarySchema, {});
    const locSummary2 = create(pb.LocationSummarySchema, {});
    const locationSummaries = [locSummary1, locSummary2];
    let capturedReq: pb.ListMachineSummariesRequest | undefined;

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          listMachineSummaries: (req: pb.ListMachineSummariesRequest) => {
            capturedReq = req;
            return create(pb.ListMachineSummariesResponseSchema, {
              locationSummaries,
            });
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
            return create(pb.NewRobotResponseSchema, {
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
            return create(pb.UpdateRobotResponseSchema, {
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
    const expectedRequest = create(pb.DeleteRobotRequestSchema, {
      id: 'deleteRobotId',
    });

    let capReq: pb.DeleteRobotRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteRobot: (req) => {
            capReq = req;
            return create(pb.DeleteRobotResponseSchema);
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
            return create(pb.ListFragmentsResponseSchema, {
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
            return create(pb.GetFragmentResponseSchema, {
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
            return create(pb.CreateFragmentResponseSchema, {
              fragment,
            });
          },
        });
      });
    });

    it('createFragment', async () => {
      const response = await subject().createFragment('orgId', 'name', {});
      expect(response).toEqual(fragment);
    });
  });

  describe('updateFragment tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateFragment: () => {
            return create(pb.UpdateFragmentResponseSchema, {
              fragment,
            });
          },
        });
      });
    });

    it('updateFragment', async () => {
      const response = await subject().updateFragment('id', 'name', {});
      expect(response).toEqual(fragment);
    });
  });

  describe('deleteFragment tests', () => {
    const expectedRequest = create(pb.DeleteFragmentRequestSchema, {
      id: 'id',
    });

    let capReq: pb.DeleteFragmentRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteFragment: (req) => {
            capReq = req;
            return create(pb.DeleteFragmentResponseSchema);
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
            return create(pb.ListMachineFragmentsResponseSchema, {
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
    const expectedRequest = create(pb.AddRoleRequestSchema, {
      authorization,
    });

    let capReq: pb.AddRoleRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          addRole: (req) => {
            capReq = req;
            return create(pb.AddRoleResponseSchema);
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
    const expectedRequest = create(pb.RemoveRoleRequestSchema, {
      authorization,
    });

    let capReq: pb.RemoveRoleRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          removeRole: (req) => {
            capReq = req;
            return create(pb.RemoveRoleResponseSchema);
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
    const newAuthorization = create(pb.AuthorizationSchema, {
      ...authorization,
      organizationId: 'newOrgId',
    });
    const expectedRequest = create(pb.ChangeRoleRequestSchema, {
      oldAuthorization: authorization,
      newAuthorization,
    });

    let capReq: pb.ChangeRoleRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          changeRole: (req) => {
            capReq = req;
            return create(pb.ChangeRoleResponseSchema);
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
            return create(pb.ListAuthorizationsResponseSchema, {
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
            return create(pb.CheckPermissionsResponseSchema, {
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
            return create(pb.GetRegistryItemResponseSchema, {
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
    const expectedRequest = create(pb.CreateRegistryItemRequestSchema, {
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
            return create(pb.CreateRegistryItemResponseSchema);
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
    const expectedRequest = create(pb.UpdateRegistryItemRequestSchema, {
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
            return create(pb.UpdateRegistryItemResponseSchema);
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
            return create(pb.ListRegistryItemsResponseSchema, {
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
    const expectedRequest = create(pb.DeleteRegistryItemRequestSchema, {
      itemId: 'itemId',
    });

    let capReq: pb.DeleteRegistryItemRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteRegistryItem: (req) => {
            capReq = req;
            return create(pb.DeleteRegistryItemResponseSchema);
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
            return create(pb.CreateModuleResponseSchema, {
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
            return create(pb.UpdateModuleResponseSchema, {
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
            return create(pb.GetModuleResponseSchema, {
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
            return create(pb.ListModulesResponseSchema, {
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
            return create(pb.CreateKeyResponseSchema, {
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
    const expectedRequest = create(pb.DeleteKeyRequestSchema, {
      id: 'id',
    });

    let capReq: pb.DeleteKeyRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          deleteKey: (req) => {
            capReq = req;
            return create(pb.DeleteKeyResponseSchema);
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
            return create(pb.ListKeysResponseSchema, {
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
            return create(pb.RotateKeyResponseSchema, {
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
            return create(
              pb.CreateKeyFromExistingKeyAuthorizationsResponseSchema,
              {
                key: 'key',
                id: 'id',
              }
            );
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
            create(pb.GetAppContentResponseSchema, {
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
            create(pb.GetOrganizationMetadataResponseSchema),
        });
      });
    });

    it('returns an empty object if there is no Struct', async () => {
      const response = await subject().getOrganizationMetadata('orgId');
      expect(response).toEqual({});
    });

    it('preserves the map key when a Struct is found', async () => {
      const testResponse = create(pb.GetOrganizationMetadataResponseSchema, {
        data: { key1: 'value1' },
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
            return create(pb.UpdateOrganizationMetadataResponseSchema);
          },
        });
      });
    });

    it('should handle empty metadata correctly', async () => {
      await subject().updateOrganizationMetadata('orgId', {});

      expect(capturedRequest).toEqual(
        create(pb.UpdateOrganizationMetadataRequestSchema, {
          organizationId: 'orgId',
          data: {},
        })
      );
    });

    it('should successfully update metadata with valid data', async () => {
      await subject().updateOrganizationMetadata('orgId', { key1: 'value1' });

      expect(capturedRequest).toEqual(
        create(pb.UpdateOrganizationMetadataRequestSchema, {
          organizationId: 'orgId',
          data: { key1: 'value1' },
        })
      );
    });
  });

  describe('getLocationMetadata', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getLocationMetadata: () =>
            create(pb.GetLocationMetadataResponseSchema),
        });
      });
    });

    it('returns an empty object if there is no Struct', async () => {
      const response = await subject().getLocationMetadata('orgId');
      expect(response).toEqual({});
    });

    it('preserves the map key when a Struct is found', async () => {
      const testResponse = create(pb.GetLocationMetadataResponseSchema, {
        data: { key1: 'value1' },
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
    let capturedRequest: pb.UpdateLocationMetadataRequest;

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateLocationMetadata: (req) => {
            capturedRequest = req;
            return create(pb.UpdateLocationMetadataResponseSchema);
          },
        });
      });
    });

    it('should handle empty metadata correctly', async () => {
      await subject().updateLocationMetadata('locId', {});

      expect(capturedRequest).toEqual(
        create(pb.UpdateLocationMetadataRequestSchema, {
          locationId: 'locId',
          data: {},
        })
      );
    });

    it('should successfully update metadata with valid data', async () => {
      await subject().updateLocationMetadata('locId', { key1: 'value1' });

      expect(capturedRequest).toEqual(
        create(pb.UpdateLocationMetadataRequestSchema, {
          locationId: 'locId',
          data: { key1: 'value1' },
        })
      );
    });
  });

  describe('getRobotMetadata', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobotMetadata: () => create(pb.GetRobotMetadataResponseSchema),
        });
      });
    });

    it('returns an empty object if there is no Struct', async () => {
      const response = await subject().getRobotMetadata('orgId');
      expect(response).toEqual({});
    });

    it('preserves the map key when a Struct is found', async () => {
      const testResponse = create(pb.GetRobotMetadataResponseSchema, {
        data: { key1: 'value1' },
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
    let capturedRequest: pb.UpdateRobotMetadataRequest;

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateRobotMetadata: (req) => {
            capturedRequest = req;
            return create(pb.UpdateRobotMetadataResponseSchema);
          },
        });
      });
    });

    it('should handle empty metadata correctly', async () => {
      await subject().updateRobotMetadata('robotId', {});

      expect(capturedRequest).toEqual(
        create(pb.UpdateRobotMetadataRequestSchema, {
          id: 'robotId',
          data: {},
        })
      );
    });

    it('should successfully update metadata with valid data', async () => {
      await subject().updateRobotMetadata('robotId', { key1: 'value1' });

      expect(capturedRequest).toEqual(
        create(pb.UpdateRobotMetadataRequestSchema, {
          id: 'robotId',
          data: { key1: 'value1' },
        })
      );
    });
  });

  describe('getRobotPartMetadata', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getRobotPartMetadata: () =>
            create(pb.GetRobotPartMetadataResponseSchema),
        });
      });
    });

    it('returns an empty object if there is no Struct', async () => {
      const response = await subject().getRobotPartMetadata('orgId');
      expect(response).toEqual({});
    });

    it('preserves the map key when a Struct is found', async () => {
      const testResponse = create(pb.GetRobotPartMetadataResponseSchema, {
        data: { key1: 'value1' },
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
    let capturedRequest: pb.UpdateRobotPartMetadataRequest;

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          updateRobotPartMetadata: (req) => {
            capturedRequest = req;
            return create(pb.UpdateRobotPartMetadataResponseSchema);
          },
        });
      });
    });

    it('should handle empty metadata correctly', async () => {
      await subject().updateRobotPartMetadata('robotPartId', {});

      expect(capturedRequest).toEqual(
        create(pb.UpdateRobotPartMetadataRequestSchema, {
          id: 'robotPartId',
          data: {},
        })
      );
    });

    it('should successfully update metadata with valid data', async () => {
      await subject().updateRobotPartMetadata('robotPartId', {
        key1: 'value1',
      });

      expect(capturedRequest).toEqual(
        create(pb.UpdateRobotPartMetadataRequestSchema, {
          id: 'robotPartId',
          data: { key1: 'value1' },
        })
      );
    });
  });

  describe('getAppBranding tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(AppService, {
          getAppBranding: () =>
            create(pb.GetAppBrandingResponseSchema, {
              logoPath: '/branding/logo.png',
              textCustomizations: {
                machinePicker: {
                  fields: {
                    heading: 'Welcome',
                    subheading: 'Select your machine.',
                  },
                },
              },
              fragmentIds: ['frag1', 'frag2'],
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
      expect(response.textCustomizations.machinePicker?.fields.heading).toEqual(
        'Welcome'
      );
      expect(
        response.textCustomizations.machinePicker?.fields.subheading
      ).toEqual('Select your machine.');
      expect(response.fragmentIds).toEqual(['frag1', 'frag2']);
    });
  });
});
