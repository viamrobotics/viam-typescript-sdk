import { appApi, type AppClient } from '@viamrobotics/sdk';
import { useEffect, useState } from 'react';

export interface OrganizationsListProps {
  appClient: AppClient;
  onOrganizationSelected: (organization: appApi.Organization.AsObject) => unknown;
}

export const OrganizationsList = ({ appClient, onOrganizationSelected }: OrganizationsListProps): JSX.Element => {

  const [organizations, setOrganizations] = useState<appApi.Organization.AsObject[]>([]);
  useEffect(() => {
    async function getLocations() {
      const organizations = await appClient.listOrganizations();
      setOrganizations(organizations);
    }
    getLocations();
  }, [appClient]);

  return (
    <div>
      {organizations?.map((organization) => {
        return <div key={organization.id}>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            onOrganizationSelected(organization);
          }}>{organization.name}</a>
        </div>
      })}
    </div >
  );
};
