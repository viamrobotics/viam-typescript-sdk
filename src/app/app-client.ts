import * as pb from '../gen/app/v1/app_pb';
import { type LogEntry } from '../gen/common/v1/common_pb';
import { type RpcOptions } from '@improbable-eng/grpc-web/dist/typings/client.d';
import { AppServiceClient } from '../gen/app/v1/app_pb_service';
import { promisify } from '../utils';
import type { StructType } from '../types';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import {
  PackageType,
  type PackageTypeMap,
} from '../gen/app/packages/v1/packages_pb';
import type { FragmentVisibilityMap } from '../gen/app/v1/app_pb';

/**
 * Creates an Authorization object from auth details.
 *
 * @param orgId The ID of the organization to create the role under
 * @param entityId The ID of the entity the role belongs to (e.g., a user ID)
 * @param role The role to add ("owner" or "operator")
 * @param resourceType The type of resource to create the role for ("robot",
 *   "location", or "organization")
 * @param identityType The type of identity that the identity ID is (e.g., an
 *   api-key)
 * @param resourceId The ID of the resource the role is being created for
 */
export const createAuth = (
  orgId: string,
  entityId: string,
  role: string,
  resourceType: string,
  identityType: string,
  resourceId: string
): pb.Authorization => {
  const auth = new pb.Authorization();
  auth.setAuthorizationType('role');
  auth.setIdentityId(entityId);
  auth.setIdentityType(identityType);
  auth.setAuthorizationId(`${resourceType}_${role}`);
  auth.setResourceType(resourceType);
  auth.setOrganizationId(orgId);
  auth.setResourceId(resourceId);
  auth.setOrganizationId(orgId);

  return auth;
};

/**
 * Creates an Authorization object specifically for a new API key.
 *
 * @param orgId The ID of the organization to create the role under
 * @param role The role to add ("owner" or "operator")
 * @param resourceType The type of resource to create the role for ("robot",
 *   "location", or "organization")
 * @param resourceId The ID of the resource the role is being created for
 */
export const createAuthForNewAPIKey = (
  orgId: string,
  role: string,
  resourceType: string,
  resourceId: string
): pb.Authorization => {
  return createAuth(orgId, '', role, resourceType, 'api-key', resourceId);
};

/**
 * Creates a new AuthorizedPermissions object
 *
 * @param resourceType The type of the resource to check permissions for
 * @param resourceId The ID of the resource to check permissions for
 * @param permissions A list of permissions to check
 * @returns The AuthorizedPermissions object
 */
export const createPermission = (
  resourceType: string,
  resourceId: string,
  permissions: string[]
): pb.AuthorizedPermissions => {
  const permission = new pb.AuthorizedPermissions();
  permission.setResourceType(resourceType);
  permission.setResourceId(resourceId);
  permission.setPermissionsList(permissions);

  return permission;
};

export class AppClient {
  private service: AppServiceClient;

  constructor(serviceHost: string, grpcOptions: RpcOptions) {
    this.service = new AppServiceClient(serviceHost, grpcOptions);
  }

  /**
   * Obain a user's ID from their email address.
   *
   * @param email The email address of the user
   * @returns The user's ID
   */
  async getUserIDByEmail(email: string): Promise<string> {
    const { service } = this;

    const req = new pb.GetUserIDByEmailRequest();
    req.setEmail(email);

    const response = await promisify<
      pb.GetUserIDByEmailRequest,
      pb.GetUserIDByEmailResponse
    >(service.getUserIDByEmail.bind(service), req);
    return response.getUserId();
  }

  /**
   * Create a new organization.
   *
   * @param name The name of the new organization
   * @returns The new organization
   */
  async createOrganization(
    name: string
  ): Promise<pb.Organization.AsObject | undefined> {
    const { service } = this;

    const req = new pb.CreateOrganizationRequest();
    req.setName(name);

    const response = await promisify<
      pb.CreateOrganizationRequest,
      pb.CreateOrganizationResponse
    >(service.createOrganization.bind(service), req);
    const org = response.getOrganization();
    return org?.toObject();
  }

  /**
   * List all organizations.
   *
   * @returns The organization list
   */
  async listOrganizations(): Promise<pb.Organization.AsObject[]> {
    const { service } = this;
    const req = new pb.ListOrganizationsRequest();

    const response = await promisify<
      pb.ListOrganizationsRequest,
      pb.ListOrganizationsResponse
    >(service.listOrganizations.bind(service), req);
    return response.toObject().organizationsList;
  }

  /**
   * List all organizations with access to a particular location.
   *
   * @param locationId The ID of the location to query
   * @returns The list of locations with access to the requested location
   */
  async getOrganizationsWithAccessToLocation(
    locationId: string
  ): Promise<pb.OrganizationIdentity.AsObject[]> {
    const { service } = this;
    const req = new pb.GetOrganizationsWithAccessToLocationRequest();
    req.setLocationId(locationId);

    const response = await promisify<
      pb.GetOrganizationsWithAccessToLocationRequest,
      pb.GetOrganizationsWithAccessToLocationResponse
    >(service.getOrganizationsWithAccessToLocation.bind(service), req);
    return response.toObject().organizationIdentitiesList;
  }

  /**
   * List all organizations associated with a user.
   *
   * @param userId The ID of the user to query
   * @returns The list of locations the requested user has access to
   */
  async listOrganizationsByUser(
    userId: string
  ): Promise<pb.OrgDetails.AsObject[]> {
    const { service } = this;
    const req = new pb.ListOrganizationsByUserRequest();
    req.setUserId(userId);

    const response = await promisify<
      pb.ListOrganizationsByUserRequest,
      pb.ListOrganizationsByUserResponse
    >(service.listOrganizationsByUser.bind(service), req);
    return response.toObject().orgsList;
  }

  /**
   * Get details about an organization.
   *
   * @param orgId The ID of the organization
   * @returns Details about the organization, if it exists
   */
  async getOrganization(
    orgId: string
  ): Promise<pb.Organization.AsObject | undefined> {
    const { service } = this;
    const req = new pb.GetOrganizationRequest();
    req.setOrganizationId(orgId);

    const response = await promisify<
      pb.GetOrganizationRequest,
      pb.GetOrganizationResponse
    >(service.getOrganization.bind(service), req);
    return response.getOrganization()?.toObject();
  }

