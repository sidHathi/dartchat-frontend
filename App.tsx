import React, {useState, useEffect} from 'react';

// import statusCodes along with GoogleSignin
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { NativeBaseProvider, Box, Text, Center, Button } from 'native-base';
import AuthIdentityController from './components/AuthIdentityController';
import Home from './components/Home';
import { SocketContextProvider } from './contexts/SocketContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UIContextProvider } from './contexts/UIContext';

GoogleSignin.configure();

export default function App(): JSX.Element {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NativeBaseProvider>
          <SocketContextProvider>
            <AuthIdentityController>
                <UIContextProvider>
                  <Box h='100%' w='100%'>
                      <Home />
                      <Center>
                        <Text>
                          Logged in
                        </Text>
                        <Button onPress={() => auth().signOut()}>
                          Log out
                        </Button>
                      </Center>
                  </Box>
                </UIContextProvider>
              </AuthIdentityController>
          </SocketContextProvider>
      </NativeBaseProvider>
    </GestureHandlerRootView>
  );
}
