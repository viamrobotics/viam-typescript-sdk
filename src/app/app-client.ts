import type { Struct } from '@bufbuild/protobuf';
import { createClient, type Client, type Transport } from '@connectrpc/connect';
import { PackageType } from '../gen/app/packages/v1/packages_pb';
import { AppService } from '../gen/app/v1/app_connect';
import {
  APIKeyWithAuthorizations,
  Authorization,
  AuthorizedPermissions,
  CreateKeyFromExistingKeyAuthorizationsResponse,
  CreateKeyResponse,
  CreateModuleResponse,
  Fragment,
  FragmentVisibility,
  GetLocationMetadataResponse,
  GetOrganizationMetadataResponse,
  GetRobotMetadataResponse,
  GetRobotPartMetadataResponse,
  GetRobotPartLogsResponse,
  GetRobotPartResponse,
  ListOrganizationMembersResponse,
  Location,
  LocationAuth,
  Model,
  Module,
  Organization,
  OrganizationIdentity,
  OrganizationInvite,
  OrgDetails,
  RegistryItem,
  RegistryItemStatus,
  Robot,
  RobotPart,
  RobotPartHistoryEntry,
  RotateKeyResponse,
  RoverRentalRobot,
  UpdateLocationMetadataResponse,
  UpdateOrganizationMetadataResponse,
  UpdateRobotMetadataResponse,
  UpdateRobotPartMetadataResponse,
  Visibility,
} from '../gen/app/v1/app_pb';
import type { LogEntry } from '../gen/common/v1/common_pb';
import { Any } from '@bufbuild/protobuf';

/**
 * Creates an Authorization object from auth details.
 *
 * @param organizationId The ID of the organization to create the role under
 * @param entityId The ID of the entity the role belongs to (e.g., a user ID)
 * @param role The role to add ("owner" or "operator")
 * @param resourceType The type of resource to create the role for ("robot",
 *   "location", or "organization")
 * @param identityType The type of identity that the identity ID is (e.g., an
 *   api-key)
 * @param resourceId The ID of the resource the role is being created for
 */
export const createAuth = (
  organizationId: string,
  entityId: string,
  role: string,
  resourceType: string,
  identityType: string,
  resourceId: string
): Authorization => {
  return new Authorization({
    authorizationType: 'role',
    identityId: entityId,
    identityType,
    authorizationId: `${resourceType}_${role}`,
    resourceType,
    organizationId,
    resourceId,
  });
};

/**
 * Creates an Authorization object specifically for a new API key.
 *
 * @param organizationId The ID of the organization to create the role under
 * @param role The role to add ("owner" or "operator")
 * @param resourceType The type of resource to create the role for ("robot",
 *   "location", or "organization")
 * @param resourceId The ID of the resource the role is being created for
 */
export const createAuthForNewAPIKey = (
  organizationId: string,
  role: string,
  resourceType: string,
  resourceId: string
): Authorization => {
  return createAuth(
    organizationId,
    '',
    role,
    resourceType,
    'api-key',
    resourceId
  );
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
): AuthorizedPermissions => {
  return new AuthorizedPermissions({
    resourceType,
    resourceId,
    permissions,
  });
};

export class AppClient {
  private client: Client<typeof AppService>;

  constructor(transport: Transport) {
    this.client = createClient(AppService, transport);
  }

  /**
   * Obain a user's ID from their email address.
   *
   * @param email The email address of the user
   * @returns The user's ID
   */
  async getUserIDByEmail(email: string): Promise<string> {
    const resp = await this.client.getUserIDByEmail({ email });
    return resp.userId;
  }

  /**
   * Create a new organization.
   *
   * @param name The name of the new organization
   * @returns The new organization
   */
  async createOrganization(name: string): Promise<Organization | undefined> {
    const resp = await this.client.createOrganization({ name });
    return resp.organization;
  }

  /**
   * List all organizations.
   *
   * @returns The organization list
   */
  async listOrganizations(): Promise<Organization[]> {
    const resp = await this.client.listOrganizations({});
    return resp.organizations;
  }