  /**
   * Find out if an organization namespace is available.
   *
   * @param namespace The namespace to query for availability
   * @returns A boolean indicating whether or not the namespace is available
   */
  async getOrganizationNamespaceAvailability(
    namespace: string
  ): Promise<boolean> {
    const { service } = this;
    const req = new pb.GetOrganizationNamespaceAvailabilityRequest();
    req.setPublicNamespace(namespace);

    const response = await promisify<
      pb.GetOrganizationNamespaceAvailabilityRequest,
      pb.GetOrganizationNamespaceAvailabilityResponse
    >(service.getOrganizationNamespaceAvailability.bind(service), req);
    return response.getAvailable();
  }

  /**
   * Updates organization details.
   *
   * @param orgId The id of the organization to update
   * @param name Optional name to update the organization with
   * @param publicNamespace Optional namespace to update the organization with
   * @param region Optional region to update the organization with
   * @param cid Optional CRM ID to update the organization with
   * @returns The updated organization details
   */
  async updateOrganization(
    orgId: string,
    name?: string,
    publicNamespace?: string,
    region?: string,
    cid?: string
  ): Promise<pb.Organization.AsObject | undefined> {
    const { service } = this;
    const req = new pb.UpdateOrganizationRequest();
    req.setOrganizationId(orgId);
    if (name) {
      req.setName(name);
    }
    if (publicNamespace) {
      req.setPublicNamespace(publicNamespace);
    }
    if (region) {
      req.setRegion(region);
    }
    if (cid) {
      req.setCid(cid);
    }

    const response = await promisify<
      pb.UpdateOrganizationRequest,
      pb.UpdateOrganizationResponse
    >(service.updateOrganization.bind(service), req);
    return response.getOrganization()?.toObject();
  }

  /**
   * Deletes an organization.
   *
   * @param orgId The id of the organization to delete
   */
  async deleteOrganization(orgId: string) {
    const { service } = this;
    const req = new pb.DeleteOrganizationRequest();
    req.setOrganizationId(orgId);

    await promisify<
      pb.DeleteOrganizationRequest,
      pb.DeleteOrganizationResponse
    >(service.deleteOrganization.bind(service), req);
  }

  /**
   * Lists organization memebers and outstanding invites.
   *
   * @param orgId The id of the organization to query
   * @returns An object containing organization members, pending invites, and
   *   org ID
   */
  async listOrganizationMembers(
    orgId: string
  ): Promise<pb.ListOrganizationMembersResponse.AsObject> {
    const { service } = this;
    const req = new pb.ListOrganizationMembersRequest();
    req.setOrganizationId(orgId);

    const response = await promisify<
      pb.ListOrganizationMembersRequest,
      pb.ListOrganizationMembersResponse
    >(service.listOrganizationMembers.bind(service), req);
    return response.toObject();
  }

  /**
   * Creates a new invitation to join an organization.
   *
   * @param orgId The id of the organization to create the invite for
   * @param email The email address of the user to generate an invite for
   * @param authorizations The authorizations to associate with the new invite
   * @param sendEmailInvite Bool of whether to send an email invite (true) or
   *   automatically add a user. Defaults to true
   * @returns The organization invite
   */
  async createOrganizationInvite(
    orgId: string,
    email: string,
    authorizations: pb.Authorization[],
    sendEmailInvite = true
  ): Promise<pb.OrganizationInvite.AsObject | undefined> {
    const { service } = this;
    const req = new pb.CreateOrganizationInviteRequest();
    req.setOrganizationId(orgId);
    req.setEmail(email);
    req.setAuthorizationsList(authorizations);
    req.setSendEmailInvite(sendEmailInvite);

    const response = await promisify<
      pb.CreateOrganizationInviteRequest,
      pb.CreateOrganizationInviteResponse
    >(service.createOrganizationInvite.bind(service), req);
    return response.getInvite()?.toObject();
  }

  /**
   * Updates authorizations for an existing org invite.
   *
   * @param orgId The id of the organization
   * @param email The email address associated with the invite
   * @param addAuthsList List of authorizations to add to the invite
   * @param removeAuthsList List of authorizations to remove from the invite
   * @returns The organization invite
   */
  async updateOrganizationInviteAuthorizations(
    orgId: string,
    email: string,
    addAuthsList: pb.Authorization[],
    removeAuthsList: pb.Authorization[]
  ): Promise<pb.OrganizationInvite.AsObject | undefined> {
    const { service } = this;
    const req = new pb.UpdateOrganizationInviteAuthorizationsRequest();
    req.setOrganizationId(orgId);
    req.setEmail(email);
    req.setAddAuthorizationsList(addAuthsList);
    req.setRemoveAuthorizationsList(removeAuthsList);

    const response = await promisify<
      pb.UpdateOrganizationInviteAuthorizationsRequest,
      pb.UpdateOrganizationInviteAuthorizationsResponse
    >(service.updateOrganizationInviteAuthorizations.bind(service), req);
    return response.getInvite()?.toObject();
  }

  /**
   * Removes a member from an organization.
   *
   * @param orgId The ID of the organization
   * @param userId The ID of the user
   */
  async deleteOrganizationMember(orgId: string, userId: string) {
    const { service } = this;
    const req = new pb.DeleteOrganizationMemberRequest();
    req.setOrganizationId(orgId);
    req.setUserId(userId);

    await promisify<
      pb.DeleteOrganizationMemberRequest,
      pb.DeleteOrganizationMemberResponse
    >(service.deleteOrganizationMember.bind(service), req);
  }

  /**
   * Deletes a pending organization invite.
   *
   * @param orgId The ID of the organization
   * @param email The email associated with the invite to delete
   */
  async deleteOrganizationInvite(orgId: string, email: string) {
    const { service } = this;
    const req = new pb.DeleteOrganizationInviteRequest();
    req.setOrganizationId(orgId);
    req.setEmail(email);

    await promisify<
      pb.DeleteOrganizationInviteRequest,
      pb.DeleteOrganizationInviteResponse
    >(service.deleteOrganizationInvite.bind(service), req);
  }

