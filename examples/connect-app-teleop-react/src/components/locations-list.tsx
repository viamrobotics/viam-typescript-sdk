import { appApi, type AppClient } from '@viamrobotics/sdk';
import { useEffect, useState } from 'react';

export interface LocationsListProps {
  appClient: AppClient;
  organization: appApi.Organization.AsObject
  onLocationSelected: (location: appApi.Location.AsObject) => unknown;
}

export const LocationsList = ({ appClient, organization, onLocationSelected }: LocationsListProps): JSX.Element => {

  const [locations, setLocations] = useState<appApi.Location.AsObject[]>([]);
  useEffect(() => {
    async function getLocations() {
      const locations = await appClient.listLocations(organization.id);
      setLocations(locations);
    }
    getLocations();
  }, [appClient, organization.id]);

  return (
    <div>
      {locations?.map((location) => {
        return <div key={location.id}>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            onLocationSelected(location);
          }}>{location.name}</a>
        </div>
      })}
    </div >
  );
};
