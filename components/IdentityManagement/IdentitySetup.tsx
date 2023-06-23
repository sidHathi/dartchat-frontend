import React, { useState, useContext } from 'react';

import { View, Box, VStack, Button, Input, Heading, Text, Center, FormControl} from 'native-base';
import DartChatLogoDarkXML from '../../assets/DartChatLogoDarkXML';
import { SvgXml } from "react-native-svg";
import { AuthIdentityContext } from '../AuthIdentityContainer';

export default function IdentitySetup(): JSX.Element {
    const { user, modifyUser } = useContext(AuthIdentityContext);

    const [handle, setHandle] = useState<string | undefined>(undefined);
    const [secureKey, setSecureKey] = useState<string | undefined>(undefined);
    const [confirmKey, setConfirmKey] = useState<string | undefined>(undefined);
    const [displayName, setDisplayName] = useState<string | undefined>(undefined);
    const [phone, setPhone] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);

    const handleSubmit = () => {
        if (!user) return;
        if (!secureKey || secureKey.length < 6) {
            setError('Secure key must be 6 digits long');
            return;
        } else if (secureKey !== confirmKey) {
            setError('Encryption keys do not match');
            return;
        }
        modifyUser({
            ...user,
            handle,
            secureKey,
            displayName,
            phone,
        });
    }

    return <View w='100%' h='100%' backgroundColor='#fefefe'>
        <Center w='100%' h='100%'>
            <Box w='90%' p='20px' bgColor='gray.100' shadow='9' borderRadius='24px'>
                <Center w='100%'>
                    <SvgXml xml={DartChatLogoDarkXML} height='20' width='120'/>
                </Center>

                <Heading size='md' my='12px'>
                    Setup
                </Heading>

                <FormControl>
                <VStack space={1}>
                    <Box>
                    <Text fontSize='xs' color='coolGray.600'>
                        Choose a unique identification handle
                        <Text fontWeight='bold'> *</Text>
                    </Text>
                    <Input
                        placeholder='Eg. johnDoe123'
                        value={handle}
                        onChangeText={setHandle}
                        w='100%'
                        h='40px'
                        // borderRadius='20px'
                        paddingX='20px'
                        marginRight='8px'
                        // backgroundColor='#f1f1f1'
                        isRequired
                        variant="underlined"
                        autoCapitalize='none'
                    />
                    </Box>

                    <Box>
                    <Text fontSize='xs' color='coolGray.600'>
                        Choose a 6-digit encryption key
                        <Text fontWeight='bold'> *</Text>
                    </Text>
                    <Input
                        placeholder='123456'
                        value={secureKey}
                        onChangeText={setSecureKey}
                        w='100%'
                        h='40px'
                        // borderRadius='20px'
                        paddingX='20px'
                        marginRight='8px'
                        // backgroundColor='#f1f1f1'
                        isRequired
                        variant="underlined"
                        keyboardType='numeric'
                        maxLength={6}
                        type='password'
                    />
                    </Box>

                    <Box>
                    <Text fontSize='xs' color='coolGray.600'>
                        Confirm encryption key
                        <Text fontWeight='bold'> *</Text>
                    </Text>
                    <Input
                        placeholder='123456'
                        value={confirmKey}
                        onChangeText={setConfirmKey}
                        w='100%'
                        h='40px'
                        // borderRadius='20px'
                        paddingX='20px'
                        marginRight='8px'
                        // backgroundColor='#f1f1f1'
                        isRequired
                        variant="underlined"
                        keyboardType='numeric'
                        maxLength={6}
                        type='password'
                    />
                    </Box>

                    <Box>
                    <Text fontSize='xs' color='coolGray.600'>
                       {'Name (optional)'}
                    </Text>
                    <Input
                        placeholder='First Last'
                        value={displayName}
                        onChangeText={setDisplayName}
                        w='100%'
                        h='40px'
                        // borderRadius='20px'
                        paddingX='20px'
                        marginRight='8px'
                        // backgroundColor='#f1f1f1'
                        isRequired
                        variant="underlined"
                        keyboardType='numeric'
                        maxLength={6}
                    />
                    </Box>

                    <Box>
                    <Text fontSize='xs' color='coolGray.600'>
                       {'Phone Number (optional)'}
                    </Text>
                    <Input
                        placeholder='+123456789'
                        value={phone}
                        onChangeText={setPhone}
                        w='100%'
                        h='40px'
                        // borderRadius='20px'
                        paddingX='20px'
                        marginRight='8px'
                        // backgroundColor='#f1f1f1'
                        isRequired
                        variant="underlined"
                        keyboardType='numeric'
                        maxLength={6}
                    />
                    </Box>
                </VStack>
                </FormControl>
                <Button w='100%' colorScheme='coolGray' borderRadius='30px' onPress={handleSubmit} variant='solid' color='white' marginY='12px' disabled={!handle || !secureKey}
                opacity={(!handle || !secureKey) ? 0.5 : 1}>
                    Continue
                </Button>
                {error &&
                <Center w='100%'>
                    <Text fontSize='xs' color='red.500'>
                        {error}
                    </Text>
                </Center>
                }
            </Box>
        </Center>
    </View>
}