  /**
   * Resends a pending organization invite.
   *
   * @param orgId The ID of the organization
   * @param email The email associated with the invite to resend
   * @returns The invite
   */
  async resendOrganizationInvite(
    orgId: string,
    email: string
  ): Promise<pb.OrganizationInvite.AsObject | undefined> {
    const { service } = this;
    const req = new pb.ResendOrganizationInviteRequest();
    req.setOrganizationId(orgId);
    req.setEmail(email);

    const response = await promisify<
      pb.ResendOrganizationInviteRequest,
      pb.ResendOrganizationInviteResponse
    >(service.resendOrganizationInvite.bind(service), req);
    return response.getInvite()?.toObject();
  }

  /**
   * Creates a new location.
   *
   * @param orgId The ID of the organization to create the location under
   * @param name The name of the location to create
   * @param parentLocationId Optional name of a parent location to create the
   *   new location under
   * @returns The location object
   */
  async createLocation(
    orgId: string,
    name: string,
    parentLocationId?: string
  ): Promise<pb.Location.AsObject | undefined> {
    const { service } = this;
    const req = new pb.CreateLocationRequest();
    req.setOrganizationId(orgId);
    req.setName(name);
    if (parentLocationId) {
      req.setParentLocationId(parentLocationId);
    }

    const response = await promisify<
      pb.CreateLocationRequest,
      pb.CreateLocationResponse
    >(service.createLocation.bind(service), req);
    return response.getLocation()?.toObject();
  }

  /**
   * Looks up a location.
   *
   * @param locId The ID of the location to query.
   * @returns The location object
   */
  async getLocation(locId: string): Promise<pb.Location.AsObject | undefined> {
    const { service } = this;
    const req = new pb.GetLocationRequest();
    req.setLocationId(locId);

    const response = await promisify<
      pb.GetLocationRequest,
      pb.GetLocationResponse
    >(service.getLocation.bind(service), req);
    return response.getLocation()?.toObject();
  }

  /**
   * Updates location details.
   *
   * @param locId The ID of the location to update
   * @param name Optional string to update the location's name to
   * @param parentLocId Optional string to update the location's parent location
   *   to
   * @param region Optional string to update the location's region to
   * @returns The location object
   */
  async updateLocation(
    locId: string,
    name?: string,
    parentLocId?: string,
    region?: string
  ): Promise<pb.Location.AsObject | undefined> {
    const { service } = this;
    const req = new pb.UpdateLocationRequest();
    req.setLocationId(locId);
    if (name) {
      req.setName(name);
    }
    if (parentLocId) {
      req.setParentLocationId(parentLocId);
    }
    if (region) {
      req.setRegion(region);
    }

    const response = await promisify<
      pb.UpdateLocationRequest,
      pb.UpdateLocationResponse
    >(service.updateLocation.bind(service), req);
    return response.getLocation()?.toObject();
  }

  /**
   * Deletes a location
   *
   * @param locId The ID of the location to delete
   */
  async deleteLocation(locId: string) {
    const { service } = this;
    const req = new pb.DeleteLocationRequest();
    req.setLocationId(locId);

    await promisify<pb.DeleteLocationRequest, pb.DeleteLocationResponse>(
      service.deleteLocation.bind(service),
      req
    );
  }

  /**
   * Lists all locations under an organization.
   *
   * @param orgId The ID of the organization to query
   * @returns A list of locations under the organization
   */
  async listLocations(orgId: string): Promise<pb.Location.AsObject[]> {
    const { service } = this;
    const req = new pb.ListLocationsRequest();
    req.setOrganizationId(orgId);

    const response = await promisify<
      pb.ListLocationsRequest,
      pb.ListLocationsResponse
    >(service.listLocations.bind(service), req);
    return response.toObject().locationsList;
  }

  /**
   * Shares a location with another organization
   *
   * @param orgId The ID of the organization to share with
   * @param locId The ID of the location to share
   */
  async shareLocation(orgId: string, locId: string) {
    const { service } = this;
    const req = new pb.ShareLocationRequest();
    req.setOrganizationId(orgId);
    req.setLocationId(locId);

    await promisify<pb.ShareLocationRequest, pb.ShareLocationResponse>(
      service.shareLocation.bind(service),
      req
    );
  }

  /**
   * Unshares a location with an organization
   *
   * @param orgId The ID of the organization to unshare with
   * @param locId The ID of the location to unshare
   */
  async unshareLocation(orgId: string, locId: string) {
    const { service } = this;
    const req = new pb.UnshareLocationRequest();
    req.setOrganizationId(orgId);
    req.setLocationId(locId);

    await promisify<pb.UnshareLocationRequest, pb.UnshareLocationResponse>(
      service.unshareLocation.bind(service),
      req
    );
  }

  /**
   * Get a location's `LocationAuth` (location secret(s)).
   *
   * @param locId The ID of the location to retrieve `LocationAuth` from.
   * @returns The `LocationAuth` for the requested location.
   */
  async locationAuth(
    locId: string
  ): Promise<pb.LocationAuth.AsObject | undefined> {
    const { service } = this;
    const req = new pb.LocationAuthRequest();
    req.setLocationId(locId);

    const response = await promisify<
      pb.LocationAuthRequest,
      pb.LocationAuthResponse
    >(service.locationAuth.bind(service), req);
    return response.toObject().auth;
  }

  /**
   * Create a location secret (`LocationAuth`).
   *
   * @param locId The ID of the location to create a `LocationAuth` for
   * @returns The newly created `LocationAuth`
   */
  async createLocationSecret(
    locId: string
  ): Promise<pb.LocationAuth.AsObject | undefined> {
    const { service } = this;
    const req = new pb.CreateLocationSecretRequest();
    req.setLocationId(locId);

    const response = await promisify<
      pb.CreateLocationSecretRequest,
      pb.CreateLocationSecretResponse
    >(service.createLocationSecret.bind(service), req);
    return response.toObject().auth;
  }

