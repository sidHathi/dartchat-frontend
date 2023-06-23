import React from 'react';
import { Message, UserConversationProfile } from '../../types/types';

import {View, Box, HStack, VStack, Text, Spacer, Pressable} from 'native-base';
import IconButton from '../generics/IconButton';

export default function ReplyMessageDisplay({
    participants, message, handleDeselect
} : {
    participants: {[key: string]: UserConversationProfile}
    message: Message,
    handleDeselect: () => void
}): JSX.Element {
    return <View w='100%' marginBottom='-4px'>
        <VStack w='100%'>
            <Box shadow='9' w='100%' borderBottomColor='gray.300' borderTopRadius='24px' borderBottomWidth='1px' backgroundColor='white' paddingY='12px'>
                <HStack space={1} w='100%' paddingX='18px'>
                    <IconButton label='profile' size={28} additionalProps={{paddingTop: '6px', marginRight: '4px'}}/>
                    <Box paddingX='18px' paddingY='4px' borderRadius='12px' backgroundColor='#f7f7f7' margin='0px' maxWidth='80%'>
                        <VStack>
                            <Text color='coolGray.600' fontSize='10px'>{participants[message.senderId].displayName}</Text>
                            <Text fontSize='sm'>{message.content}</Text>
                        </VStack>
                    </Box>
                    <Spacer />
                    <IconButton label='cancel' size={24} shadow={'0'} color='gray' additionalProps={{paddingTop: '10px'}}
                    onPress={handleDeselect} />
                </HStack>
            </Box>
        </VStack>
    </View>
}