  /**
   * List all organizations with access to a particular location.
   *
   * @param locationId The ID of the location to query
   * @returns The list of locations with access to the requested location
   */
  async getOrganizationsWithAccessToLocation(
    locationId: string
  ): Promise<OrganizationIdentity[]> {
    const resp = await this.client.getOrganizationsWithAccessToLocation({
      locationId,
    });
    return resp.organizationIdentities;
  }

  /**
   * List all organizations associated with a user.
   *
   * @param userId The ID of the user to query
   * @returns The list of locations the requested user has access to
   */
  async listOrganizationsByUser(userId: string): Promise<OrgDetails[]> {
    const resp = await this.client.listOrganizationsByUser({ userId });
    return resp.orgs;
  }

  /**
   * Get details about an organization.
   *
   * @param organizationId The ID of the organization
   * @returns Details about the organization, if it exists
   */
  async getOrganization(
    organizationId: string
  ): Promise<Organization | undefined> {
    const resp = await this.client.getOrganization({ organizationId });
    return resp.organization;
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
    const resp = await this.client.getOrganizationNamespaceAvailability({
      publicNamespace: namespace,
    });
    return resp.available;
  }

  /**
   * Updates organization details.
   *
   * @param organizationId The id of the organization to update
   * @param name Optional name to update the organization with
   * @param publicNamespace Optional namespace to update the organization with
   * @param region Optional region to update the organization with
   * @param cid Optional CRM ID to update the organization with
   * @returns The updated organization details
   */
  async updateOrganization(
    organizationId: string,
    name?: string,
    publicNamespace?: string,
    region?: string,
    cid?: string
  ): Promise<Organization | undefined> {
    const resp = await this.client.updateOrganization({
      organizationId,
      name,
      publicNamespace,
      region,
      cid,
    });
    return resp.organization;
  }

  /**
   * Deletes an organization.
   *
   * @param organizationId The id of the organization to delete
   */
  async deleteOrganization(organizationId: string) {
    await this.client.deleteOrganization({ organizationId });
  }

  /**
   * Lists organization memebers and outstanding invites.
   *
   * @param organizationId The id of the organization to query
   * @returns An object containing organization members, pending invites, and
   *   org ID
   */
  async listOrganizationMembers(
    organizationId: string
  ): Promise<ListOrganizationMembersResponse> {
    return this.client.listOrganizationMembers({ organizationId });
  }

  /**
   * Creates a new invitation to join an organization.
   *
   * @param organizationId The id of the organization to create the invite for
   * @param email The email address of the user to generate an invite for
   * @param authorizations The authorizations to associate with the new invite
   * @param sendEmailInvite Bool of whether to send an email invite (true) or
   *   automatically add a user. Defaults to true
   * @returns The organization invite
   */
  async createOrganizationInvite(
    organizationId: string,
    email: string,
    authorizations: Authorization[],
    sendEmailInvite = true
  ): Promise<OrganizationInvite | undefined> {
    const resp = await this.client.createOrganizationInvite({
      organizationId,
      email,
      authorizations,
      sendEmailInvite,
    });
    return resp.invite;
  }

  /**
   * Updates authorizations for an existing org invite.
   *
   * @param organizationId The id of the organization
   * @param email The email address associated with the invite
   * @param addAuthsList List of authorizations to add to the invite
   * @param removeAuthsList List of authorizations to remove from the invite
   * @returns The organization invite
   */
  async updateOrganizationInviteAuthorizations(
    organizationId: string,
    email: string,
    addAuthsList: Authorization[],
    removeAuthsList: Authorization[]
  ): Promise<OrganizationInvite | undefined> {
    const resp = await this.client.updateOrganizationInviteAuthorizations({
      organizationId,
      email,
      addAuthorizations: addAuthsList,
      removeAuthorizations: removeAuthsList,
    });
    return resp.invite;
  }

  /**
   * Removes a member from an organization.
   *
   * @param organizationId The ID of the organization
   * @param userId The ID of the user
   */
  async deleteOrganizationMember(organizationId: string, userId: string) {
    await this.client.deleteOrganizationMember({ organizationId, userId });
  }