  /**
   * Deletes a location secret (`LocationAuth`).
   *
   * @param locId The ID of the location to delete the `LocationAuth` from
   * @param secretId The ID of the location secret to delete
   */
  async deleteLocationSecret(locId: string, secretId: string) {
    const { service } = this;
    const req = new pb.DeleteLocationSecretRequest();
    req.setLocationId(locId);
    req.setSecretId(secretId);

    await promisify<
      pb.DeleteLocationSecretRequest,
      pb.DeleteLocationSecretResponse
    >(service.deleteLocationSecret.bind(service), req);
  }

  /**
   * Queries a robot by its ID.
   *
   * @param id The ID of the robot
   * @returns The `Robot` object
   */
  async getRobot(id: string): Promise<pb.Robot.AsObject | undefined> {
    const { service } = this;
    const req = new pb.GetRobotRequest();
    req.setId(id);

    const response = await promisify<pb.GetRobotRequest, pb.GetRobotResponse>(
      service.getRobot.bind(service),
      req
    );
    return response.toObject().robot;
  }

  /**
   * Returns a list of rover rental robots for an organization.
   *
   * @param orgId The ID of the organization to query
   * @returns The list of `RoverRentalRobot` objects
   */
  async getRoverRentalRobots(
    orgId: string
  ): Promise<pb.RoverRentalRobot.AsObject[]> {
    const { service } = this;
    const req = new pb.GetRoverRentalRobotsRequest();
    req.setOrgId(orgId);

    const response = await promisify<
      pb.GetRoverRentalRobotsRequest,
      pb.GetRoverRentalRobotsResponse
    >(service.getRoverRentalRobots.bind(service), req);
    return response.toObject().robotsList;
  }

  /**
   * Returns a list of parts for a given robot
   *
   * @param robotId The ID of the robot to query
   * @returns The list of `RobotPart` objects associated with the robot
   */
  async getRobotParts(robotId: string): Promise<pb.RobotPart.AsObject[]> {
    const { service } = this;
    const req = new pb.GetRobotPartsRequest();
    req.setRobotId(robotId);

    const response = await promisify<
      pb.GetRobotPartsRequest,
      pb.GetRobotPartsResponse
    >(service.getRobotParts.bind(service), req);
    return response.toObject().partsList;
  }

  /**
   * Queries a specific robot part by ID.
   *
   * @param id The ID of the requested robot part
   * @returns The robot part and a its json config
   */
  async getRobotPart(id: string): Promise<pb.GetRobotPartResponse.AsObject> {
    const { service } = this;
    const req = new pb.GetRobotPartRequest();
    req.setId(id);

    const response = await promisify<
      pb.GetRobotPartRequest,
      pb.GetRobotPartResponse
    >(service.getRobotPart.bind(service), req);
    return response.toObject();
  }

  /**
   * Get a page of log entries for a specific robot part. Logs are sorted by
   * descending time (newest first).
   *
   * @param id The ID of the requested robot part
   * @param filter Optional string to filter logs on
   * @param levels Optional array of log levels to return. Defaults to returning
   *   all log levels
   * @param pageToken Optional string indicating which page of logs to query.
   *   Defaults to the most recent
   * @returns The robot requested logs and the page token for the next page of
   *   logs
   */
  async getRobotPartLogs(
    id: string,
    filter?: string,
    levels?: string[],
    pageToken = ''
  ): Promise<pb.GetRobotPartLogsResponse.AsObject> {
    const { service } = this;
    const req = new pb.GetRobotPartLogsRequest();
    req.setId(id);
    if (filter) {
      req.setFilter(filter);
    }
    if (levels) {
      req.setLevelsList(levels);
    }
    req.setPageToken(pageToken);

    const response = await promisify<
      pb.GetRobotPartLogsRequest,
      pb.GetRobotPartLogsResponse
    >(service.getRobotPartLogs.bind(service), req);
    return response.toObject();
  }

  /**
   * Get a stream of log entries for a specific robot part. Logs are sorted by
   * descending time (newest first).
   *
   * @param id The ID of the requested robot part
   * @param queue A queue to put the log entries into
   * @param filter Optional string to filter logs on
   * @param errorsOnly Optional bool to indicate whether or not only error-level
   *   logs should be returned. Defaults to true
   */
  async tailRobotPartLogs(
    id: string,
    queue: LogEntry.AsObject[],
    filter?: string,
    errorsOnly = true
  ) {
    const { service } = this;
    const req = new pb.TailRobotPartLogsRequest();
    req.setId(id);
    req.setErrorsOnly(errorsOnly);
    if (filter) {
      req.setFilter(filter);
    }

    const stream = service.tailRobotPartLogs(req);
    stream.on('data', (response) => {
      for (const log of response.toObject().logsList) {
        queue.push(log);
      }
    });

    return new Promise<void>((resolve, reject) => {
      stream.on('status', (status) => {
        if (status.code !== 0) {
          const error = {
            message: status.details,
            code: status.code,
            metadata: status.metadata,
          };
          reject(error);
        }
      });
      stream.on('end', (end) => {
        if (end === undefined) {
          const error = { message: 'Stream ended without a status code' };
          reject(error);
        } else if (end.code !== 0) {
          const error = {
            message: end.details,
            code: end.code,
            metadata: end.metadata,
          };
          reject(error);
        }
        resolve();
      });
    });
  }

  /**
   * Get a list containing the history of a robot part.
   *
   * @param id The ID of the requested robot part
   * @returns The list of the robot part's history
   */
  async getRobotPartHistory(
    id: string
  ): Promise<pb.RobotPartHistoryEntry.AsObject[]> {
    const { service } = this;
    const req = new pb.GetRobotPartHistoryRequest();
    req.setId(id);

    const response = await promisify<
      pb.GetRobotPartHistoryRequest,
      pb.GetRobotPartHistoryResponse
    >(service.getRobotPartHistory.bind(service), req);
    return response.toObject().historyList;
  }

