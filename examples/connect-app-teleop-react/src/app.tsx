import { FusionAuthLogoutButton, useFusionAuth } from '@fusionauth/react-sdk';
import { type AccessToken, type Credential } from '@viamrobotics/sdk';
import { useEffect, useState } from 'react';
import { LocationsList } from './components/locations-list.js';
import { MachinePartControl } from './components/machine-part-control.js';
import { MachinePartsList } from './components/machine-parts-list.js';
import { MachinesList } from './components/machines-list.js';
import { OrganizationsList } from './components/orgs-list.jsx';
import type { BuildEnvironment } from './env.js';
import { BrowserStateKey, BrowserStateStore, useBrowserStateStore, type Breadcrumb } from './state.js';

export interface AppProps {
  env: BuildEnvironment;
}

export const App = ({ env }: AppProps): JSX.Element => {
  const {
    isLoggedIn,
    isFetchingUserInfo,
    startLogin,
    startRegister,
  } = useFusionAuth()

  let [creds, setCreds] = useState<Credential | AccessToken | undefined>(undefined);
  const browerStateStore = useBrowserStateStore(creds);
  
  useEffect(() => {
    if (env.auth.case == "third_party") {
      if (!isLoggedIn) {
        return;
      }
      const accessToken = getCookie("app.at");
      if (accessToken === undefined) {
        return;
      }
      setCreds({
        type: 'access-token',
        payload: accessToken,
      });
    } else {
      setCreds({
        type: 'api-key',
        authEntity: env.auth.apiKeyId,
        payload: env.auth.apiKeySecret,
      });
    }

    return undefined;
  }, [isLoggedIn])

  if (!creds) {
    if (env.auth.case == "third_party") {
      if (isFetchingUserInfo) {
        return <p>Loading...</p>
      }

      if (!isLoggedIn) {
        return (
          <div className='mx-2'>
            <button onClick={() => startLogin()}>Login</button>
            /
            <button onClick={() => startRegister()}>Register</button>
          </div>
        );
      }

      return <p>Expected access token</p>;
    } else {
      return <p>Loading...</p>
    }
  }

  return (
    <div className='mx-2'> 
      {env.auth.case == "third_party" ? <FusionAuthLogoutButton className="my-2 text-s" /> : <></>}
      {renderState(creds, browerStateStore)}
    </div>
  );
};

// From https://stackoverflow.com/a/15724300 CC BY-SA 4.0
function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift();
  return undefined;
}

function renderBreadcrumbs(breadcrumbs: Breadcrumb[]) {
  return (<>
    <h1>
      {breadcrumbs.map((bc, index) => {
        return (<span key={index}>
          {bc.onClick ? <a href="#" className='text-blue-400' onClick={(e: React.MouseEvent<HTMLElement>) => {
            e.preventDefault();
            bc.onClick!();
          }}>{bc.name}</a > : <span className='font-bold'>{bc.name}</span>}
          {index !== breadcrumbs.length - 1 ? ' > ' : ''
          }
        </span >)
      })}
    </h1 >
  </>)
}

function renderState(
  creds: AccessToken | Credential, 
  store: BrowserStateStore,
): JSX.Element | string {
  // a simple router to avoid a routing dependency. Your own app may want
  // something more sophisticated
  switch (store.state.key) {
    case BrowserStateKey.Organizations:
      return (
        <>
          {renderBreadcrumbs(store.breadcrumbs())}
          <OrganizationsList
            appClient={store.state.appClient}
            onOrganizationSelected={store.onOrganizationSelected(store.state)}
          />
        </>)
        ;
    case BrowserStateKey.Locations:
      return (
        <>
          {renderBreadcrumbs(store.breadcrumbs())}
          <LocationsList
            appClient={store.state.appClient}
            organization={store.state.organization} 
            onLocationSelected={store.onLocationSelected(store.state)}
          />
        </>)
        ;
    case BrowserStateKey.Machines:
      return (
        <>
          {renderBreadcrumbs(store.breadcrumbs())}
          <MachinesList 
            appClient={store.state.appClient} 
            location={store.state.location} 
            onMachineSelected={store.onMachineSelected(store.state)}
          />
        </>
      );
    case BrowserStateKey.MachineParts:
      return (
        <>
          {renderBreadcrumbs(store.breadcrumbs())}
          <MachinePartsList
            appClient={store.state.appClient}
            machine={store.state.machine} 
            onMachinePartSelected={store.onMachinePartSelected(store.state)}
          />
        </>
      );
    case BrowserStateKey.ControlMachinePart:
      return (
        <>
          {renderBreadcrumbs(store.breadcrumbs())}
          <MachinePartControl
            credentials={creds}
            machinePart={store.state.machinePart} 
          />
        </>
      );
    default:
      return 'Loading...';
  }
}

