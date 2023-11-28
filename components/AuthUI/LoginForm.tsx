import React, { useState } from "react";
import { Input, VStack, Button, Text, FormControl, Center } from "native-base";
import { signInUser } from "../../firebase";
import { NativeSyntheticEvent, TextInputChangeEventData } from "react-native";

export default function LoginForm(): JSX.Element {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | undefined>(undefined);

    const handleEmailChange = (newEmail: NativeSyntheticEvent<TextInputChangeEventData>) => setEmail(newEmail.nativeEvent.text);
    const handlePasswordChange = (newPass: NativeSyntheticEvent<TextInputChangeEventData>) => setPassword(newPass.nativeEvent.text);

    const handleSubmit = () => {
        // console.log('login pressed');
        signInUser(email, password)
            .catch((err) => setError(err.message));
    }

    return <VStack marginTop='8px'>
        <FormControl>
            <Input w='100%' borderColor='#777' borderRadius='40px'  paddingY='8px' paddingX='16px' color='white' placeholder='Email' marginY='8px' autoCapitalize='none'
            value={email} onChange={handleEmailChange}>
            </Input>
            <Input w='100%' borderColor='#777' borderRadius='40px'  autoCapitalize='none' marginY='8px'  paddingY='8px' paddingX='16px' color='white' placeholder='Password' type='password' value={password} onChange={handlePasswordChange}>
            </Input>
            {error &&
                <Center>
                    <Text color='red.500' textAlign='center' fontSize='xs'>{error}</Text>
                </Center>
            }
            <Button w='100%' borderRadius='40px' backgroundColor='#ddd' marginY='8px' paddingY='4px' paddingX='16px' color='#444' 
            size='sm' onPress={handleSubmit}>
                <Text color='black' fontWeight='medium'>Submit</Text>
            </Button>
        </FormControl>
    </VStack>
}