  /**
   * Deletes a pending organization invite.
   *
   * @param organizationId The ID of the organization
   * @param email The email associated with the invite to delete
   */
  async deleteOrganizationInvite(organizationId: string, email: string) {
    await this.client.deleteOrganizationInvite({ organizationId, email });
  }

  /**
   * Resends a pending organization invite.
   *
   * @param organizationId The ID of the organization
   * @param email The email associated with the invite to resend
   * @returns The invite
   */
  async resendOrganizationInvite(
    organizationId: string,
    email: string
  ): Promise<OrganizationInvite | undefined> {
    const resp = await this.client.resendOrganizationInvite({
      organizationId,
      email,
    });
    return resp.invite;
  }

  /**
   * Creates a new location.
   *
   * @param organizationId The ID of the organization to create the location
   *   under
   * @param name The name of the location to create
   * @param parentLocationId Optional name of a parent location to create the
   *   new location under
   * @returns The location object
   */
  async createLocation(
    organizationId: string,
    name: string,
    parentLocationId?: string
  ): Promise<Location | undefined> {
    const resp = await this.client.createLocation({
      organizationId,
      name,
      parentLocationId,
    });
    return resp.location;
  }

  /**
   * Looks up a location.
   *
   * @param locId The ID of the location to query.
   * @returns The location object
   */
  async getLocation(locId: string): Promise<Location | undefined> {
    const resp = await this.client.getLocation({
      locationId: locId,
    });
    return resp.location;
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
  ): Promise<Location | undefined> {
    const resp = await this.client.updateLocation({
      locationId: locId,
      name,
      parentLocationId: parentLocId,
      region,
    });
    return resp.location;
  }

  /**
   * Deletes a location
   *
   * @param locId The ID of the location to delete
   */
  async deleteLocation(locId: string) {
    await this.client.deleteLocation({ locationId: locId });
  }

  /**
   * Lists all locations under an organization.
   *
   * @param organizationId The ID of the organization to query
   * @returns A list of locations under the organization
   */
  async listLocations(organizationId: string): Promise<Location[]> {
    const resp = await this.client.listLocations({ organizationId });
    return resp.locations;
  }

  /**
   * Shares a location with another organization
   *
   * @param organizationId The ID of the organization to share with
   * @param locId The ID of the location to share
   */
  async shareLocation(organizationId: string, locId: string) {
    await this.client.shareLocation({ organizationId, locationId: locId });
  }

  /**
   * Unshares a location with an organization
   *
   * @param organizationId The ID of the organization to unshare with
   * @param locId The ID of the location to unshare
   */
  async unshareLocation(organizationId: string, locId: string) {
    await this.client.unshareLocation({ organizationId, locationId: locId });
  }

  /**
   * Get a location's `LocationAuth` (location secret(s)).
   *
   * @param locId The ID of the location to retrieve `LocationAuth` from.
   * @returns The `LocationAuth` for the requested location.
   */
  async locationAuth(locId: string): Promise<LocationAuth | undefined> {
    const resp = await this.client.locationAuth({ locationId: locId });
    return resp.auth;
  }

  /**
   * Create a location secret (`LocationAuth`).
   *
   * @param locId The ID of the location to create a `LocationAuth` for
   * @returns The newly created `LocationAuth`
   */
  async createLocationSecret(locId: string): Promise<LocationAuth | undefined> {
    const resp = await this.client.createLocationSecret({ locationId: locId });
    return resp.auth;
  }

  /**
   * Deletes a location secret (`LocationAuth`).
   *
   * @param locId The ID of the location to delete the `LocationAuth` from
   * @param secretId The ID of the location secret to delete
   */
  async deleteLocationSecret(locId: string, secretId: string) {
    await this.client.deleteLocationSecret({ locationId: locId, secretId });
  }

  /**
   * Queries a robot by its ID.
   *
   * @param id The ID of the robot
   * @returns The `Robot` object
   */
  async getRobot(id: string): Promise<Robot | undefined> {
    const resp = await this.client.getRobot({ id });
    return resp.robot;
  }

