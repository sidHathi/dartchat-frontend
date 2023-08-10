import React, { useMemo, useState } from 'react';
import { Box, Text, Heading, HStack, VStack, Spacer, Center } from 'native-base';
import { KeyInfo } from '../../../types/types';
import { getDateTimeString } from '../../../utils/messagingUtils';
import { useAppSelector } from '../../../redux/hooks';
import { chatSelector } from '../../../redux/slices/chatSlice';

export default function KeyInfoDisplay(): JSX.Element {
    const { currentConvo } = useAppSelector(chatSelector);

    const keyInfo = useMemo(() => {
        return currentConvo?.keyInfo || {
            createdAt: new Date(),
            privilegedUsers: [],
            numberOfMessages: 0
        };
    }, [currentConvo]);

    return <Box w='100%' mx='auto' bgColor='#f5f5f5' borderRadius='24px' p='24px'>
        <VStack space='3'>
        <Box>
            <Text fontSize='xs' color='gray.500'>
                Security status
            </Text>
            <Heading fontSize='lg'>
                Encrypted 
            </Heading>

            <Text color='gray.500' fontSize='xs' my='6px'>
            This chat is encrypted using a secret key cipher. Only users with the access to the key can read its messages.
            </Text>
        </Box>
        <Box>
        <Text fontSize='xs' color='gray.500'>
            Key creation date:
        </Text>
        <Heading fontSize='lg'>
            {getDateTimeString(keyInfo.createdAt)}
        </Heading>
        </Box>
        <Box>
        <Text fontSize='xs' color='gray.500'>
            Users with access to the key:
        </Text>
        <Heading fontSize='lg'>
            {`${keyInfo.privilegedUsers.length} users`}
        </Heading>
        </Box>
        <Box>
        <Text fontSize='xs' color='gray.500'>
            Messages encrypted with this key
        </Text>
        <Heading fontSize='lg'>
            {`${keyInfo.numberOfMessages} messages`}
        </Heading>
        </Box>
        </VStack>
    </Box>;
}