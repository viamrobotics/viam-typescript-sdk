import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import * as pb from '../gen/app/v1/app_pb';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import { AppServiceClient } from '../gen/app/v1/app_pb_service';
vi.mock('../gen/app/v1/app_pb_service');
import { AppClient, createAuth } from './app-client';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { LogEntry } from '../gen/common/v1/common_pb';
import { EventDispatcher } from '../events';
import type { ResponseStream, ServiceError } from '../main';
import { Message } from 'google-protobuf';

class TestResponseStream<T> extends EventDispatcher {
  private stream: ResponseStream<unknown>;

  constructor(stream: ResponseStream<unknown>) {
    super();
    this.stream = stream;
  }

  override on(
    type: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (message: any) => void
  ): ResponseStream<T> {
    super.on(type, handler);
    return this;
  }

  cancel(): void {
    this.listeners = {};
    this.stream.cancel();
  }
}

let logStream: ResponseStream<pb.TailRobotPartLogsResponse>;
let testLogStream: TestResponseStream<pb.TailRobotPartLogsResponse> | undefined;

const robotPartLogsMock = ():
  | TestResponseStream<pb.TailRobotPartLogsResponse>
  | undefined => {
  return testLogStream;
};

const subject = () =>
  new AppClient('fakeServiceHost', {
    transport: new FakeTransportBuilder().build(),
  });