  /**
   * Returns a list of rover rental robots for an organization.
   *
   * @param orgId The ID of the organization to query
   * @returns The list of `RoverRentalRobot` objects
   */
  async getRoverRentalRobots(orgId: string): Promise<RoverRentalRobot[]> {
    const resp = await this.client.getRoverRentalRobots({ orgId });
    return resp.robots;
  }

  /**
   * Returns a list of parts for a given robot
   *
   * @param robotId The ID of the robot to query
   * @returns The list of `RobotPart` objects associated with the robot
   */
  async getRobotParts(robotId: string): Promise<RobotPart[]> {
    const resp = await this.client.getRobotParts({ robotId });
    return resp.parts;
  }

  /**
   * Queries a specific robot part by ID.
   *
   * @param id The ID of the requested robot part
   * @returns The robot part and a its json config
   */
  async getRobotPart(id: string): Promise<GetRobotPartResponse> {
    return this.client.getRobotPart({ id });
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
  ): Promise<GetRobotPartLogsResponse> {
    return this.client.getRobotPartLogs({
      id,
      filter,
      levels,
      pageToken,
    });
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
    queue: LogEntry[],
    filter?: string,
    errorsOnly = true
  ) {
    const stream = this.client.tailRobotPartLogs({
      id,
      errorsOnly,
      filter,
    });
    for await (const entry of stream) {
      for (const log of entry.logs) {
        queue.push(log);
      }
    }
  }

  /**
   * Get a list containing the history of a robot part.
   *
   * @param id The ID of the requested robot part
   * @returns The list of the robot part's history
   */
  async getRobotPartHistory(id: string): Promise<RobotPartHistoryEntry[]> {
    const resp = await this.client.getRobotPartHistory({ id });
    return resp.history;
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
    robotConfig: Struct
  ): Promise<RobotPart | undefined> {
    const resp = await this.client.updateRobotPart({ id, name, robotConfig });
    return resp.part;
  }

  /**
   * Creates a new robot part.
   *
   * @param robotId The ID of the robot to create a part for
   * @param partName The name for the new robot part
   * @returns The ID of the newly-created robot part
   */
  async newRobotPart(robotId: string, partName: string): Promise<string> {
    const resp = await this.client.newRobotPart({ robotId, partName });
    return resp.partId;
  }

  /**
   * Deletes a robot part.
   *
   * @param partId The ID of the part to delete
   */
  async deleteRobotPart(partId: string) {
    await this.client.deleteRobotPart({ partId });
  }

  /**
   * Gets a list of a robot's API keys.
   *
   * @param robotId The ID of the robot to get API keys for
   * @returns A list of the robot's API keys
   */
  async getRobotAPIKeys(robotId: string): Promise<APIKeyWithAuthorizations[]> {
    const resp = await this.client.getRobotAPIKeys({ robotId });
    return resp.apiKeys;
  }

  /**
   * Marks a robot part as the main part.
   *
   * @param partId The ID of the part to mark as main
   */
  async markPartAsMain(partId: string) {
    await this.client.markPartAsMain({ partId });
  }

  /**
   * Marks a robot part for restart.
   *
   * @param partId The ID of the part to mark for restart
   */
  async markPartForRestart(partId: string) {
    await this.client.markPartForRestart({ partId });
  }

  /**
   * Creates a new secret for a robot part.
   *
   * @param partId The ID of the part to create a secret for
   * @returns The robot part object
   */
  async createRobotPartSecret(partId: string): Promise<RobotPart | undefined> {
    const resp = await this.client.createRobotPartSecret({ partId });
    return resp.part;
  }

  /**
   * Deletes a robot secret from a robot part.
   *
   * @param partId The ID of the part to delete a secret from
   * @param secretId The ID of the secret to delete
   */
  async deleteRobotPartSecret(partId: string, secretId: string) {
    await this.client.deleteRobotPartSecret({ partId, secretId });
  }

  /**
   * Lists all robots in a location.
   *
   * @param locId The ID of the location to list robots for
   * @returns The list of robot objects
   */
  async listRobots(locId: string): Promise<Robot[]> {
    const resp = await this.client.listRobots({ locationId: locId });
    return resp.robots;
  }

