import React, {useState, useEffect} from 'react';

// import statusCodes along with GoogleSignin
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { NativeBaseProvider, Box, Text, Center, Button } from 'native-base';
import AuthIdentityController from './components/AuthIdentityController';
import Home from './components/Home';
import { SocketContextProvider } from './contexts/SocketContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UIContextProvider } from './contexts/UIContext';
import  { store } from './redux/store';
import { Provider } from 'react-redux';
import { NetworkContextProvider } from './contexts/NetworkContext';
import { LogBox } from "react-native";
import { requestUserPermission } from './firebase/pushNotifications';
import NotificationsController from './components/NotificationsController';
import UserSecretsController from './components/UserSecretsController';
import LogController from './components/TestingPanel/LogController';

LogBox.ignoreLogs([
  'In React 18, SSRProvider is not necessary and is a noop. You can remove it from your app.',
  "Constants.platform.ios.model has been deprecated in favor of expo-device's Device.modelName property. This API will be removed in SDK 45.",
  "ViewPropTypes will be removed from React Native, along with all other PropTypes. We recommend that you migrate away from PropTypes and switch to a type system like TypeScript. If you need to continue using ViewPropTypes, migrate to the 'deprecated-react-native-prop-types' package.",
  ]);

GoogleSignin.configure();
requestUserPermission();

export default function App(): JSX.Element {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{flex: 1}}>
        <NativeBaseProvider>
          <LogController>
            <NetworkContextProvider>
              <SocketContextProvider>
                <UIContextProvider>
                  <AuthIdentityController>
                    <UserSecretsController>
                      <NotificationsController />
                      <Box flex='1'>
                        <Home />
                      </Box>
                    </UserSecretsController>
                  </AuthIdentityController>
                </UIContextProvider>
              </SocketContextProvider>
            </NetworkContextProvider>
          </LogController>
        </NativeBaseProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
