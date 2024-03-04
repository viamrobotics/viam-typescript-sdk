/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {PropsWithoutRef} from 'react';
import {useState} from 'react';
import {
  Button,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as VIAM from '@viamrobotics/sdk';

type ResourceNameViewProps = PropsWithoutRef<{
  resourceName: VIAM.ResourceName;
}>;

function ResourceNameView({
  resourceName,
}: ResourceNameViewProps): React.JSX.Element {
  return (
    <View style={[styles.listItem]}>
      <Text style={[styles.listItemTitle]}>{resourceName.name}</Text>
      <Text style={[styles.listItemSubtitle]}>
        {resourceName.namespace}/{resourceName.type}/{resourceName.subtype}
      </Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const [connected, setConnected] = useState<boolean>(false);
  const [resourceNames, setResourceNames] = useState<VIAM.ResourceName[]>([]);

  async function connect() {
    const host = '<HOST>';
    const client = await VIAM.createRobotClient({
      host,
      credential: {
        type: 'api-key',
        payload: '<API_KEY>',
      },
      authEntity: '<API_KEY_ID>',
      signalingAddress: 'https://app.viam.com:443',
    });
    setConnected(true);
    const rns = await client.resourceNames();
    setResourceNames(rns.sort((a, b) => (a.name < b.name ? -1 : 1)));
  }

  return (
    <SafeAreaView>
      <StatusBar />
      <Button
        title={connected ? 'Connected' : 'Connect'}
        onPress={connect}
        disabled={connected}
      />
      <FlatList
        data={resourceNames}
        renderItem={({item}) => <ResourceNameView resourceName={item} />}
        keyExtractor={item =>
          `${item.namespace}/${item.type}/${item.subtype}:${item.name}`
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listItem: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  listItemSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default App;