  /**
   * Updates a robot part based on its ID.
   *
   * @param id The ID of the requested robot part
   * @param name The new name of the robot part
   * @param robotConfig The new config for the robot part
   * @returns The updated robot part
   */
  async updateRobotPart(
    id: string,
    name: string,
    robotConfig: StructType
  ): Promise<pb.RobotPart.AsObject | undefined> {
    const { service } = this;
    const req = new pb.UpdateRobotPartRequest();
    req.setId(id);
    req.setName(name);
    req.setRobotConfig(Struct.fromJavaScript(robotConfig));

    const response = await promisify<
      pb.UpdateRobotPartRequest,
      pb.UpdateRobotPartResponse
    >(service.updateRobotPart.bind(service), req);
    return response.toObject().part;
  }

  /**
   * Creates a new robot part.
   *
   * @param robotId The ID of the robot to create a part for
   * @param partName The name for the new robot part
   * @returns The ID of the newly-created robot part
   */
  async newRobotPart(robotId: string, partName: string): Promise<string> {
    const { service } = this;
    const req = new pb.NewRobotPartRequest();
    req.setRobotId(robotId);
    req.setPartName(partName);

    const response = await promisify<
      pb.NewRobotPartRequest,
      pb.NewRobotPartResponse
    >(service.newRobotPart.bind(service), req);
    return response.getPartId();
  }

  /**
   * Deletes a robot part.
   *
   * @param partId The ID of the part to delete
   */
  async deleteRobotPart(partId: string) {
    const { service } = this;
    const req = new pb.DeleteRobotPartRequest();
    req.setPartId(partId);

    await promisify<pb.DeleteRobotPartRequest, pb.DeleteRobotPartResponse>(
      service.deleteRobotPart.bind(service),
      req
    );
  }

  /**
   * Gets a list of a robot's API keys.
   *
   * @param robotId The ID of the robot to get API keys for
   * @returns A list of the robot's API keys
   */
  async getRobotAPIKeys(
    robotId: string
  ): Promise<pb.APIKeyWithAuthorizations.AsObject[]> {
    const { service } = this;
    const req = new pb.GetRobotAPIKeysRequest();
    req.setRobotId(robotId);

    const response = await promisify<
      pb.GetRobotAPIKeysRequest,
      pb.GetRobotAPIKeysResponse
    >(service.getRobotAPIKeys.bind(service), req);
    return response.toObject().apiKeysList;
  }

  /**
   * Marks a robot part as the main part.
   *
   * @param partId The ID of the part to mark as main
   */
  async markPartAsMain(partId: string) {
    const { service } = this;
    const req = new pb.MarkPartAsMainRequest();
    req.setPartId(partId);

    await promisify<pb.MarkPartAsMainRequest, pb.MarkPartAsMainResponse>(
      service.markPartAsMain.bind(service),
      req
    );
  }

  /**
   * Marks a robot part for restart.
   *
   * @param partId The ID of the part to mark for restart
   */
  async markPartForRestart(partId: string) {
    const { service } = this;
    const req = new pb.MarkPartForRestartRequest();
    req.setPartId(partId);

    await promisify<
      pb.MarkPartForRestartRequest,
      pb.MarkPartForRestartResponse
    >(service.markPartForRestart.bind(service), req);
  }

  /**
   * Creates a new secret for a robot part.
   *
   * @param partId The ID of the part to create a secret for
   * @returns The robot part object
   */
  async createRobotPartSecret(
    partId: string
  ): Promise<pb.RobotPart.AsObject | undefined> {
    const { service } = this;
    const req = new pb.CreateRobotPartSecretRequest();
    req.setPartId(partId);

    const response = await promisify<
      pb.CreateRobotPartSecretRequest,
      pb.CreateRobotPartSecretResponse
    >(service.createRobotPartSecret.bind(service), req);
    return response.toObject().part;
  }

  /**
   * Deletes a robot secret from a robot part.
   *
   * @param partId The ID of the part to delete a secret from
   * @param secretId The ID of the secret to delete
   */
  async deleteRobotPartSecret(partId: string, secretId: string) {
    const { service } = this;
    const req = new pb.DeleteRobotPartSecretRequest();
    req.setPartId(partId);
    req.setSecretId(secretId);

    await promisify<
      pb.DeleteRobotPartSecretRequest,
      pb.DeleteRobotPartSecretResponse
    >(service.deleteRobotPartSecret.bind(service), req);
  }

  /**
   * Lists all robots in a location.
   *
   * @param locId The ID of the location to list robots for
   * @returns The list of robot objects
   */
  async listRobots(locId: string): Promise<pb.Robot.AsObject[]> {
    const { service } = this;
    const req = new pb.ListRobotsRequest();
    req.setLocationId(locId);

    const response = await promisify<
      pb.ListRobotsRequest,
      pb.ListRobotsResponse
    >(service.listRobots.bind(service), req);
    return response.toObject().robotsList;
  }

  /**
   * Creates a new robot.
   *
   * @param locId The ID of the location to create the robot in
   * @param name The name of the new robot
   * @returns The new robot's ID
   */
  async newRobot(locId: string, name: string): Promise<string> {
    const { service } = this;
    const req = new pb.NewRobotRequest();
    req.setName(name);
    req.setLocation(locId);

    const response = await promisify<pb.NewRobotRequest, pb.NewRobotResponse>(
      service.newRobot.bind(service),
      req
    );
    return response.getId();
  }

  /**
   * Updates an existing robot's name and/or location.
   *
   * @param robotId The ID of the robot to update
   * @param locId The ID of the location to move the robot to
   * @param name The name to update the robot to
   * @returns The newly-modified robot object
   */
  async updateRobot(
    robotId: string,
    locId: string,
    name: string
  ): Promise<pb.Robot.AsObject | undefined> {
    const { service } = this;
    const req = new pb.UpdateRobotRequest();
    req.setId(robotId);
    req.setLocation(locId);
    req.setName(name);

    const response = await promisify<
      pb.UpdateRobotRequest,
      pb.UpdateRobotResponse
    >(service.updateRobot.bind(service), req);
    return response.toObject().robot;
  }

