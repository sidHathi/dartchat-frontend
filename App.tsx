import React, {useState, useEffect} from 'react';

// import statusCodes along with GoogleSignin
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { NativeBaseProvider, Box, Text, Center, Button } from 'native-base';
import AuthIdentityContainer from './components/AuthIdentityContainer';
import Home from './components/Home';

GoogleSignin.configure();

export default function App(): JSX.Element {
  return (
    <NativeBaseProvider>
      <AuthIdentityContainer>
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
      </AuthIdentityContainer>
    </NativeBaseProvider>
  );
}