  /**
   * Creates a new robot.
   *
   * @param locId The ID of the location to create the robot in
   * @param name The name of the new robot
   * @returns The new robot's ID
   */
  async newRobot(locId: string, name: string): Promise<string> {
    const resp = await this.client.newRobot({ name, location: locId });
    return resp.id;
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
  ): Promise<Robot | undefined> {
    const resp = await this.client.updateRobot({
      id: robotId,
      location: locId,
      name,
    });
    return resp.robot;
  }

  /**
   * Deletes a robot.
   *
   * @param id The ID of the robot to delete
   */
  async deleteRobot(id: string) {
    await this.client.deleteRobot({ id });
  }

  /**
   * Lists all fragments within an organization.
   *
   * @param organizationId The ID of the organization to list fragments for
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
    organizationId: string,
    publicOnly = true,
    fragmentVisibility: FragmentVisibility[] = []
  ): Promise<Fragment[]> {
    const resp = await this.client.listFragments({
      organizationId,
      showPublic: publicOnly,
      fragmentVisibility,
    });
    return resp.fragments;
  }

  /**
   * Looks up a fragment by ID.
   *
   * @param id The ID of the fragment to look up
   * @returns The requested fragment
   */
  async getFragment(id: string): Promise<Fragment | undefined> {
    const resp = await this.client.getFragment({ id });
    return resp.fragment;
  }

  /**
   * Creates a new fragment.
   *
   * @param organizationId The ID of the organization to create the fragment
   *   under
   * @param name The name of the new fragment
   * @param config The new fragment's config
   * @returns The newly created fragment
   */
  async createFragment(
    organizationId: string,
    name: string,
    config: Struct
  ): Promise<Fragment | undefined> {
    const resp = await this.client.createFragment({
      organizationId,
      name,
      config,
    });
    return resp.fragment;
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
    config: Struct,
    makePublic?: boolean,
    visibility?: FragmentVisibility
  ): Promise<Fragment | undefined> {
    const resp = await this.client.updateFragment({
      id,
      name,
      config,
      public: makePublic,
      visibility,
    });
    return resp.fragment;
  }

  /**
   * Deletes a fragment.
   *
   * @param id The ID of the fragment to delete
   */
  async deleteFragment(id: string) {
    await this.client.deleteFragment({ id });
  }

  /**
   * @param machineId The machine ID used to filter fragments defined in a
   *   machine's parts. Also returns any fragments nested within the fragments
   *   defined in parts.
   * @param additionalFragmentIds Additional fragment IDs to append to the
   *   response. Useful when needing to view fragments that will be
   *   provisionally added to the machine alongside existing fragments.
   * @returns The list of top level and nested fragments for a machine, as well
   *   as additionally specified fragment IDs.
   */
  async listMachineFragments(
    machineId: string,
    additionalFragmentIds?: string[]
  ): Promise<Fragment[]> {
    const resp = await this.client.listMachineFragments({
      machineId,
      additionalFragmentIds,
    });
    return resp.fragments;
  }

  /**
   * Add a role under an organization.
   *
   * @param organizationId The ID of the organization to create the role under
   * @param entityId The ID of the entity the role belongs to (e.g., a user ID)
   * @param role The role to add ("owner" or "operator")
   * @param resourceType The type of resource to create the role for ("robot",
   *   "location", or "organization")
   * @param resourceId The ID of the resource the role is being created for
   */
  async addRole(
    organizationId: string,
    entityId: string,
    role: string,
    resourceType: string,
    resourceId: string
  ) {
    await this.client.addRole({
      authorization: createAuth(
        organizationId,
        entityId,
        role,
        resourceType,
        '',
        resourceId
      ),
    });
  }

  /**
   * Removes a role from an organization.
   *
   * @param organizationId The ID of the organization to remove the role from
   * @param entityId The ID of the entity the role belongs to (e.g., a user ID)
   * @param role The role to remove ("owner" or "operator")
   * @param resourceType The type of resource to remove the role from ("robot",
   *   "location", or "organization")
   * @param resourceId The ID of the resource the role is being removes from
   */
  async removeRole(
    organizationId: string,
    entityId: string,
    role: string,
    resourceType: string,
    resourceId: string
  ) {
    await this.client.removeRole({
      authorization: createAuth(
        organizationId,
        entityId,
        role,
        resourceType,
        '',
        resourceId
      ),
    });
  }

