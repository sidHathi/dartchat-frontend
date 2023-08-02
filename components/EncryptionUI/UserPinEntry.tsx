import React, { useState, useMemo } from 'react';
import { View, Box, Input, Heading, Text, VStack } from 'native-base';

type PinEntryVariant = 'initialization' | 'confirmation';

export default function UserPinEntry({
    variant,
    onSubmit,
}: {
    variant: PinEntryVariant;
    onSubmit: () => void;
}): JSX.Element {
    const [enteredPin, setEnteredPin] = useState<string | undefined>();

    const onPinTextChange = (newPin: string) => {
        if (!/^\d+/.test(newPin)) return;
        setEnteredPin(newPin);
    }

    const headingText = useMemo(() => {
        switch (variant) {
            case 'initialization':
                return 'Select a 6-digit PIN';
            case 'confirmation':
                return 'enter your PIN';
            default:
                return '';
        }
    }, [variant]);

    const bodyText = useMemo(() => {
        switch (variant) {
            case 'initialization':
                return 'This PIN will be used to securely encrypt your messages. If you log out, or switch devices you will need it to read any of your encrypted conversations.';
            case 'confirmation':
                return 'This is required to read your encrypted messages.';
            default:
                return '';
        }
    }, [variant]);

    return <View flex='1'>
        <Box w='90%' m='auto' p='24px' bgColor='#f5f5f5' shadow='9'>
            <VStack space='2'>
            <Heading>
                {headingText}
            </Heading>
            <Text fontSize='sm' color='gray.500'>
                {bodyText}
            </Text>
            
            <Input
                placeholder='123456'
                value={enteredPin}
                onChangeText={onPinTextChange}
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
                fontSize='xl'
                />
            </VStack>
        </Box>
    </View>;
}