  /**
   * Deletes a robot.
   *
   * @param id The ID of the robot to delete
   */
  async deleteRobot(id: string) {
    const { service } = this;
    const req = new pb.DeleteRobotRequest();
    req.setId(id);

    await promisify<pb.DeleteRobotRequest, pb.DeleteRobotResponse>(
      service.deleteRobot.bind(service),
      req
    );
  }

  /**
   * Lists all fragments within an organization.
   *
   * @param orgId The ID of the organization to list fragments for
   * @param publicOnly Optional, deprecated boolean. Use fragmentVisibilities
   *   instead. If true then only public fragments will be listed. Defaults to
   *   true
   * @param fragmentVisibilities Optional list of fragment visibilities to
   *   include in returned list. An empty fragmentVisibilities list defaults to
   *   normal publicOnly behavior (discludes unlisted public fragments)
   *   Otherwise, fragment visibilities should contain one of the three
   *   visibilities and takes precendence over the publicOnly field
   * @returns The list of fragment objects
   */
  async listFragments(
    orgId: string,
    publicOnly = true,
    fragmentVisibilities: FragmentVisibilityMap[keyof FragmentVisibilityMap][] = []
  ): Promise<pb.Fragment.AsObject[]> {
    const { service } = this;
    const req = new pb.ListFragmentsRequest();
    req.setOrganizationId(orgId);
    req.setShowPublic(publicOnly);
    req.setFragmentVisibilityList(fragmentVisibilities);

    const response = await promisify<
      pb.ListFragmentsRequest,
      pb.ListFragmentsResponse
    >(service.listFragments.bind(service), req);
    return response.toObject().fragmentsList;
  }

  /**
   * Looks up a fragment by ID.
   *
   * @param id The ID of the fragment to look up
   * @returns The requested fragment
   */
  async getFragment(id: string): Promise<pb.Fragment.AsObject | undefined> {
    const { service } = this;
    const req = new pb.GetFragmentRequest();
    req.setId(id);

    const response = await promisify<
      pb.GetFragmentRequest,
      pb.GetFragmentResponse
    >(service.getFragment.bind(service), req);
    return response.toObject().fragment;
  }

  /**
   * Creates a new fragment.
   *
   * @param orgId The ID of the organization to create the fragment under
   * @param name The name of the new fragment
   * @param config The new fragment's config
   * @returns The newly created fragment
   */
  async createFragment(
    orgId: string,
    name: string,
    config: StructType
  ): Promise<pb.Fragment.AsObject | undefined> {
    const { service } = this;
    const req = new pb.CreateFragmentRequest();
    req.setOrganizationId(orgId);
    req.setName(name);
    req.setConfig(Struct.fromJavaScript(config));

    const response = await promisify<
      pb.CreateFragmentRequest,
      pb.CreateFragmentResponse
    >(service.createFragment.bind(service), req);
    return response.toObject().fragment;
  }

  /**
   * Updates an existing fragment.
   *
   * @param id The ID of the fragment to update
   * @param name The name to update the fragment to
   * @param config The config to update the fragment to
   * @param makePublic Optional, deprecated boolean specifying whether the
   *   fragment should be public or not. If not passed, the visibility will be
   *   unchanged. Fragments are private by default when created
   * @param visibility Optional FragmentVisibility specifying the updated
   *   fragment visibility. If not passed, the visibility will be unchanged. If
   *   visibility is not set and makePublic is set, makePublic takes effect. If
   *   makePublic and visibility are set, they must not be conflicting. If
   *   neither is set, the fragment visibility will remain unchanged.
   * @returns The updated fragment
   */
  async updateFragment(
    id: string,
    name: string,
    config: StructType,
    makePublic?: boolean,
    visibility?: keyof pb.FragmentVisibilityMap
  ): Promise<pb.Fragment.AsObject | undefined> {
    const { service } = this;
    const req = new pb.UpdateFragmentRequest();
    req.setId(id);
    req.setName(name);
    req.setConfig(Struct.fromJavaScript(config));
    if (makePublic !== undefined) {
      req.setPublic(makePublic);
    }
    if (visibility !== undefined) {
      req.setVisibility(pb.FragmentVisibility[visibility]);
    }

    const response = await promisify<
      pb.UpdateFragmentRequest,
      pb.UpdateFragmentResponse
    >(service.updateFragment.bind(service), req);
    return response.toObject().fragment;
  }

  /**
   * Deletes a fragment.
   *
   * @param id The ID of the fragment to delete
   */
  async deleteFragment(id: string) {
    const { service } = this;
    const req = new pb.DeleteFragmentRequest();
    req.setId(id);

    await promisify<pb.DeleteFragmentRequest, pb.DeleteFragmentResponse>(
      service.deleteFragment.bind(service),
      req
    );
  }

  /**
   * Add a role under an organization.
   *
   * @param orgId The ID of the organization to create the role under
   * @param entityId The ID of the entity the role belongs to (e.g., a user ID)
   * @param role The role to add ("owner" or "operator")
   * @param resourceType The type of resource to create the role for ("robot",
   *   "location", or "organization")
   * @param resourceId The ID of the resource the role is being created for
   */
  async addRole(
    orgId: string,
    entityId: string,
    role: string,
    resourceType: string,
    resourceId: string
  ) {
    const { service } = this;
    const req = new pb.AddRoleRequest();
    const auth = createAuth(
      orgId,
      entityId,
      role,
      resourceType,
      '',
      resourceId
    );
    req.setAuthorization(auth);

    await promisify<pb.AddRoleRequest, pb.AddRoleResponse>(
      service.addRole.bind(service),
      req
    );
  }

