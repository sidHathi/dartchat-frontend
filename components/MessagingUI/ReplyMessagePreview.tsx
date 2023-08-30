import React from 'react';
import { DecryptedMessage, Message, UserConversationProfile } from '../../types/types';

import {View, Box, HStack, VStack, Text, Spacer, Pressable} from 'native-base';
import IconButton from '../generics/IconButton';
import IconImage from '../generics/IconImage';
import { FontAwesome5 } from '@expo/vector-icons';
import MentionsTextDisplay from './Mentions/MentionsTextDisplay';

export default function ReplyMessagePreview({
    participants, message, handleDeselect
} : {
    participants: {[key: string]: UserConversationProfile}
    message: DecryptedMessage,
    handleDeselect: () => void
}): JSX.Element {
    return <View w='100%' marginBottom='-4px'>
        <VStack w='100%'>
            <Box shadow='9' w='100%' borderBottomColor='gray.300' borderTopRadius='24px' borderBottomWidth='1px' backgroundColor='white' paddingY='12px'>
                <HStack space={1} w='100%' paddingX='18px'>
                    {
                        message.senderId in participants && participants[message.senderId].avatar ? 
                        <IconImage imageUri={participants[message.senderId].avatar?.tinyUri || ''} size={28} nbProps={{mt: '6px', mr: '4px'}} shadow='9' /> : 
                        <IconButton label='profile' shadow='9' size={28} additionalProps={{paddingTop: '6px', marginRight: '4px'}}/>  
                    }
                    <Box paddingX='18px' paddingY='4px' borderRadius='12px' backgroundColor='#f7f7f7' margin='0px' maxWidth='80%'>
                        <VStack>
                            <Text color='coolGray.600' fontSize='10px'>{participants[message.senderId].displayName}</Text>
                            {
                                message.media &&
                                <HStack space={2} mt='4px'>
                                    <FontAwesome5 name="images" size={24} color="gray" />
                                    <Text color='coolGray.600' fontSize='xs' mt='2px' fontWeight='medium'>
                                        Media
                                    </Text>
                                </HStack>
                            }
                            <MentionsTextDisplay fontSize='sm' message={message} />
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