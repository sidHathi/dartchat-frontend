import React, { useContext, useMemo, useState } from 'react';
import { Box, Text, Heading, HStack, VStack, Spacer, Center } from 'native-base';
import { KeyInfo } from '../../../types/types';
import { getDateTimeString } from '../../../utils/messagingUtils';
import { useAppSelector } from '../../../redux/hooks';
import { chatSelector } from '../../../redux/slices/chatSlice';
import colors from '../../colors';
import UIContext from '../../../contexts/UIContext';

export default function KeyInfoDisplay(): JSX.Element {
    const { currentConvo } = useAppSelector(chatSelector);
    const { theme } = useContext(UIContext);

    const keyInfo = useMemo(() => {
        return currentConvo?.keyInfo || {
            createdAt: new Date(),
            privilegedUsers: [],
            numberOfMessages: 0
        };
    }, [currentConvo]);

    return <Box w='100%' mx='auto' bgColor={colors.message[theme]} borderRadius='24px' p='24px'>
        <VStack space='3'>
        <Box>
            <Text fontSize='xs' color={colors.textLightNB[theme]}>
                Security status
            </Text>
            <Heading fontSize='md' color={colors.textMainNB[theme]}>
                Encrypted 
            </Heading>

            <Text fontSize='xs' my='6px' color={colors.textLightNB[theme]}>
            This chat is encrypted using a secret key cipher. Only users with the access to the key can read its messages.
            </Text>
        </Box>
        <Box>
        <Text fontSize='xs' color={colors.textLightNB[theme]}>
            Key creation date:
        </Text>
        <Heading fontSize='md' color={colors.textMainNB[theme]}>
            {getDateTimeString(keyInfo.createdAt)}
        </Heading>
        </Box>
        <Box>
        <Text fontSize='xs' color={colors.textLightNB[theme]}>
            Messages encrypted with this key
        </Text>
        <Heading fontSize='md' color={colors.textMainNB[theme]}>
            {`${keyInfo.numberOfMessages} messages`}
        </Heading>
        </Box>
        </VStack>
    </Box>;
}