  /**
   * Removes a role from an organization.
   *
   * @param orgId The ID of the organization to remove the role from
   * @param entityId The ID of the entity the role belongs to (e.g., a user ID)
   * @param role The role to remove ("owner" or "operator")
   * @param resourceType The type of resource to remove the role from ("robot",
   *   "location", or "organization")
   * @param resourceId The ID of the resource the role is being removes from
   */
  async removeRole(
    orgId: string,
    entityId: string,
    role: string,
    resourceType: string,
    resourceId: string
  ) {
    const { service } = this;
    const req = new pb.RemoveRoleRequest();
    const auth = createAuth(
      orgId,
      entityId,
      role,
      resourceType,
      '',
      resourceId
    );
    req.setAuthorization(auth);

    await promisify<pb.RemoveRoleRequest, pb.RemoveRoleResponse>(
      service.removeRole.bind(service),
      req
    );
  }

  /**
   * Changes an existing role.
   *
   * @param oldAuth The existing authorization
   * @param newAuth The new authorization
   */
  async changeRole(oldAuth: pb.Authorization, newAuth: pb.Authorization) {
    const { service } = this;
    const req = new pb.ChangeRoleRequest();
    req.setOldAuthorization(oldAuth);
    req.setNewAuthorization(newAuth);

    await promisify<pb.ChangeRoleRequest, pb.ChangeRoleResponse>(
      service.changeRole.bind(service),
      req
    );
  }

  /**
   * List all authorizations for an organization.
   *
   * @param orgId The ID of the organization to list authorizations for
   * @param resourceIds Optional list of IDs of resources to list authorizations
   *   for. If not provided, all resources will be included
   * @returns The list of authorizations
   */
  async listAuthorizations(
    orgId: string,
    resourceIds?: string[]
  ): Promise<pb.Authorization.AsObject[]> {
    const { service } = this;
    const req = new pb.ListAuthorizationsRequest();
    req.setOrganizationId(orgId);
    if (resourceIds) {
      req.setResourceIdsList(resourceIds);
    }

    const response = await promisify<
      pb.ListAuthorizationsRequest,
      pb.ListAuthorizationsResponse
    >(service.listAuthorizations.bind(service), req);
    return response.toObject().authorizationsList;
  }

  /**
   * Checks whether requested permissions exist.
   *
   * @param permissions A list of permissions to check
   * @returns A filtered list of the authorized permissions
   */
  async checkPermissions(
    permissions: pb.AuthorizedPermissions[]
  ): Promise<pb.AuthorizedPermissions.AsObject[]> {
    const { service } = this;
    const req = new pb.CheckPermissionsRequest();
    req.setPermissionsList(permissions);

    const response = await promisify<
      pb.CheckPermissionsRequest,
      pb.CheckPermissionsResponse
    >(service.checkPermissions.bind(service), req);
    return response.toObject().authorizedPermissionsList;
  }

  /**
   * Get an item from the registry.
   *
   * @param itemId The ID of the item to get
   * @returns The requested item
   */
  async getRegistryItem(
    itemId: string
  ): Promise<pb.RegistryItem.AsObject | undefined> {
    const { service } = this;
    const req = new pb.GetRegistryItemRequest();
    req.setItemId(itemId);

    const response = await promisify<
      pb.GetRegistryItemRequest,
      pb.GetRegistryItemResponse
    >(service.getRegistryItem.bind(service), req);
    return response.toObject().item;
  }

  /**
   * Create a new registry item.
   *
   * @param orgId The ID of the organization to create the registry item under
   * @param name The name of the registry item
   * @param type The type of the item in the registry.
   */
  async createRegistryItem(
    orgId: string,
    name: string,
    type: keyof PackageTypeMap
  ) {
    const { service } = this;
    const req = new pb.CreateRegistryItemRequest();
    req.setOrganizationId(orgId);
    req.setName(name);
    req.setType(PackageType[type]);

    await promisify<
      pb.CreateRegistryItemRequest,
      pb.CreateRegistryItemResponse
    >(service.createRegistryItem.bind(service), req);
  }

  /**
   * Update an existing registry item.
   *
   * @param itemId The ID of the registry item to update
   * @param type The PackageType to update the item to
   * @param description A description of the item
   * @param visibility A visibility value to update to
   */
  async updateRegistryItem(
    itemId: string,
    type: keyof PackageTypeMap,
    description: string,
    visibility: keyof pb.VisibilityMap
  ) {
    const { service } = this;
    const req = new pb.UpdateRegistryItemRequest();
    req.setItemId(itemId);
    req.setType(PackageType[type]);
    req.setDescription(description);
    req.setVisibility(pb.Visibility[visibility]);

    await promisify<
      pb.UpdateRegistryItemRequest,
      pb.UpdateRegistryItemResponse
    >(service.updateRegistryItem.bind(service), req);
  }

  /**
   * List all registry items for an organization.
   *
   * @param orgId The ID of the organization to query registry items for
   * @param types A list of types to query. If empty, will not filter on type
   * @param visibilities A list of visibilities to query for. If empty, will not
   *   filter on visibility
   * @param platforms A list of platforms to query for. If empty, will not
   *   filter on platform
   * @param statuses A list of statuses to query for. If empty, will not filter
   *   on status
   * @param searchTerm Optional search term to filter on
   * @param pageToken Optional page token for results. If not provided, will
   *   return all results
   * @returns The list of registry items
   */
  async listRegistryItems(
    orgId: string,
    types: (keyof PackageTypeMap)[],
    visibilities: (keyof pb.VisibilityMap)[],
    platforms: string[],
    statuses: (keyof pb.RegistryItemStatusMap)[],
    searchTerm?: string,
    pageToken?: string
  ): Promise<pb.RegistryItem.AsObject[]> {
    const { service } = this;
    const req = new pb.ListRegistryItemsRequest();
    req.setOrganizationId(orgId);
    req.setTypesList(
      types.map((type) => {
        return PackageType[type];
      })
    );
    req.setVisibilitiesList(
      visibilities.map((visibility) => {
        return pb.Visibility[visibility];
      })
    );
    req.setPlatformsList(platforms);
    req.setStatusesList(
      statuses.map((status) => {
        return pb.RegistryItemStatus[status];
      })
    );
    if (searchTerm) {
      req.setSearchTerm(searchTerm);
    }
    if (pageToken) {
      req.setPageToken(pageToken);
    }

    const response = await promisify<
      pb.ListRegistryItemsRequest,
      pb.ListRegistryItemsResponse
    >(service.listRegistryItems.bind(service), req);
    return response.toObject().itemsList;
  }