  /**
   * Changes an existing role.
   *
   * @param oldAuth The existing authorization
   * @param newAuth The new authorization
   */
  async changeRole(
    oldAuthorization: Authorization,
    newAuthorization: Authorization
  ) {
    await this.client.changeRole({ oldAuthorization, newAuthorization });
  }

  /**
   * List all authorizations for an organization.
   *
   * @param organizationId The ID of the organization to list authorizations for
   * @param resourceIds Optional list of IDs of resources to list authorizations
   *   for. If not provided, all resources will be included
   * @returns The list of authorizations
   */
  async listAuthorizations(
    organizationId: string,
    resourceIds?: string[]
  ): Promise<Authorization[]> {
    const resp = await this.client.listAuthorizations({
      organizationId,
      resourceIds,
    });
    return resp.authorizations;
  }

  /**
   * Checks whether requested permissions exist.
   *
   * @param permissions A list of permissions to check
   * @returns A filtered list of the authorized permissions
   */
  async checkPermissions(
    permissions: AuthorizedPermissions[]
  ): Promise<AuthorizedPermissions[]> {
    const resp = await this.client.checkPermissions({ permissions });
    return resp.authorizedPermissions;
  }

  /**
   * Get an item from the registry.
   *
   * @param itemId The ID of the item to get
   * @returns The requested item
   */
  async getRegistryItem(itemId: string): Promise<RegistryItem | undefined> {
    const resp = await this.client.getRegistryItem({ itemId });
    return resp.item;
  }

  /**
   * Create a new registry item.
   *
   * @param organizationId The ID of the organization to create the registry
   *   item under
   * @param name The name of the registry item
   * @param type The type of the item in the registry.
   */
  async createRegistryItem(
    organizationId: string,
    name: string,
    type: PackageType
  ) {
    await this.client.createRegistryItem({
      organizationId,
      name,
      type,
    });
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
    type: PackageType,
    description: string,
    visibility: Visibility
  ) {
    await this.client.updateRegistryItem({
      itemId,
      type,
      description,
      visibility,
    });
  }

  /**
   * List all registry items for an organization.
   *
   * @param organizationId The ID of the organization to query registry items
   *   for
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
    organizationId: string,
    types: PackageType[],
    visibilities: Visibility[],
    platforms: string[],
    statuses: RegistryItemStatus[],
    searchTerm?: string,
    pageToken?: string
  ): Promise<RegistryItem[]> {
    const req = {
      organizationId,
      types,
      visibilities,
      platforms,
      statuses,
      searchTerm,
      pageToken,
    };
    const resp = await this.client.listRegistryItems(req);
    return resp.items;
  }

  /**
   * Deletes a registry item.
   *
   * @param itemId The ID of the item to delete
   */
  async deleteRegistryItem(itemId: string) {
    await this.client.deleteRegistryItem({
      itemId,
    });
  }

  /**
   * Creates a new module.
   *
   * @param organizationId The ID of the organization to create the module under
   * @param name The name of the module
   * @returns The module ID and a URL to its detail page
   */
  async createModule(
    organizationId: string,
    name: string
  ): Promise<CreateModuleResponse> {
    return this.client.createModule({
      organizationId,
      name,
    });
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
    visibility: Visibility,
    url: string,
    description: string,
    models: Model[],
    entrypoint: string
  ): Promise<string> {
    const resp = await this.client.updateModule({
      moduleId,
      visibility,
      url,
      description,
      models,
      entrypoint,
    });
    return resp.url;
  }

  /**
   * Looks up a particular module.
   *
   * @param moduleId The ID of the module
   * @returns The requested module
   */
  async getModule(moduleId: string): Promise<Module | undefined> {
    const resp = await this.client.getModule({ moduleId });
    return resp.module;
  }