describe('AppClient tests', () => {
  const org = new pb.Organization();
  org.setId('id');
  org.setCid('cid');
  org.setName('name');
  org.setDefaultRegion('region');
  org.setPublicNamespace('namespace');
  org.setCreatedOn(new Timestamp());

  const location = new pb.Location();
  location.setCreatedOn(new Timestamp());
  location.setId('id');
  location.setName('name');
  location.setRobotCount(3);
  location.setParentLocationId('parent');

  const auth = new pb.LocationAuth();
  const sharedSecret = new pb.SharedSecret();
  sharedSecret.setCreatedOn(new Timestamp());
  sharedSecret.setState(2);
  sharedSecret.setSecret('super-secret');
  sharedSecret.setId('id');
  auth.setSecretsList([sharedSecret]);
  auth.setLocationId('locId');
  auth.setSecret('secret');

  const robot = new pb.Robot();
  robot.setCreatedOn(new Timestamp());
  robot.setId('id');
  robot.setLocation('location');
  robot.setName('name');

  const roverRentalRobot = new pb.RoverRentalRobot();
  roverRentalRobot.setLocationId('locId');
  roverRentalRobot.setRobotId('robotId');
  roverRentalRobot.setRobotName('name');
  roverRentalRobot.setRobotMainPartId('mainPartId');

  const robotPart = new pb.RobotPart();
  robotPart.setLocationId('locId');
  robotPart.setCreatedOn(new Timestamp());
  robotPart.setName('name');
  robotPart.setId('id');
  robotPart.setRobot('robot');
  robotPart.setSecretsList([sharedSecret]);
  robotPart.setSecret('secret');
  robotPart.setFqdn('fqdn');

  const logEntry = new LogEntry();
  logEntry.setLevel('debug');
  logEntry.setLoggerName('logger');

  const apiKey = new pb.APIKey();
  apiKey.setId('id');
  apiKey.setName('name');
  apiKey.setCreatedOn(new Timestamp());
  apiKey.setKey('key');

  const fragment = new pb.Fragment();
  fragment.setId('id');
  fragment.setCreatedOn(new Timestamp());
  fragment.setPublic(true);
  fragment.setName('name');

  const apiKeyWithAuths = new pb.APIKeyWithAuthorizations();
  apiKeyWithAuths.setApiKey(apiKey);

  const partHistory = new pb.RobotPartHistoryEntry();
  partHistory.setOld(robotPart);
  partHistory.setPart('part');
  partHistory.setWhen(new Timestamp());
  partHistory.setRobot('robot');

  const authorization = createAuth(
    'orgId',
    'entityId',
    'role',
    'resourceType',
    '',
    'resourceId'
  );

  const invite = new pb.OrganizationInvite();
  invite.setEmail('email');
  invite.setOrganizationId('id');
  invite.setCreatedOn(new Timestamp());
  invite.setAuthorizationsList([authorization]);

  const permission = new pb.AuthorizedPermissions();
  permission.setResourceType('robot');
  permission.setResourceId('id');
  permission.setPermissionsList(['some', 'permissions']);

  const registryItem = new pb.RegistryItem();
  registryItem.setOrganizationId('orgId');
  registryItem.setUrl('url');
  registryItem.setName('name');
  registryItem.setType(2);
  registryItem.setItemId('itemId');
  registryItem.setVisibility(2);

  const module = new pb.Module();
  module.setUrl('url');
  module.setModuleId('id');
  module.setDescription('description');
  module.setVisibility(2);
  module.setOrganizationId('orgId');
  module.setName('name');

  describe('getUserIDByEmail tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.getUserIDByEmail = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetUserIDByEmailRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.GetUserIDByEmailResponse();
            response.setUserId('id');
            cb(null, response);
          }
        );
    });

    it('getUserIDByEmail', async () => {
      const response = await subject().getUserIDByEmail('email');
      expect(response).toEqual('id');
    });
  });

  describe('createOrganization tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.createOrganization = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.CreateOrganizationRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.CreateOrganizationResponse();
            response.setOrganization(org);
            cb(null, response);
          }
        );
    });

    it('createOrganization', async () => {
      const response = await subject().createOrganization('name');
      expect(response).toEqual(org.toObject());
    });
  });

  describe('listOrganizations tests', () => {
    const organizations = [org];
    beforeEach(() => {
      AppServiceClient.prototype.listOrganizations = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.ListOrganizationsRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.ListOrganizationsResponse();
            response.setOrganizationsList(organizations);
            cb(null, response);
          }
        );
    });

    it('listOrganizations', async () => {
      const response = await subject().listOrganizations();
      expect(response).toEqual(organizations.map((x) => x.toObject()));
    });
  });

  describe('getOrganizationsWithAccessToLocation tests', () => {
    const orgIdentity = new pb.OrganizationIdentity();
    orgIdentity.setName('name');
    orgIdentity.setId('id');
    const orgIdentities = [orgIdentity];

    beforeEach(() => {
      AppServiceClient.prototype.getOrganizationsWithAccessToLocation = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetOrganizationsWithAccessToLocationRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response =
              new pb.GetOrganizationsWithAccessToLocationResponse();
            response.setOrganizationIdentitiesList(orgIdentities);
            cb(null, response);
          }
        );
    });

    it('getOrganizationsWithAccessToLocation', async () => {
      const response =
        await subject().getOrganizationsWithAccessToLocation('location-id');
      expect(response).toEqual(orgIdentities.map((x) => x.toObject()));
    });
  });

  describe('listOrganizationsByUser tests', () => {
    const orgDetail = new pb.OrgDetails();
    orgDetail.setOrgId('id');
    orgDetail.setOrgName('name');
    const orgDetails = [orgDetail];
    beforeEach(() => {
      AppServiceClient.prototype.listOrganizationsByUser = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.ListOrganizationsByUserRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.ListOrganizationsByUserResponse();
            response.setOrgsList(orgDetails);
            cb(null, response);
          }
        );
    });

    it('listOrganizationsByUser', async () => {
      const response = await subject().listOrganizationsByUser('user');
      expect(response).toEqual(orgDetails.map((x) => x.toObject()));
    });
  });

  describe('getOrganization tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.getOrganization = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetOrganizationRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.GetOrganizationResponse();
            response.setOrganization(org);
            cb(null, response);
          }
        );
    });

    it('getOrganization', async () => {
      const response = await subject().getOrganization('orgId');
      expect(response).toEqual(org.toObject());
    });
  });

  describe('getOrganizationNamespaceAvailability tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.getOrganizationNamespaceAvailability = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetOrganizationNamespaceAvailabilityRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response =
              new pb.GetOrganizationNamespaceAvailabilityResponse();
            response.setAvailable(true);
            cb(null, response);
          }
        );
    });

    it('getOrganizationNamespaceAvailability', async () => {
      const response =
        await subject().getOrganizationNamespaceAvailability('namespace');
      expect(response).toEqual(true);
    });
  });

  describe('updateOrganization tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.updateOrganization = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.UpdateOrganizationRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.UpdateOrganizationResponse();
            response.setOrganization(org);
            cb(null, response);
          }
        );
    });

    it('updateOrganization', async () => {
      const response = await subject().updateOrganization(
        'id',
        'name',
        'namespace',
        'region',
        'cid'
      );
      expect(response).toEqual(org.toObject());
    });
  });

  describe('deleteOrganization tests', () => {
    const expectedRequest = new pb.DeleteOrganizationRequest();
    let methodSpy: MockInstance;
    expectedRequest.setOrganizationId('id');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.DeleteOrganizationRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.DeleteOrganizationResponse();
            cb(null, response);
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.deleteOrganization = methodSpy;
    });

    it('deleteOrganization', async () => {
      await subject().deleteOrganization('id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('listOrganizationMembers tests', () => {
    const orgMember = new pb.OrganizationMember();
    orgMember.setUserId('id');
    orgMember.setDateAdded(new Timestamp());
    orgMember.setEmailsList(['email']);
    const members = [orgMember];
    const invites = [invite];

    const expectedResponse = new pb.ListOrganizationMembersResponse();
    expectedResponse.setOrganizationId('orgId');
    expectedResponse.setMembersList(members);
    expectedResponse.setInvitesList(invites);

    beforeEach(() => {
      AppServiceClient.prototype.listOrganizationMembers = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.ListOrganizationMembersRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, expectedResponse);
          }
        );
    });

    it('listOrganizationMembers', async () => {
      const response = await subject().listOrganizationMembers('id');
      expect(response).toEqual(expectedResponse.toObject());
    });
  });

  describe('createOrganizationInvite tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.createOrganizationInvite = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.CreateOrganizationInviteRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.CreateOrganizationInviteResponse();
            response.setInvite(invite);
            cb(null, response);
          }
        );
    });

    it('createOrganizationInvite', async () => {
      const response = await subject().createOrganizationInvite(
        'orgId',
        'email',
        [],
        false
      );
      expect(response).toEqual(invite.toObject());
    });
  });

  describe('updateOrganizationInviteAuthorizations tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.updateOrganizationInviteAuthorizations = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.UpdateOrganizationInviteAuthorizationsRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response =
              new pb.UpdateOrganizationInviteAuthorizationsResponse();
            response.setInvite(invite);
            cb(null, response);
          }
        );
    });

    it('updateOrganizationInviteAuthorizations', async () => {
      const response = await subject().updateOrganizationInviteAuthorizations(
        'orgId',
        'email',
        [authorization],
        []
      );
      expect(response).toEqual(invite.toObject());
    });
  });

  describe('deleteOrganizationMember tests', () => {
    const expectedRequest = new pb.DeleteOrganizationMemberRequest();
    expectedRequest.setOrganizationId('orgId');
    expectedRequest.setUserId('userId');
    let methodSpy: MockInstance;

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.DeleteOrganizationMemberRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.DeleteOrganizationInviteResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.deleteOrganizationMember = methodSpy;
    });

    it('deleteOrganizationMember', async () => {
      await subject().deleteOrganizationMember('orgId', 'userId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('deleteOrganizationInvite tests', () => {
    const expectedRequest = new pb.DeleteOrganizationInviteRequest();
    expectedRequest.setOrganizationId('orgId');
    expectedRequest.setEmail('email');
    let methodSpy: MockInstance;

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.DeleteOrganizationInviteRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.DeleteOrganizationInviteResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.deleteOrganizationInvite = methodSpy;
    });

    it('deleteOrganizationInvite', async () => {
      await subject().deleteOrganizationInvite('orgId', 'email');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('resendOrganizationInvite tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.resendOrganizationInvite = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.ResendOrganizationInviteRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.ResendOrganizationInviteResponse();
            response.setInvite(invite);
            cb(null, response);
          }
        );
    });

    it('resendOrganizationInvite', async () => {
      const response = await subject().resendOrganizationInvite(
        'orgId',
        'email'
      );
      expect(response).toEqual(invite.toObject());
    });
  });

  describe('createLocation tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.createLocation = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.CreateLocationRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.CreateLocationResponse();
            response.setLocation(location);
            cb(null, response);
          }
        );
    });

    it('createLocation', async () => {
      const response = await subject().createLocation(
        'orgId',
        'name',
        'parent'
      );
      expect(response).toEqual(location.toObject());
    });
  });

  describe('getLocation tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.getLocation = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetLocationRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.GetLocationResponse();
            response.setLocation(location);
            cb(null, response);
          }
        );
    });

    it('getLocation', async () => {
      const response = await subject().getLocation('locId');
      expect(response).toEqual(location.toObject());
    });
  });

  describe('updateLocation tests', () => {
    const newLocation = location.clone();
    newLocation.setId('newId');
    newLocation.setName('newName');
    newLocation.setParentLocationId('newParent');

    beforeEach(() => {
      AppServiceClient.prototype.updateLocation = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.UpdateLocationRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.UpdateLocationResponse();
            response.setLocation(newLocation);
            cb(null, response);
          }
        );
    });

    it('updateLocation', async () => {
      const response = await subject().updateLocation(
        'newLoc',
        'newName',
        'newParent',
        'newRegion'
      );
      expect(response).toEqual(newLocation.toObject());
    });
  });

  describe('deleteLocation tests', () => {
    const expectedRequest = new pb.DeleteLocationRequest();
    expectedRequest.setLocationId('id');

    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.DeleteLocationRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.DeleteLocationResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.deleteLocation = methodSpy;
    });

    it('deleteLocation', async () => {
      await subject().deleteLocation('id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('listLocations tests', () => {
    const locations = [location];
    beforeEach(() => {
      AppServiceClient.prototype.listLocations = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.ListLocationsRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.ListLocationsResponse();
            response.setLocationsList(locations);
            cb(null, response);
          }
        );
    });

    it('listLocations', async () => {
      const response = await subject().listLocations('orgId');
      expect(response).toEqual(locations.map((x) => x.toObject()));
    });
  });

  describe('shareLocation tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.ShareLocationRequest();
    expectedRequest.setLocationId('locId');
    expectedRequest.setOrganizationId('orgId');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.ShareLocationRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.ShareLocationResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.shareLocation = methodSpy;
    });

    it('shareLocation', async () => {
      await subject().shareLocation('orgId', 'locId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('unshareLocation tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.UnshareLocationRequest();
    expectedRequest.setOrganizationId('orgId');
    expectedRequest.setLocationId('locId');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.UnshareLocationRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.UnshareLocationResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.unshareLocation = methodSpy;
    });

    it('unshareLocation', async () => {
      await subject().unshareLocation('orgId', 'locId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('locationAuth tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.locationAuth = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.LocationAuthRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.LocationAuthResponse();
            response.setAuth(auth);
            cb(null, response);
          }
        );
    });

    it('locationAuth', async () => {
      const response = await subject().locationAuth('locId');
      expect(response).toEqual(auth.toObject());
    });
  });

  describe('createLocationSecret tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.createLocationSecret = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.CreateLocationSecretRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.CreateLocationSecretResponse();
            response.setAuth(auth);
            cb(null, response);
          }
        );
    });

    it('createLocationSecret', async () => {
      const response = await subject().createLocationSecret('locId');
      expect(response).toEqual(auth.toObject());
    });
  });

  describe('deleteLocationSecret tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.DeleteLocationSecretRequest();
    expectedRequest.setLocationId('locId');
    expectedRequest.setSecretId('secret-id');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.DeleteLocationSecretRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.DeleteLocationSecretResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.deleteLocationSecret = methodSpy;
    });

    it('deleteLocationSecret', async () => {
      await subject().deleteLocationSecret('locId', 'secret-id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('getRobot tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.getRobot = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetRobotRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.GetRobotResponse();
            response.setRobot(robot);
            cb(null, response);
          }
        );
    });

    it('getRobot', async () => {
      const response = await subject().getRobot('robotId');
      expect(response).toEqual(robot.toObject());
    });
  });

  describe('getRoverRentalRobots tests', () => {
    const roverRentalRobots = [roverRentalRobot];

    beforeEach(() => {
      AppServiceClient.prototype.getRoverRentalRobots = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetRoverRentalRobotsRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.GetRoverRentalRobotsResponse();
            response.setRobotsList(roverRentalRobots);
            cb(null, response);
          }
        );
    });

    it('getRoverRentalRobots', async () => {
      const response = await subject().getRoverRentalRobots('email');
      expect(response).toEqual(roverRentalRobots.map((x) => x.toObject()));
    });
  });

  describe('getRobotParts tests', () => {
    const parts = [robotPart];

    beforeEach(() => {
      AppServiceClient.prototype.getRobotParts = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetRobotPartsRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.GetRobotPartsResponse();
            response.setPartsList(parts);
            cb(null, response);
          }
        );
    });

    it('getRobotParts', async () => {
      const response = await subject().getRobotParts('robotId');
      expect(response).toEqual(parts.map((x) => x.toObject()));
    });
  });

  describe('getRobotPart tests', () => {
    const expectedResponse = new pb.GetRobotPartResponse();
    expectedResponse.setPart(robotPart);
    expectedResponse.setConfigJson('isJson: true');
    beforeEach(() => {
      AppServiceClient.prototype.getRobotPart = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetRobotPartRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, expectedResponse);
          }
        );
    });

    it('getRobotPart', async () => {
      const response = await subject().getRobotPart('email');
      expect(response).toEqual(expectedResponse.toObject());
    });
  });

  describe('getRobotPartLogs tests', () => {
    const expectedResponse = new pb.GetRobotPartLogsResponse();
    const logs = [logEntry];
    expectedResponse.setLogsList(logs);
    expectedResponse.setNextPageToken('nextPage');

    beforeEach(() => {
      AppServiceClient.prototype.getRobotPartLogs = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetRobotPartLogsRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, expectedResponse);
          }
        );
    });

    it('getRobotPartLogs', async () => {
      const response = await subject().getRobotPartLogs('email');
      expect(response).toEqual(expectedResponse.toObject());
    });
  });

  describe('tailRobotPartLogs tests', () => {
    beforeEach(() => {
      testLogStream = new TestResponseStream(logStream);
      AppServiceClient.prototype.tailRobotPartLogs = vi
        .fn()
        .mockImplementation(robotPartLogsMock);
    });

    afterEach(() => {
      testLogStream = undefined;
    });

    it('tailRobotPartLogs', async () => {
      const logs: LogEntry.AsObject[] = [];
      const promise = subject().tailRobotPartLogs('id', logs);

      const response1 = new pb.TailRobotPartLogsResponse();
      response1.setLogsList([logEntry]);
      testLogStream?.emit('data', response1);

      const response2 = new pb.TailRobotPartLogsResponse();
      const logEntry2 = logEntry.clone();
      logEntry2.setLoggerName('newLoggerName');
      logEntry2.setLevel('error');
      response2.setLogsList([logEntry2]);
      testLogStream?.emit('data', response2);
      testLogStream?.emit('end', { code: 0 });

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
      AppServiceClient.prototype.getRobotPartHistory = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetRobotPartHistoryRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.GetRobotPartHistoryResponse();
            response.setHistoryList(histories);
            cb(null, response);
          }
        );
    });

    it('getRobotPartHistory', async () => {
      const response = await subject().getRobotPartHistory('email');
      expect(response).toEqual(histories.map((x) => x.toObject()));
    });
  });

  describe('updateRobotPart tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.updateRobotPart = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.UpdateRobotPartRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.UpdateRobotPartResponse();
            response.setPart(robotPart);
            cb(null, response);
          }
        );
    });

    it('updateRobotPart', async () => {
      const response = await subject().updateRobotPart('id', 'name', {});
      expect(response).toEqual(robotPart.toObject());
    });
  });

  describe('newRobotPart tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.newRobotPart = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.NewRobotPartRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.NewRobotPartResponse();
            response.setPartId('id');
            cb(null, response);
          }
        );
    });

    it('newRobotPart', async () => {
      const response = await subject().newRobotPart('robotId', 'partName');
      expect(response).toEqual('id');
    });
  });

  describe('deleteRobotPart tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.DeleteRobotPartRequest();
    expectedRequest.setPartId('partId');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.DeleteRobotPartRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.DeleteRobotPartResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.deleteRobotPart = methodSpy;
    });

    it('deleteRobotPart', async () => {
      await subject().deleteRobotPart('partId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('getRobotAPIKeys tests', () => {
    const apiKeys = [apiKeyWithAuths];

    beforeEach(() => {
      AppServiceClient.prototype.getRobotAPIKeys = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetRobotAPIKeysRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.GetRobotAPIKeysResponse();
            response.setApiKeysList(apiKeys);
            cb(null, response);
          }
        );
    });

    it('getRobotAPIKeys', async () => {
      const response = await subject().getRobotAPIKeys('robotId');
      expect(response).toEqual(apiKeys.map((x) => x.toObject()));
    });
  });

  describe('markPartAsMain tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.MarkPartAsMainRequest();
    expectedRequest.setPartId('id');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.MarkPartAsMainRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.MarkPartAsMainResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.markPartAsMain = methodSpy;
    });

    it('markPartAsMain', async () => {
      await subject().markPartAsMain('id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('markPartForRestart tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.MarkPartForRestartRequest();
    expectedRequest.setPartId('id');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.MarkPartForRestartRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.MarkPartAsMainResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.markPartForRestart = methodSpy;
    });

    it('markPartForRestart', async () => {
      await subject().markPartForRestart('id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('createRobotPartSecret tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.createRobotPartSecret = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.CreateRobotPartSecretRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.CreateRobotPartSecretResponse();
            response.setPart(robotPart);
            cb(null, response);
          }
        );
    });

    it('createRobotPartSecret', async () => {
      const response = await subject().createRobotPartSecret('partId');
      expect(response).toEqual(robotPart.toObject());
    });
  });

  describe('deleteRobotPartSecret tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.DeleteRobotPartSecretRequest();
    expectedRequest.setPartId('id');
    expectedRequest.setSecretId('secretId');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.DeleteRobotPartSecretRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.DeleteRobotPartSecretResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.deleteRobotPartSecret = methodSpy;
    });

    it('deleteRobotPartSecret', async () => {
      await subject().deleteRobotPartSecret('id', 'secretId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('listRobots tests', () => {
    const robots = [robot];

    beforeEach(() => {
      AppServiceClient.prototype.listRobots = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.ListRobotsRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.ListRobotsResponse();
            response.setRobotsList(robots);
            cb(null, response);
          }
        );
    });

    it('listRobots', async () => {
      const response = await subject().listRobots('locId');
      expect(response).toEqual(robots.map((x) => x.toObject()));
    });
  });

  describe('newRobot tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.newRobot = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.NewRobotRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.NewRobotResponse();
            response.setId('robotId');
            cb(null, response);
          }
        );
    });

    it('newRobot', async () => {
      const response = await subject().newRobot('locId', 'name');
      expect(response).toEqual('robotId');
    });
  });

  describe('updateRobot tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.updateRobot = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.UpdateRobotRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.UpdateRobotResponse();
            response.setRobot(robot);
            cb(null, response);
          }
        );
    });

    it('updateRobot', async () => {
      const response = await subject().updateRobot(
        'robotId',
        'locationId',
        'name'
      );
      expect(response).toEqual(robot.toObject());
    });
  });

  describe('deleteRobot tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.DeleteRobotRequest();
    expectedRequest.setId('deleteRobotId');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.DeleteRobotRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.DeleteRobotResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.deleteRobot = methodSpy;
    });

    it('deleteRobot', async () => {
      await subject().deleteRobot('deleteRobotId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('listFragments tests', () => {
    const fragments = [fragment];

    beforeEach(() => {
      AppServiceClient.prototype.listFragments = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.ListFragmentsRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.ListFragmentsResponse();
            response.setFragmentsList(fragments);
            cb(null, response);
          }
        );
    });

    it('listFragments', async () => {
      const response = await subject().listFragments('orgId');
      expect(response).toEqual(fragments.map((x) => x.toObject()));
    });
  });

  describe('getFragment tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.getFragment = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetFragmentRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.GetFragmentResponse();
            response.setFragment(fragment);
            cb(null, response);
          }
        );
    });

    it('getFragment', async () => {
      const response = await subject().getFragment('id');
      expect(response).toEqual(fragment.toObject());
    });
  });

  describe('createFragment tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.createFragment = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.CreateFragmentRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.CreateFragmentResponse();
            response.setFragment(fragment);
            cb(null, response);
          }
        );
    });

    it('createFragment', async () => {
      const response = await subject().createFragment('orgId', 'name', {});
      expect(response).toEqual(fragment.toObject());
    });
  });

  describe('updateFragment tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.updateFragment = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.UpdateFragmentRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.UpdateFragmentResponse();
            response.setFragment(fragment);
            cb(null, response);
          }
        );
    });

    it('updateFragment', async () => {
      const response = await subject().updateFragment('id', 'name', {});
      expect(response).toEqual(fragment.toObject());
    });
  });

  describe('deleteFragment tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.DeleteFragmentRequest();
    expectedRequest.setId('id');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.DeleteFragmentRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.DeleteFragmentResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.deleteFragment = methodSpy;
    });

    it('deleteFragment', async () => {
      await subject().deleteFragment('id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('addRole tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.AddRoleRequest();
    expectedRequest.setAuthorization(authorization);

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.AddRoleRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.AddRoleResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.addRole = methodSpy;
    });

    it('addRole', async () => {
      await subject().addRole(
        'orgId',
        'entityId',
        'role',
        'resourceType',
        'resourceId'
      );
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('removeRole tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.RemoveRoleRequest();
    expectedRequest.setAuthorization(authorization);

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.RemoveRoleRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.RemoveRoleResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.removeRole = methodSpy;
    });

    it('removeRole', async () => {
      await subject().removeRole(
        'orgId',
        'entityId',
        'role',
        'resourceType',
        'resourceId'
      );
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('changeRole tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.ChangeRoleRequest();
    expectedRequest.setOldAuthorization(authorization);
    const newAuthorization = authorization.clone();
    newAuthorization.setOrganizationId('newOrgId');
    expectedRequest.setNewAuthorization(newAuthorization);

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.ChangeRoleRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.ChangeRoleResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.changeRole = methodSpy;
    });

    it('changeRole', async () => {
      await subject().changeRole(authorization, newAuthorization);
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('listAuthorizations tests', () => {
    const authorizations = [authorization];

    beforeEach(() => {
      AppServiceClient.prototype.listAuthorizations = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.ListAuthorizationsRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.ListAuthorizationsResponse();
            response.setAuthorizationsList(authorizations);
            cb(null, response);
          }
        );
    });

    it('listAuthorizations', async () => {
      const response = await subject().listAuthorizations('orgId');
      expect(response).toEqual(authorizations.map((x) => x.toObject()));
    });
  });

  describe('checkPermissions tests', () => {
    const permissions = [permission];
    beforeEach(() => {
      AppServiceClient.prototype.checkPermissions = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.CheckPermissionsRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.CheckPermissionsResponse();
            response.setAuthorizedPermissionsList(permissions);
            cb(null, response);
          }
        );
    });

    it('checkPermissions', async () => {
      const response = await subject().checkPermissions(permissions);
      expect(response).toEqual(permissions.map((x) => x.toObject()));
    });
  });

  describe('getRegistryItem tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.getRegistryItem = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetRegistryItemRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.GetRegistryItemResponse();
            response.setItem(registryItem);
            cb(null, response);
          }
        );
    });

    it('getRegistryItem', async () => {
      const response = await subject().getRegistryItem('itemId');
      expect(response).toEqual(registryItem.toObject());
    });
  });

  describe('createRegistryItem tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.CreateRegistryItemRequest();
    expectedRequest.setType(2);
    expectedRequest.setName('name');
    expectedRequest.setOrganizationId('orgId');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.CreateRegistryItemRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.CreateRegistryItemResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.createRegistryItem = methodSpy;
    });

    it('createRegistryItem', async () => {
      await subject().createRegistryItem(
        'orgId',
        'name',
        'PACKAGE_TYPE_ML_MODEL'
      );
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('updateRegistryItem tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.UpdateRegistryItemRequest();
    expectedRequest.setType(2);
    expectedRequest.setVisibility(2);
    expectedRequest.setItemId('itemId');
    expectedRequest.setDescription('description');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.UpdateRegistryItemRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.UpdateRegistryItemResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.updateRegistryItem = methodSpy;
    });

    it('updateRegistryItem', async () => {
      await subject().updateRegistryItem(
        'itemId',
        'PACKAGE_TYPE_ML_MODEL',
        'description',
        'VISIBILITY_PUBLIC'
      );
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('listRegistryItems tests', () => {
    const items = [registryItem];

    beforeEach(() => {
      AppServiceClient.prototype.listRegistryItems = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.ListRegistryItemsRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.ListRegistryItemsResponse();
            response.setItemsList(items);
            cb(null, response);
          }
        );
    });

    it('listRegistryItems', async () => {
      const response = await subject().listRegistryItems(
        'orgId',
        ['PACKAGE_TYPE_ML_MODEL', 'PACKAGE_TYPE_ARCHIVE'],
        ['VISIBILITY_PUBLIC'],
        ['mac', 'unix'],
        ['REGISTRY_ITEM_STATUS_PUBLISHED'],
        'search',
        'token'
      );
      expect(response).toEqual(items.map((x) => x.toObject()));
    });
  });

  describe('deleteRegistryItem tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.DeleteRegistryItemRequest();
    expectedRequest.setItemId('itemId');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.DeleteRegistryItemRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.DeleteRegistryItemResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.deleteRegistryItem = methodSpy;
    });

    it('deleteRegistryItem', async () => {
      await subject().deleteRegistryItem('itemId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('createModule tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.createModule = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.CreateModuleRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.CreateModuleResponse();
            response.setUrl('url');
            response.setModuleId('id');
            cb(null, response);
          }
        );
    });

    it('createModule', async () => {
      const response = await subject().createModule('orgId', 'name');
      expect(response.url).toEqual('url');
      expect(response.moduleId).toEqual('id');
    });
  });

  describe('updateModule tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.updateModule = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.UpdateModuleRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.UpdateModuleResponse();
            response.setUrl('url');
            cb(null, response);
          }
        );
    });

    it('updateModule', async () => {
      const response = await subject().updateModule(
        'moduleId',
        'VISIBILITY_PRIVATE',
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
      AppServiceClient.prototype.getModule = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.GetModuleRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.GetModuleResponse();
            response.setModule(module);
            cb(null, response);
          }
        );
    });

    it('getModule', async () => {
      const response = await subject().getModule('id');
      expect(response).toEqual(module.toObject());
    });
  });

  describe('listModules tests', () => {
    const modules = [module];

    beforeEach(() => {
      AppServiceClient.prototype.listModules = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.ListModulesRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.ListModulesResponse();
            response.setModulesList(modules);
            cb(null, response);
          }
        );
    });

    it('listModules', async () => {
      const response = await subject().listModules('orgId');
      expect(response).toEqual(modules.map((x) => x.toObject()));
    });
  });

  describe('createKey tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.createKey = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.CreateKeyRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.CreateKeyResponse();
            response.setId('id');
            response.setKey('key');
            cb(null, response);
          }
        );
    });

    it('createKey', async () => {
      const response = await subject().createKey([authorization], 'name');
      expect(response.id).toEqual('id');
      expect(response.key).toEqual('key');
    });
  });

  describe('deleteKey tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.DeleteKeyRequest();
    expectedRequest.setId('id');

    beforeEach(() => {
      methodSpy = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.DeleteKeyRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            cb(null, new pb.DeleteKeyResponse());
          }
        );
      // @ts-expect-error compiler is matching incorrect function signature
      AppServiceClient.prototype.deleteKey = methodSpy;
    });

    it('deleteKey', async () => {
      await subject().deleteKey('id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('listKeys tests', () => {
    const keys = [apiKeyWithAuths];

    beforeEach(() => {
      AppServiceClient.prototype.listKeys = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.ListKeysRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.ListKeysResponse();
            response.setApiKeysList(keys);
            cb(null, response);
          }
        );
    });

    it('listKeys', async () => {
      const response = await subject().listKeys('orgId');
      expect(response).toEqual(keys.map((x) => x.toObject()));
    });
  });

  describe('rotateKey tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.rotateKey = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.RotateKeyRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response = new pb.RotateKeyResponse();
            response.setId('newId');
            response.setKey('eyK');
            cb(null, response);
          }
        );
    });

    it('rotateKey', async () => {
      const response = await subject().rotateKey('id');
      expect(response.key).toEqual('eyK');
      expect(response.id).toEqual('newId');
    });
  });

  describe('createKeyFromExistingKeyAuthorizations tests', () => {
    beforeEach(() => {
      AppServiceClient.prototype.createKeyFromExistingKeyAuthorizations = vi
        .fn()
        .mockImplementationOnce(
          (
            _req: pb.CreateKeyFromExistingKeyAuthorizationsRequest,
            _md,
            cb: (_: ServiceError | null, __: Message) => void
          ) => {
            const response =
              new pb.CreateKeyFromExistingKeyAuthorizationsResponse();
            response.setKey('key');
            response.setId('id');
            cb(null, response);
          }
        );
    });

    it('createKeyFromExistingKeyAuthorizations', async () => {
      const response =
        await subject().createKeyFromExistingKeyAuthorizations('id');
      expect(response.key).toEqual('key');
      expect(response.id).toEqual('id');
    });
  });
});