  /**
   * Deletes a registry item.
   *
   * @param itemId The ID of the item to delete
   */
  async deleteRegistryItem(itemId: string) {
    const { service } = this;
    const req = new pb.DeleteRegistryItemRequest();
    req.setItemId(itemId);

    await promisify<
      pb.DeleteRegistryItemRequest,
      pb.DeleteRegistryItemResponse
    >(service.deleteRegistryItem.bind(service), req);
  }

  /**
   * Creates a new module.
   *
   * @param orgId The ID of the organization to create the module under
   * @param name The name of the module
   * @returns The module ID and a URL to its detail page
   */
  async createModule(
    orgId: string,
    name: string
  ): Promise<pb.CreateModuleResponse.AsObject> {
    const { service } = this;
    const req = new pb.CreateModuleRequest();
    req.setOrganizationId(orgId);
    req.setName(name);

    const response = await promisify<
      pb.CreateModuleRequest,
      pb.CreateModuleResponse
    >(service.createModule.bind(service), req);
    return response.toObject();
  }

  /**
   * Updates an existing module.
   *
   * @param moduleId The ID of the module to update
   * @param visibility The visibility to set for the module
   * @param url The url to reference for documentation, code, etc.
   * @param description A short description of the module
   * @param models A list of models available in the module
   * @param entrypoint The executable to run to start the module program
   * @returns The module URL
   */
  async updateModule(
    moduleId: string,
    visibility: keyof pb.VisibilityMap,
    url: string,
    description: string,
    models: pb.Model[],
    entrypoint: string
  ): Promise<string> {
    const { service } = this;
    const req = new pb.UpdateModuleRequest();
    req.setModuleId(moduleId);
    req.setVisibility(pb.Visibility[visibility]);
    req.setUrl(url);
    req.setDescription(description);
    req.setModelsList(models);
    req.setEntrypoint(entrypoint);

    const response = await promisify<
      pb.UpdateModuleRequest,
      pb.UpdateModuleResponse
    >(service.updateModule.bind(service), req);
    return response.getUrl();
  }

  /**
   * Looks up a particular module.
   *
   * @param moduleId The ID of the module
   * @returns The requested module
   */
  async getModule(moduleId: string): Promise<pb.Module.AsObject | undefined> {
    const { service } = this;
    const req = new pb.GetModuleRequest();
    req.setModuleId(moduleId);

    const response = await promisify<pb.GetModuleRequest, pb.GetModuleResponse>(
      service.getModule.bind(service),
      req
    );
    return response.toObject().module;
  }

  /**
   * Lists all modules for an organization.
   *
   * @param orgId The ID of the organization to query
   * @returns The organization's modules
   */
  async listModules(orgId: string): Promise<pb.Module.AsObject[]> {
    const { service } = this;
    const req = new pb.ListModulesRequest();
    req.setOrganizationId(orgId);

    const response = await promisify<
      pb.ListModulesRequest,
      pb.ListModulesResponse
    >(service.listModules.bind(service), req);
    return response.toObject().modulesList;
  }

  /**
   * Creates a new API key.
   *
   * @param authorizations The list of authorizations to provide for the API key
   * @param name An optional name for the key. If none is passed, defaults to
   *   present timestamp
   * @returns The new key and ID
   */
  async createKey(
    authorizations: pb.Authorization[],
    name?: string
  ): Promise<pb.CreateKeyResponse.AsObject> {
    const { service } = this;
    const req = new pb.CreateKeyRequest();
    req.setAuthorizationsList(authorizations);
    const setName = name ?? new Date().toLocaleString();
    req.setName(setName);

    const response = await promisify<pb.CreateKeyRequest, pb.CreateKeyResponse>(
      service.createKey.bind(service),
      req
    );
    return response.toObject();
  }

  /**
   * Deletes an existing API key.
   *
   * @param id The ID of the key to delete
   */
  async deleteKey(id: string) {
    const { service } = this;
    const req = new pb.DeleteKeyRequest();
    req.setId(id);

    await promisify<pb.DeleteKeyRequest, pb.DeleteKeyResponse>(
      service.deleteKey.bind(service),
      req
    );
  }

  /**
   * List all API keys for an organization.
   *
   * @param orgId The ID of the organization to query
   * @returns The list of API keys
   */
  async listKeys(
    orgId: string
  ): Promise<pb.APIKeyWithAuthorizations.AsObject[]> {
    const { service } = this;
    const req = new pb.ListKeysRequest();
    req.setOrgId(orgId);

    const response = await promisify<pb.ListKeysRequest, pb.ListKeysResponse>(
      service.listKeys.bind(service),
      req
    );
    return response.toObject().apiKeysList;
  }

  /**
   * Rotates an existing API key.
   *
   * @param id The ID of the key to rotate
   * @returns The updated key and ID
   */
  async rotateKey(id: string): Promise<pb.RotateKeyResponse.AsObject> {
    const { service } = this;
    const req = new pb.RotateKeyRequest();
    req.setId(id);

    const response = await promisify<pb.RotateKeyRequest, pb.RotateKeyResponse>(
      service.rotateKey.bind(service),
      req
    );
    return response.toObject();
  }

  /**
   * Creates a new key with an existing key's authorizations
   *
   * @param id The ID of the key to duplicate
   * @returns The new key and ID
   */
  async createKeyFromExistingKeyAuthorizations(
    id: string
  ): Promise<pb.CreateKeyFromExistingKeyAuthorizationsResponse.AsObject> {
    const { service } = this;
    const req = new pb.CreateKeyFromExistingKeyAuthorizationsRequest();
    req.setId(id);

    const response = await promisify<
      pb.CreateKeyFromExistingKeyAuthorizationsRequest,
      pb.CreateKeyFromExistingKeyAuthorizationsResponse
    >(service.createKeyFromExistingKeyAuthorizations.bind(service), req);
    return response.toObject();
  }
}
