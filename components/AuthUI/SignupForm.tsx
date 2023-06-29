import React, { useState } from "react";
import { Input, VStack, Button, Text, Center } from 'native-base';
import { NativeSyntheticEvent, TextInputChangeEventData } from "react-native";
import { signUpUser } from "../../firebase";

export default function SignupForm(): JSX.Element {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | undefined>(undefined);

    const handleEmailChange = (newEmail: NativeSyntheticEvent<TextInputChangeEventData>) => setEmail(newEmail.nativeEvent.text);
    const handlePasswordChange = (newPass: NativeSyntheticEvent<TextInputChangeEventData>) => setPassword(newPass.nativeEvent.text);
    const handleConfirmChange = (newConf: NativeSyntheticEvent<TextInputChangeEventData>) => setConfirm(newConf.nativeEvent.text);

    const handleSubmit = () => {
        if (password !== confirm) {
            setError("Passwords don't match");
            return;
        }
        signUpUser(email, password)
            .catch((err) => setError(err.message));
    }

    return <VStack marginY='8px'>
    <Input w='100%' borderColor='#777' borderRadius='40px' paddingY='8px' paddingX='16px' color='white' placeholder='Email' marginY='8px'
    value={email} onChange={handleEmailChange} autoCapitalize='none'>
    </Input>
    <Input w='100%' borderColor='#777' borderRadius='40px' marginY='8px'  paddingY='8px' paddingX='16px' color='white' placeholder='Password' type='password' value={password} onChange={handlePasswordChange} autoCapitalize='none'>
    </Input>
    <Input w='100%' borderColor='#777' borderRadius='40px' marginY='8px'  paddingY='8px' paddingX='16px' color='white' placeholder='Confirm password' type='password' value={confirm} onChange={handleConfirmChange} autoCapitalize='none'>
    </Input>
    {error &&
        <Center>
            <Text color='red.500' textAlign='center' fontSize='xs'>{error}</Text>
        </Center>
    }
    <Button w='100%' borderRadius='40px' backgroundColor='#ddd' marginY='8px' paddingY='4px' paddingX='16px' color='#444' size='sm' onPress={handleSubmit}>
        <Text color='black' fontWeight='medium'>Submit</Text>
    </Button>
</VStack>
}
