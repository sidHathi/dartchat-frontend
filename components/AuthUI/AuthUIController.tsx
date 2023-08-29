import React, {useState} from "react";

import { Center, Flex, Heading, VStack, Pressable, Text, View, Box } from "native-base";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { SvgXml } from "react-native-svg";
import DartChatLogoXML from "../../assets/DartChatLogoXML";
import { GoogleSignin, statusCodes, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useKeyboard } from "@react-native-community/hooks";

export default function AuthUIController(): JSX.Element {
    const [signUp, setSignUp] = useState(false);
    const { keyboardShown } = useKeyboard();

    const toggleSignup = () => {
        setSignUp(!signUp);
    };

    const googleSignIn = async () => {
      try {
        await GoogleSignin.hasPlayServices();
        GoogleSignin.signIn().then(data => {
            const credential = auth.GoogleAuthProvider.credential(data.idToken);
            auth().signInWithCredential(credential);
          }).catch(error => {
            console.log('GOOGLE SIGN IN ERROR=', error)
          });
      } catch (error: any) {
        console.log(error);
      }
    };

    return <Flex flex={1} bgColor='#fafafa' w='100%' h='100%'>
        <View bgColor='#222' borderRadius={20} width='90%' m='auto' p='10' shadow='9' mt={keyboardShown ? '90px' : 'auto'}>
            <VStack>
                <Center>
                    <SvgXml xml={DartChatLogoXML} height='20' width='100'/>
                </Center>

                <Heading size='md' color='white' marginTop='24px'>
                    {signUp ? 'Sign up': 'Log in'}
                </Heading>
                {
                    signUp? <SignupForm/> : <LoginForm/>
                }
                <Center marginBottom='8px'>
                    <Text color='white' fontSize='xs'>or</Text>
                </Center>
                <Box mb='16px' borderRadius='30px'>
                <FontAwesome.Button 
                    name="google" 
                    onPress={googleSignIn}
                    style={{
                        backgroundColor:'#555',
                        borderRadius: 30,
                        color: 'f5f5f5',
                    }}
                    backgroundColor='transparent'
                >
                     <Text color='#f5f5f5'>Sign in with Google</Text>
                </FontAwesome.Button>
                </Box>
                {/* <GoogleSigninButton
                  size={GoogleSigninButton.Size.Wide}
                  color={GoogleSigninButton.Color.Light}
                  onPress={googleSignIn}
                  disabled={false}
                  style={{
                    width: '100%',
                    overflow: 'hidden',

                  }}
                /> */}
                <Center>
                {
                    signUp ? <Text color='white' fontSize='xs'>
                        Already have an account? <Pressable p='0' m='0' borderWidth='0' marginBottom='-2px' onPress={toggleSignup}>
                            <Text color='darkBlue.200' fontSize='xs'>Log in</Text>
                        </Pressable>
                    </Text> : <Text color='white' fontSize='xs'>
                        Don't have an account? 
                        <Pressable p='0' m='0' borderWidth='0' marginBottom='-2px' onPress={toggleSignup}>
                            <Text color='darkBlue.200' fontSize='xs'> Sign up</Text>
                        </Pressable>
                    </Text>
                }
                </Center>
            </VStack>
        </View>
    </Flex>
}