  /**
   * Lists all modules for an organization.
   *
   * @param organizationId The ID of the organization to query
   * @returns The organization's modules
   */
  async listModules(organizationId: string): Promise<Module[]> {
    const resp = await this.client.listModules({ organizationId });
    return resp.modules;
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
    authorizations: Authorization[],
    name?: string
  ): Promise<CreateKeyResponse> {
    return this.client.createKey({ name, authorizations });
  }

  /**
   * Deletes an existing API key.
   *
   * @param id The ID of the key to delete
   */
  async deleteKey(id: string) {
    return this.client.deleteKey({ id });
  }

  /**
   * List all API keys for an organization.
   *
   * @param orgId The ID of the organization to query
   * @returns The list of API keys
   */
  async listKeys(orgId: string): Promise<APIKeyWithAuthorizations[]> {
    const resp = await this.client.listKeys({ orgId });
    return resp.apiKeys;
  }

  /**
   * Rotates an existing API key.
   *
   * @param id The ID of the key to rotate
   * @returns The updated key and ID
   */
  async rotateKey(id: string): Promise<RotateKeyResponse> {
    return this.client.rotateKey({ id });
  }

  /**
   * Creates a new key with an existing key's authorizations
   *
   * @param id The ID of the key to duplicate
   * @returns The new key and ID
   */
  async createKeyFromExistingKeyAuthorizations(
    id: string
  ): Promise<CreateKeyFromExistingKeyAuthorizationsResponse> {
    return this.client.createKeyFromExistingKeyAuthorizations({ id });
  }

  /**
   * Retrieves user-defined metadata for an organization.
   *
   * @param id The ID of the organization
   * @returns The metadata associated with the organization
   */
  async getOrganizationMetadata(
    id: string
  ): Promise<GetOrganizationMetadataResponse> {
    return this.client.getOrganizationMetadata({ organizationId: id });
  }

  /**
   * Updates user-defined metadata for an organization.
   *
   * @param id The ID of the organization
   * @param data The metadata to update
   * @returns Response indicating success or failure
   */
  async updateOrganizationMetadata(
    id: string,
    data: Record<string, Any>
  ): Promise<UpdateOrganizationMetadataResponse> {
    return this.client.updateOrganizationMetadata({ organizationId: id, data });
  }

  /**
   * Retrieves user-defined metadata for a location.
   *
   * @param id The ID of the location
   * @returns The metadata associated with the location
   */
  async getLocationMetadata(id: string): Promise<GetLocationMetadataResponse> {
    return this.client.getLocationMetadata({ locationId: id });
  }

  /**
   * Updates user-defined metadata for a location.
   *
   * @param id The ID of the location
   * @param data The metadata to update
   * @returns Response indicating success or failure
   */
  async updateLocationMetadata(
    id: string,
    data: Record<string, Any>
  ): Promise<UpdateLocationMetadataResponse> {
    return this.client.updateLocationMetadata({ locationId: id, data });
  }

  /**
   * Retrieves user-defined metadata for a machine.
   *
   * @param id The ID of the machine
   * @returns The metadata associated with the machine
   */
  async getMachineMetadata(id: string): Promise<GetRobotMetadataResponse> {
    return this.client.getRobotMetadata({ id });
  }

  /**
   * Updates user-defined metadata for a robot.
   *
   * @param id The ID of the machine
   * @param data The metadata to update
   * @returns Response indicating success or failure
   */
  async updateMachineMetadata(
    id: string,
    data: Record<string, Any>
  ): Promise<UpdateRobotMetadataResponse> {
    return this.client.updateRobotMetadata({ id, data });
  }

  /**
   * Retrieves user-defined metadata for a machine part.
   *
   * @param id The ID of the machine part
   * @returns The metadata associated with the machine part
   */
  async getMachinePartMetadata(
    id: string
  ): Promise<GetRobotPartMetadataResponse> {
    return this.client.getRobotPartMetadata({ id });
  }

  /**
   * Updates user-defined metadata for a machine part.
   *
   * @param id The ID of the machine part
   * @param data The metadata to update
   * @returns Response indicating success or failure
   */
  async updateMachinePartMetadata(
    id: string,
    data: Record<string, Any>
  ): Promise<UpdateRobotPartMetadataResponse> {
    return this.client.updateRobotPartMetadata({ id, data });
  }
}
