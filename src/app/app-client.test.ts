import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import * as pb from '../gen/app/v1/app_pb';

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { AppServiceClient } from '../gen/app/v1/app_pb_service';
vi.mock('../gen/app/v1/app_pb_service');
import { AppClient } from './app-client';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { LogEntry } from '../gen/common/v1/common_pb';
import { EventDispatcher } from '../events';
import type { ResponseStream } from '../main';

const subject = () =>
  new AppClient('fakeServiceHost', {
    transport: new FakeTransportBuilder().build(),
});

describe('AppClient tests', () => {
  const org = new pb.Organization();
  org.setId("id");
  org.setCid("cid");
  org.setName("name");
  org.setDefaultRegion("region");
  org.setPublicNamespace("namespace");
  org.setCreatedOn(new Timestamp());

  const location = new pb.Location();
  location.setCreatedOn(new Timestamp());
  location.setId("id");
  location.setName("name");
  location.setRobotCount(3);
  location.setParentLocationId("parent");

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

  const authorization = new pb.Authorization();
  authorization.setIdentityId('identityId');
  authorization.setResourceId('resourceId');
  authorization.setIdentityType('api-key');
  authorization.setResourceType('robot');
  authorization.setOrganizationId('orgId');

  const invite = new pb.OrganizationInvite();
  invite.setEmail("email");
  invite.setOrganizationId("id");
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
      vi.spyOn(AppServiceClient.prototype, 'getUserIDByEmail')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetUserIDByEmailRequest, cb) => {
        const response = new pb.GetUserIDByEmailResponse();
        response.setUserId('id');
        cb(null, response);
      });
    });

    it('getUserIDByEmail', async () => {
      const response = await subject().getUserIDByEmail('email');
      expect(response).toEqual('id');
    });
  });

  describe('createOrganization tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'createOrganization')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.CreateOrganizationRequest, cb) => {
        const response = new pb.CreateOrganizationResponse();
        response.setOrganization(org);
        cb(null, response);
      });
    });

    it('createOrganization', async () => {
      const response = await subject().createOrganization("name");
      expect(response).toEqual(org.toObject());
    });
  });

  describe('listOrganizations tests', () => {
    const organizations = [org];
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'listOrganizations')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.ListOrganizationsRequest, cb) => {
        const response = new pb.ListOrganizationsResponse();
        response.setOrganizationsList(organizations);
        cb(null, response);
      });
    });

    it('listOrganizations', async () => {
      const response = await subject().listOrganizations();
      expect(response).toEqual(organizations.map((x) => x.toObject()));
    });
  });

  describe('getOrganizationsWithAccessToLocation tests', () => {
    const orgIdentity = new pb.OrganizationIdentity();
    orgIdentity.setName("name");
    orgIdentity.setId("id");
    const orgIdentities = [orgIdentity];

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'getOrganizationsWithAccessToLocation')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetOrganizationsWithAccessToLocationRequest, cb) => {
        const response = new pb.GetOrganizationsWithAccessToLocationResponse();
        response.setOrganizationIdentitiesList(orgIdentities);
        cb(null, response);
      });
    });

    it('getOrganizationsWithAccessToLocation', async () => {
      const response = await subject().getOrganizationsWithAccessToLocation('location-id');
      expect(response).toEqual(orgIdentities.map((x) => x.toObject()));
    });
  });

  describe('listOrganizationsByUser tests', () => {
    const orgDetail = new pb.OrgDetails();
    orgDetail.setOrgId("id");
    orgDetail.setOrgName("name");
    const orgDetails = [orgDetail];
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'listOrganizationsByUser')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.ListOrganizationsByUserRequest, cb) => {
        const response = new pb.ListOrganizationsByUserResponse();
        response.setOrgsList(orgDetails);
        cb(null, response);
      });
    });

    it('listOrganizationsByUser', async () => {
      const response = await subject().listOrganizationsByUser('user');
      expect(response).toEqual(orgDetails.map((x) => x.toObject()));
    });
  });

  describe('getOrganization tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'getOrganization')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetOrganizationRequest, cb) => {
        const response = new pb.GetOrganizationResponse();
        response.setOrganization(org);
        cb(null, response);
      });
    });

    it('getOrganization', async () => {
      const response = await subject().getOrganization('orgId');
      expect(response).toEqual(org.toObject());
    });
  });

  describe('getOrganizationNamespaceAvailability tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'getOrganizationNamespaceAvailability')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((req: pb.GetOrganizationNamespaceAvailabilityRequest, cb) => {
        const response = new pb.GetOrganizationNamespaceAvailabilityResponse();
        const isAvailable = req.getPublicNamespace() === 'namespace';
        response.setAvailable(isAvailable);
        cb(null, response);
      });
    });

    it('getOrganizationNamespaceAvailability', async () => {
      const response = await subject().getOrganizationNamespaceAvailability('namespace');
      expect(response).toEqual(true);
      const falseResponse = await subject().getOrganizationNamespaceAvailability('unavailable');
      expect(falseResponse).toEqual(false);
    });
  });

  describe('updateOrganization tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'updateOrganization')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.UpdateOrganizationRequest, cb) => {
        const response = new pb.UpdateOrganizationResponse();
        response.setOrganization(org);
        cb(null, response);
      });
    });

    it('updateOrganization', async () => {
      const response = await subject().updateOrganization('id', 'name', 'namespace', 'region', 'cid');
      expect(response).toEqual(org.toObject());
    });
  });

  describe('deleteOrganization tests', () => {
    const expectedRequest = new pb.DeleteOrganizationRequest();
    let methodSpy: MockInstance;
    expectedRequest.setOrganizationId('id');

    beforeEach(() => {
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'deleteOrganization')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.DeleteOrganizationRequest, cb) => {
        const response = new pb.DeleteOrganizationResponse();
        cb(null, response);
      });
    });

    it('deleteOrganization', async () => {
      await subject().deleteOrganization('id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('listOrganizationMembers tests', () => {
    const orgMember = new pb.OrganizationMember();
    orgMember.setUserId("id");
    orgMember.setDateAdded(new Timestamp());
    orgMember.setEmailsList(["email"]);
    const members = [orgMember];
    const invites = [invite];

    const expectedResponse = new pb.ListOrganizationMembersResponse();
    expectedResponse.setOrganizationId('orgId');
    expectedResponse.setMembersList(members);
    expectedResponse.setInvitesList(invites);

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'listOrganizationMembers')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.ListOrganizationMembersRequest, cb) => {
        cb(null, expectedResponse);
      });
    });

    it('listOrganizationMembers', async () => {
      const response = await subject().listOrganizationMembers('id');
      expect(response).toEqual(expectedResponse.toObject());
    });
  });

  describe('createOrganizationInvite tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'createOrganizationInvite')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.CreateOrganizationInviteRequest, cb) => {
        const response = new pb.CreateOrganizationInviteResponse();
        response.setInvite(invite);
        cb(null, response);
      });
    });

    it('createOrganizationInvite', async () => {
      const response = await subject().createOrganizationInvite('orgId', 'email', [], false);
      expect(response.invite).toEqual(invite.toObject());
    });
  });

  describe('updateOrganizationInviteAuthorizations tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'updateOrganizationInviteAuthorizations')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.UpdateOrganizationInviteAuthorizationsRequest, cb) => {
        const response = new pb.UpdateOrganizationInviteAuthorizationsResponse();
        response.setInvite(invite);
        cb(null, response);
      });
    });

    it('updateOrganizationInviteAuthorizations', async () => {
      const response = await subject().updateOrganizationInviteAuthorizations('orgId', 'email', [authorization], []);
      expect(response).toEqual(invite.toObject());
    });
  });

  describe('deleteOrganizationMember tests', () => {
    const expectedRequest = new pb.DeleteOrganizationMemberRequest();
    expectedRequest.setOrganizationId("orgId");
    expectedRequest.setUserId("userId");
    let methodSpy: MockInstance;

    beforeEach(() => {
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'deleteOrganizationMember')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.DeleteOrganizationMemberRequest, cb) => {
        cb(null, new pb.DeleteOrganizationInviteResponse());
      });
    });

    it('deleteOrganizationMember', async () => {
      await subject().deleteOrganizationMember('orgId', 'userId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('deleteOrganizationInvite tests', () => {
    const expectedRequest = new pb.DeleteOrganizationInviteRequest();
    expectedRequest.setOrganizationId("orgId");
    expectedRequest.setEmail("email");
    let methodSpy: MockInstance;

    beforeEach(() => {
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'deleteOrganizationInvite')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.DeleteOrganizationInviteRequest, cb) => {
        cb(null, new pb.DeleteOrganizationInviteResponse);
      });
    });

    it('deleteOrganizationInvite', async () => {
      await subject().deleteOrganizationInvite('id', 'email');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('resendOrganizationInvite tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'resendOrganizationInvite')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.ResendOrganizationInviteRequest, cb) => {
        const response = new pb.ResendOrganizationInviteResponse();
        response.setInvite(invite);
        cb(null, response);
      });
    });

    it('resendOrganizationInvite', async () => {
      const response = await subject().resendOrganizationInvite('orgId', 'email');
      expect(response.invite).toEqual(invite.toObject());
    });
  });

  describe('createLocation tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'createLocation')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.CreateLocationRequest, cb) => {
        const response = new pb.CreateLocationResponse();
        response.setLocation(location);
        cb(null, response);
      });
    });

    it('createLocation', async () => {
      const response = await subject().createLocation('orgId', 'name', 'parent');
      expect(response.location).toEqual(location.toObject());
    });
  });

  describe('getLocation tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'getLocation')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetLocationRequest, cb) => {
        const response = new pb.GetLocationResponse();
        response.setLocation(location);
        cb(null, response);
      });
    });

    it('getLocation', async () => {
      const response = await subject().getLocation('locId');
      expect(response.location).toEqual(location.toObject());
    });
  });

  describe('updateLocation tests', () => {
    const newLocation = location.clone();
    newLocation.setId("newId");
    newLocation.setName("newName");
    newLocation.setParentLocationId("newParent");

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'updateLocation')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.UpdateLocationRequest, cb) => {
        const response = new pb.UpdateLocationResponse();
        response.setLocation(newLocation);
        cb(null, response);
      });
    });

    it('updateLocation', async () => {
      const response = await subject().updateLocation('newLoc', 'newName', 'newParent', 'newRegion');
      expect(response.location).toEqual(newLocation.toObject());
    });
  });

  describe('deleteLocation tests', () => {
    const expectedRequest = new pb.DeleteLocationRequest();
    expectedRequest.setLocationId("id");

    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'deleteLocation')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.DeleteLocationRequest, cb) => {
        cb(null, new pb.DeleteLocationResponse());
      });
    });

    it('deleteLocation', async () => {
      await subject().deleteLocation('id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('listLocations tests', () => {
    const locations = [location];
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'listLocations')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.ListLocationsRequest, cb) => {
        const response = new pb.ListLocationsResponse();
        response.setLocationsList(locations);
        cb(null, response);
      });
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
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'shareLocation')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.ShareLocationRequest, cb) => {
        cb(null, new pb.ShareLocationResponse());
      });
    });

    it('shareLocation', async () => {
      await subject().shareLocation('orgId', 'locId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('unshareLocation tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.UnshareLocationRequest();
    expectedRequest.setLocationId('locId');
    expectedRequest.setOrganizationId('orgId');

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'unshareLocation')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.UnshareLocationRequest, cb) => {
        cb(null, new pb.UnshareLocationResponse());
      });
    });

    it('unshareLocation', async () => {
      await subject().shareLocation('orgId', 'locId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('locationAuth tests', () => {

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'locationAuth')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.LocationAuthRequest, cb) => {
        const response = new pb.LocationAuthResponse();
        response.setAuth(auth);
        cb(null, response);
      });
    });

    it('locationAuth', async () => {
      const response = await subject().locationAuth('locId');
      expect(response).toEqual(auth.toObject());
    });
  });

  describe('createLocationSecret tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'createLocationSecret')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.CreateLocationSecretRequest, cb) => {
        const response = new pb.CreateLocationSecretResponse();
        response.setAuth(auth);
        cb(null, response);
      });
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
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'deleteLocationSecret')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.DeleteLocationSecretRequest, cb) => {
        cb(null, new pb.DeleteLocationSecretResponse());
      });
    });

    it('deleteLocationSecret', async () => {
      await subject().deleteLocationSecret('locId', 'secret-id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('getRobot tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'getRobot')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetRobotRequest, cb) => {
        const response = new pb.GetRobotResponse();
        response.setRobot(robot);
        cb(null, response);
      });
    });

    it('getRobot', async () => {
      const response = await subject().getRobot('robotId');
      expect(response.robot).toEqual(robot.toObject());
    });
  });

  describe('getRoverRentalRobots tests', () => {
    const roverRentalRobots = [roverRentalRobot];

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'getRoverRentalRobots')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetRoverRentalRobotsRequest, cb) => {
        const response = new pb.GetRoverRentalRobotsResponse();
        response.setRobotsList(roverRentalRobots);
        cb(null, response);
      });
    });

    it('getRoverRentalRobots', async () => {
      const response = await subject().getRoverRentalRobots('email');
      expect(response).toEqual(roverRentalRobots.map((x) => x.toObject()));
    });
  });

  describe('getRobotParts tests', () => {
    const parts = [robotPart];

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'getRobotParts')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetRobotPartsRequest, cb) => {
        const response = new pb.GetRobotPartsResponse();
        response.setPartsList(parts);
        cb(null, response);
      });
    });

    it('getRobotParts', async () => {
      const response = await subject().getRobotParts('robotId');
      expect(response).toEqual(robotPart.toObject());
    });
  });

  describe('getRobotPart tests', () => {
    const expectedResponse = new pb.GetRobotPartResponse();
    expectedResponse.setPart(robotPart);
    expectedResponse.setConfigJson('isJson: true');
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'getRobotPart')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetRobotPartRequest, cb) => {
        cb(null, expectedResponse);
      });
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
      vi.spyOn(AppServiceClient.prototype, 'getRobotPartLogs')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetRobotPartLogsRequest, cb) => {
        cb(null, expectedResponse);
      });
    });

    it('getRobotPartLogs', async () => {
      const response = await subject().getRobotPartLogs('email');
      expect(response).toEqual(expectedResponse.toObject());
    });
  });

  // CR erodkin: make sure this actually works!
  describe('tailRobotPartLogs tests', () => {
    class TestResponseStream<T> extends EventDispatcher {
      private stream: ResponseStream<any>;

      constructor(stream: ResponseStream<any>) {
        super();
        this.stream = stream;
      }

      override on(
        type: string,
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

    beforeEach(() => {
      testLogStream = new TestResponseStream(logStream);
      AppServiceClient.prototype.tailRobotPartLogs = vi
        .fn()
        .mockImplementation(robotPartLogsMock);
      vi.spyOn(AppServiceClient.prototype, 'tailRobotPartLogs')
      // // CR erodkin: make sure we can delete all this?
      // .mockImplementationOnce((_req: pb.TailRobotPartLogsRequest, cb) => {
        // const response = new pb.TailRobotPartLogsResponse();
        // response.setLogsList
        // cb(null, response);
      // });
    });

    afterEach(() => {
      testLogStream = undefined;
    });

    it('tailRobotPartLogs', async () => {
      const logs: LogEntry.AsObject[] = [];
      await subject().tailRobotPartLogs('id', logs);
      const response1 = new pb.TailRobotPartLogsResponse();
      response1.addLogs(logEntry);
      testLogStream?.emit('data', response1);

      const response2 = response1.clone();
      const logEntry2 = logEntry.clone();
      logEntry2.setLoggerName('newLoggerName');
      logEntry2.setLevel('error');
      response2.addLogs(logEntry2);
      testLogStream?.emit('data', response2);

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
      vi.spyOn(AppServiceClient.prototype, 'getRobotPartHistory')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetRobotPartHistoryRequest, cb) => {
        const response = new pb.GetRobotPartHistoryResponse();
        response.setHistoryList(histories);
        cb(null, response);
      });
    });

    it('getRobotPartHistory', async () => {
      const response = await subject().getRobotPartHistory('email');
      expect(response).toEqual(histories.map((x) => x.toObject()));
    });
  });

  describe('updateRobotPart tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'updateRobotPart')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.UpdateRobotPartRequest, cb) => {
        const response = new pb.UpdateRobotPartResponse();
        response.setPart(robotPart);
        cb(null, response);
      });
    });

    it('updateRobotPart', async () => {
      const response = await subject().updateRobotPart('id', 'name', {});
      expect(response.part).toEqual(robotPart.toObject());
    });
  });

  describe('newRobotPart tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'newRobotPart')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.NewRobotPartRequest, cb) => {
        const response = new pb.NewRobotPartResponse();
        response.setPartId('id');
        cb(null, response);
      });
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
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'deleteRobotPart')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.DeleteRobotPartRequest, cb) => {
        cb(null, new pb.DeleteRobotPartResponse());
      });
    });

    it('deleteRobotPart', async () => {
      await subject().deleteRobotPart('email');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('getRobotAPIKeys tests', () => {
    const apiKeys = [apiKeyWithAuths];

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'getRobotAPIKeys')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetRobotAPIKeysRequest, cb) => {
        const response = new pb.GetRobotAPIKeysResponse();
        response.setApiKeysList(apiKeys);
        cb(null, response);
      });
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
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'markPartAsMain')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.MarkPartAsMainRequest, cb) => {
        cb(null, new pb.MarkPartAsMainResponse());
      });
    });

    it('markPartAsMain', async () => {
      await subject().markPartAsMain('id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('markPartForRestart tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.MarkPartForRestartRequest();
    expectedRequest.setPartId('id');

    beforeEach(() => {
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'markPartForRestart')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.MarkPartForRestartRequest, cb) => {
        cb(null, new pb.MarkPartAsMainResponse());
      });
    });

    it('markPartForRestart', async () => {
      await subject().markPartForRestart('id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('createRobotPartSecret tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'createRobotPartSecret')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.CreateRobotPartSecretRequest, cb) => {
        const response = new pb.CreateRobotPartSecretResponse();
        response.setPart(robotPart);
        cb(null, response);
      });
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
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'deleteRobotPartSecret')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.DeleteRobotPartSecretRequest, cb) => {
        cb(null, new pb.DeleteRobotPartSecretResponse());
      });
    });

    it('deleteRobotPartSecret', async () => {
      await subject().deleteRobotPartSecret('id', 'secretId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('listRobots tests', () => {
    const robots = [robot];

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'listRobots')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.ListRobotsRequest, cb) => {
        const response = new pb.ListRobotsResponse();
        response.setRobotsList(robots);
        cb(null, response);
      });
    });

    it('listRobots', async () => {
      const response = await subject().listRobots('locId');
      expect(response).toEqual(robots.map((x) => x.toObject()));
    });
  });

  describe('newRobot tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'newRobot')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.NewRobotRequest, cb) => {
        const response = new pb.NewRobotResponse();
        response.setId('robotId');
        cb(null, response);
      });
    });

    it('newRobot', async () => {
      const response = await subject().newRobot('locId', 'name');
      expect(response).toEqual('robotId');
    });
  });

  describe('updateRobot tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'updateRobot')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.UpdateRobotRequest, cb) => {
        const response = new pb.UpdateRobotResponse();
        response.setRobot(robot);
        cb(null, response);
      });
    });

    it('updateRobot', async () => {
      const response = await subject().updateRobot('robotId', 'locationId', 'name');
      expect(response).toEqual(robot.toObject());
    });
  });

  describe('deleteRobot tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.DeleteRobotRequest();
    expectedRequest.setId('deleteRobotId');

    beforeEach(() => {
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'deleteRobot')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.DeleteRobotRequest, cb) => {
        cb(null, new pb.DeleteRobotResponse());
      });
    });

    it('deleteRobot', async () => {
      await subject().deleteRobot('deleteRobotId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('listFragments tests', () => {
    const fragments = [fragment];

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'listFragments')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.ListFragmentsRequest, cb) => {
        const response = new pb.ListFragmentsResponse();
        response.setFragmentsList(fragments);
        cb(null, response);
      });
    });

    it('listFragments', async () => {
      const response = await subject().listFragments('orgId');
      expect(response).toEqual(fragments.map((x) => x.toObject()));
    });
  });

  describe('getFragment tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'getFragment')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetFragmentRequest, cb) => {
        const response = new pb.GetFragmentResponse();
        response.setFragment(fragment);
        cb(null, response);
      });
    });

    it('getFragment', async () => {
      const response = await subject().getFragment('id');
      expect(response.fragment).toEqual(fragment.toObject());
    });
  });

  describe('createFragment tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'createFragment')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.CreateFragmentRequest, cb) => {
        const response = new pb.CreateFragmentResponse();
        response.setFragment(fragment);
        cb(null, response);
      });
    });

    it('createFragment', async () => {
      const response = await subject().createFragment('orgId', 'name', {});
      expect(response.fragment).toEqual(fragment.toObject());
    });
  });

  describe('updateFragment tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'updateFragment')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.UpdateFragmentRequest, cb) => {
        const response = new pb.UpdateFragmentResponse();
        response.setFragment(fragment);
        cb(null, response);
      });
    });

    it('updateFragment', async () => {
      const response = await subject().updateFragment('id', 'name', {});
      expect(response.fragment).toEqual(fragment.toObject());
    });
  });

  describe('deleteFragment tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.DeleteFragmentRequest();
    expectedRequest.setId('id');

    beforeEach(() => {
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'deleteFragment')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.DeleteFragmentRequest, cb) => {
        cb(null, new pb.DeleteFragmentResponse());
      });
    });

    it('deleteFragment', async () => {
      await subject().deleteFragment('id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('addRole tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.AddRoleRequest();
    expectedRequest.setAuthorization(authorization);

    beforeEach(() => {
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'addRole')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.AddRoleRequest, cb) => {
        cb(null, new pb.AddRoleResponse());
      });
    });

    it('addRole', async () => {
      await subject().addRole('orgId', 'entityId', 'role', 'resourceType', 'resourceId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('removeRole tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.RemoveRoleRequest();
    expectedRequest.setAuthorization(authorization);

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'removeRole')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.RemoveRoleRequest, cb) => {
        cb(null, new pb.RemoveRoleResponse());
      });
    });

    it('removeRole', async () => {
      await subject().removeRole('orgId', 'entityId', 'role', 'resourceType', 'resourceId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
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
      vi.spyOn(AppServiceClient.prototype, 'changeRole')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.ChangeRoleRequest, cb) => {
        cb(null, new pb.ChangeRoleResponse());
      });
    });

    it('changeRole', async () => {
      await subject().changeRole(authorization, newAuthorization);
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('listAuthorizations tests', () => {
    const authorizations = [authorization];

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'listAuthorizations')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.ListAuthorizationsRequest, cb) => {
        const response = new pb.ListAuthorizationsResponse();
        response.setAuthorizationsList(authorizations);
        cb(null, response);
      });
    });

    it('listAuthorizations', async () => {
      const response = await subject().listAuthorizations('orgId');
      expect(response).toEqual(authorizations.map((x) => x.toObject()));
    });
  });

  describe('checkPermissions tests', () => {
    const permissions = [permission];
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'checkPermissions')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.CheckPermissionsRequest, cb) => {
        const response = new pb.CheckPermissionsResponse();
        response.setAuthorizedPermissionsList(permissions);
        cb(null, response);
      });
    });

    it('checkPermissions', async () => {
      const response = await subject().checkPermissions(permissions);
      expect(response).toEqual(permissions.map((x) => x.toObject()));
    });
  });

  describe('getRegistryItem tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'getRegistryItem')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetRegistryItemRequest, cb) => {
        const response = new pb.GetRegistryItemResponse();
        response.setItem(registryItem);
        cb(null, response);
      });
    });

    it('getRegistryItem', async () => {
      const response = await subject().getRegistryItem('itemId');
      expect(response.item).toEqual(registryItem.toObject());
    });
  });

  describe('createRegistryItem tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.CreateRegistryItemRequest();
    expectedRequest.setType(2);
    expectedRequest.setName('name');
    expectedRequest.setOrganizationId('orgId');

    beforeEach(() => {
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'createRegistryItem')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.CreateRegistryItemRequest, cb) => {
        cb(null, new pb.CreateRegistryItemResponse());
      });
    });

    it('createRegistryItem', async () => {
      await subject().createRegistryItem('orgId', 'name', 'PACKAGE_TYPE_ML_MODEL');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
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
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'updateRegistryItem')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.UpdateRegistryItemRequest, cb) => {
        cb(null, new pb.UpdateRegistryItemResponse());
      });
    });

    it('updateRegistryItem', async () => {
      await subject().updateRegistryItem('itemId', 'PACKAGE_TYPE_ML_MODEL', 'description', 'VISIBILITY_PUBLIC');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('listRegistryItems tests', () => {
    const items = [registryItem];

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'listRegistryItems')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.ListRegistryItemsRequest, cb) => {
        const response = new pb.ListRegistryItemsResponse();
        response.setItemsList(items);
        cb(null, response);
      });
    });

    it('listRegistryItems', async () => {
      const response = await subject().listRegistryItems(
        'orgId',
        ['PACKAGE_TYPE_ML_MODEL', 'PACKAGE_TYPE_ARCHIVE'],
        ['VISIBILITY_PUBLIC'],
        ['mac', 'unix'],
        ['REGISTRY_ITEM_STATUS_PUBLISHED'],
        'search',
        'token',
      );
      expect(response).toEqual(items.map((x) => x.toObject()));
    });
  });

  describe('deleteRegistryItem tests', () => {
    let methodSpy: MockInstance;
    const expectedRequest = new pb.DeleteRegistryItemRequest();
    expectedRequest.setItemId('itemId');

    beforeEach(() => {
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'deleteRegistryItem')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.DeleteRegistryItemRequest, cb) => {
        cb(null, new pb.DeleteRegistryItemResponse());
      });
    });

    it('deleteRegistryItem', async () => {
      await subject().deleteRegistryItem('itemId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('createModule tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'createModule')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.CreateModuleRequest, cb) => {
        const response = new pb.CreateModuleResponse();
        response.setUrl('url');
        response.setModuleId('id');
        cb(null, response);
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
      vi.spyOn(AppServiceClient.prototype, 'updateModule')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.UpdateModuleRequest, cb) => {
        const response = new pb.UpdateModuleResponse();
        response.setUrl('url');
        cb(null, response);
      });
    });

    it('updateModule', async () => {
      const response = await subject().updateModule('moduleId', 'VISIBILITY_PRIVATE', 'url', 'newDescription', [], 'entrypoint');
      expect(response).toEqual('url');
    });
  });

  describe('uploadModuleFile tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'uploadModuleFile')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.UploadModuleFileRequest, cb) => {
        const response = new pb.UploadModuleFileResponse();
        response.setUrl('url');
        cb(null, response);
      });
    });

    it('uploadModuleFile', async () => {
      const response = await subject().uploadModuleFile('id', '0.1.2', 'macOS', 'file');
      expect(response).toEqual('url');
    });
  });

  describe('getModule tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'getModule')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.GetModuleRequest, cb) => {
        const response = new pb.GetModuleResponse();
        response.setModule(module);
        cb(null, response);
      });
    });

    it('getModule', async () => {
      const response = await subject().getModule('id');
      expect(response).toEqual(module.toObject());
    });
  });

  describe('listModules tests', () => {
    const modules = [module];

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'listModules')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.ListModulesRequest, cb) => {
        const response = new pb.ListModulesResponse();
        response.setModulesList(modules);
        cb(null, response);
      });
    });

    it('listModules', async () => {
      const response = await subject().listModules('orgId');
      expect(response).toEqual(modules.map((x) => x.toObject()));
    });
  });

  describe('createKey tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'createKey')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.CreateKeyRequest, cb) => {
        const response = new pb.CreateKeyResponse();
        response.setId('id');
        response.setKey('key');
        cb(null, response);
      });
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
      methodSpy = vi.spyOn(AppServiceClient.prototype, 'deleteKey')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.DeleteKeyRequest, cb) => {
        cb(null, new pb.DeleteKeyResponse());
      });
    });

    it('deleteKey', async () => {
      await subject().deleteKey('id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      )
    });
  });

  describe('listKeys tests', () => {
    const keys = [apiKeyWithAuths];

    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'listKeys')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.ListKeysRequest, cb) => {
        const response = new pb.ListKeysResponse();
        response.setApiKeysList(keys);
        cb(null, response);
      });
    });

    it('listKeys', async () => {
      const response = await subject().listKeys('orgId');
      expect(response).toEqual(keys.map((x) => x.toObject()));
    });
  });

  describe('rotateKey tests', () => {
    beforeEach(() => {
      vi.spyOn(AppServiceClient.prototype, 'rotateKey')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.RotateKeyRequest, cb) => {
        const response = new pb.RotateKeyResponse();
        response.setId('newId');
        response.setKey('eyK');
        cb(null, response);
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
      vi.spyOn(AppServiceClient.prototype, 'createKeyFromExistingKeyAuthorizations')
       // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementationOnce((_req: pb.CreateKeyFromExistingKeyAuthorizationsRequest, cb) => {
        const response = new pb.CreateKeyFromExistingKeyAuthorizationsResponse();
        response.setKey('key');
        response.setId('id');
        cb(null, response);
      });
    });

    it('createKeyFromExistingKeyAuthorizations', async () => {
      const response = await subject().createKeyFromExistingKeyAuthorizations('id');
      expect(response.key).toEqual('key');
      expect(response.id).toEqual('id');
    });
  });
})

