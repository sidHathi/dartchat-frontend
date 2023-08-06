import React, { useState, useMemo, useCallback } from 'react';
import { View, Box, Input, Heading, Text, VStack, Button, Center } from 'native-base';
import Spinner from 'react-native-spinkit';

type PinEntryVariant = 'initialization' | 'confirmation';

export default function UserPinEntry({
    variant,
    onSubmit,
    validationLoading
}: {
    variant: PinEntryVariant;
    onSubmit: (pin: string) => void;
    validationLoading: boolean;
}): JSX.Element {
    const [enteredPin, setEnteredPin] = useState<string | undefined>();
    const [confirmPin, setConfirmPin] = useState<string | undefined>();
    const [error, setError] = useState<string | undefined>();

    const onPinTextChange = (newPin: string) => {
        if (newPin.length > 0 && !/^\d+/.test(newPin)) return;
        setEnteredPin(newPin);
    }

    const headingText = useMemo(() => {
        switch (variant) {
            case 'initialization':
                return 'Select a 6-digit PIN';
            case 'confirmation':
                return 'Enter your PIN';
            default:
                return '';
        }
    }, [variant]);

    const bodyText = useMemo(() => {
        switch (variant) {
            case 'initialization':
                return 'Your PIN will be used to securely encrypt your messages. If you log out or switch devices, you will need it to read any of your encrypted conversations.';
            case 'confirmation':
                return 'This is required to read your encrypted messages.';
            default:
                return '';
        }
    }, [variant]);

    const handleSubmit = useCallback(() => {
        if (variant ==='initialization' && enteredPin !== confirmPin) {
            setError('PINs do not match');
            return;
        } else if (!enteredPin || enteredPin.length < 6) {
            setError('PIN must be at least 6 digits long');
            return;
        }
        onSubmit(enteredPin);
    }, [enteredPin, confirmPin]);

    return <View flex='1' bgColor='#fefefe'>
        <Box w='90%' m='auto' p='24px' bgColor='#f5f5f5' shadow='9' borderRadius='24px'>
            <VStack space='2'>
            <Heading mt='12px'>
                {headingText}
            </Heading>
            <Text fontSize='sm' color='gray.500'>
                {bodyText}
            </Text>
            
            <Input
                placeholder='Enter a 6-digit PIN'
                value={enteredPin}
                onChangeText={onPinTextChange}
                w='100%'
                // borderRadius='20px'
                paddingX='20px'
                py='24px'
                marginRight='8px'
                // backgroundColor='#f1f1f1'
                isRequired
                variant="underlined"
                keyboardType='numeric'
                maxLength={6}
                type='password'
                fontSize='xl'
                fontWeight='bold'
                />

            {
                variant === 'initialization' &&
                <Input
                    placeholder='Confirm your PIN'
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    w='100%'
                    // borderRadius='20px'
                    paddingX='20px'
                    py='24px'
                    marginRight='8px'
                    // backgroundColor='#f1f1f1'
                    isRequired
                    variant="underlined"
                    keyboardType='numeric'
                    maxLength={6}
                    type='password'
                    fontSize='xl'
                    fontWeight='bold'
                    mb='24px'
                    />
            }

            {
                error &&
                <Text color='red.500' fontSize='xs' mx='auto' mb='6px'>
                    {error}
                </Text>
            }

            {
                validationLoading &&
                <Center w='100%'>
                    <Spinner type='ThreeBounce' />
                </Center>
            }

            <Button colorScheme='dark' variant='subtle' borderRadius='24px' w='100%' onPress={handleSubmit} mb='12px'>
                Submit
            </Button>
            </VStack>
        </Box>
    </View>;
}
