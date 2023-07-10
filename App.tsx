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

LogBox.ignoreLogs([
  'In React 18, SSRProvider is not necessary and is a noop. You can remove it from your app.',
  "Constants.platform.ios.model has been deprecated in favor of expo-device's Device.modelName property. This API will be removed in SDK 45."
  ]);

GoogleSignin.configure();
requestUserPermission();

export default function App(): JSX.Element {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{flex: 1}}>
        <NativeBaseProvider>
          <NetworkContextProvider>
            <SocketContextProvider>
              <AuthIdentityController>
                  <NotificationsController />
                  <UIContextProvider>
                    <Box flex='1'>
                        <Home />
                    </Box>
                  </UIContextProvider>
                </AuthIdentityController>
            </SocketContextProvider>
          </NetworkContextProvider>
        </NativeBaseProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
