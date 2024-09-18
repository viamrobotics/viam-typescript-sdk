import { appApi, type AppClient } from '@viamrobotics/sdk';
import { useEffect, useState } from 'react';

export interface LocationsListProps {
  appClient: AppClient;
  orgId: string
  onLocationSelected: (location: appApi.Location.AsObject) => unknown;
}

export const LocationsList = (props: LocationsListProps): JSX.Element => {
  const { appClient, orgId, onLocationSelected } = props;

  const [locations, setLocations] = useState<appApi.Location.AsObject[]>([]);
  useEffect(() => {
    async function getLocations() {
      const locations = await appClient.listLocations(orgId);
      setLocations(locations);
    }
    getLocations();
  }, [appClient, orgId]);

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
