import React, { useState, useMemo, useCallback, useContext } from 'react';
import { View, Box, Input, Heading, Text, VStack, Button, Center } from 'native-base';
import Spinner from 'react-native-spinkit';
import { useKeyboard } from '@react-native-community/hooks';
import AuthIdentityContext from '../../contexts/AuthIdentityContext';
import colors from '../colors';
import UIContext from '../../contexts/UIContext';

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
    const { logOut } = useContext(AuthIdentityContext);
    const { keyboardShown } = useKeyboard();

    const [enteredPin, setEnteredPin] = useState<string | undefined>();
    const [confirmPin, setConfirmPin] = useState<string | undefined>();
    const [error, setError] = useState<string | undefined>();

    const { theme } = useContext(UIContext);

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
        if (variant === 'initialization' && enteredPin !== confirmPin) {
            setError('PINs do not match');
            return;
        } else if (!enteredPin || enteredPin.length < 6) {
            setError('PIN must be at least 6 digits long');
            return;
        }
        onSubmit(enteredPin);
    }, [enteredPin, confirmPin]);

    return <View flex='1' bgColor={colors.bgBase[theme]}>
        <Box w='90%' m='auto' p='24px' bgColor={colors.card[theme]} shadow='9' borderRadius='24px' mt={keyboardShown ? '60px' : 'auto'}>
            <VStack space='2'>
            <Heading mt='12px' color={colors.textMainNB[theme]}>
                {headingText}
            </Heading>
            <Text fontSize='sm' color={colors.textLightNB[theme]}>
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
                color={colors.textMainNB[theme]}
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
                    color={colors.textMainNB[theme]}
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

            <Button colorScheme='dark' variant='subtle' borderRadius='24px' w='100%' onPress={handleSubmit} mb='6px'>
                Submit
            </Button>
            <Button colorScheme='light' variant='ghost' borderRadius='24px' w='100%' onPress={() => logOut()} mb='12px'>
                Cancel
            </Button>
            </VStack>
        </Box>
    </View>;
}
