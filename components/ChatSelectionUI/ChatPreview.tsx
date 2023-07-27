import React from 'react';
import { ConversationPreview } from '../../types/types';

import { Box, HStack, Spacer, Pressable, Center, Heading, Text, VStack } from 'native-base';
import { Image, Dimensions } from 'react-native';
import IconImage from '../generics/IconImage';
import MentionsTextDisplay from '../MessagingUI/Mentions/MentionsTextDisplay';
import { getTimeString } from '../../utils/messagingUtils';

export default function ChatPreview({
    chat,
    onSelect
}: {
    chat : ConversationPreview,
    onSelect : () => void
}) : JSX.Element {
    const screenWidth = Dimensions.get('window').width;
    const lastMessageTimeStr = getTimeString(chat.lastMessageTime);

    return <Pressable onPress={onSelect}>
        <Box p='18px' bgColor='#f5f5f5' borderRadius='24px' shadow='7' style={{shadowOpacity: 0.07}} mx='12px'>
            <HStack w='100%'>
                <Box bgColor='transparent' borderRadius='25px' shadow='7' mr='12px'>
                    {
                        chat.avatar ? 
                        <IconImage 
                            imageUri={chat.avatar.mainUri} 
                            size={50}
                            shadow='9' /> :
                        <Image 
                            source={require('../../assets/profile-01.png')}
                            style={{
                                width: 50,
                                height: 50,
                                shadowColor: "black",
                                borderRadius: 25
                            }} />
                    }
                </Box>
                <VStack h='100%'>
                    <Spacer />
                    <Heading fontSize='md'>
                        {chat.name}
                    </Heading>
                    <MentionsTextDisplay
                        message={{
                            content: chat.lastMessageContent || 'New conversation',
                        }}
                        color='gray.700' fontSize='xs'  maxWidth={`${screenWidth - 200}px`} noOfLines={2} />
                    {/* <Text color='gray.700' fontSize='xs'  maxWidth={`${screenWidth - 200}px`} noOfLines={2}>
                        {chat.lastMessageContent || 'New conversation'}
                    </Text> */}
                    <Spacer />
                </VStack>
                <Spacer />
                <VStack>
                    <Text color='gray.700' fontSize='xs'>
                        {lastMessageTimeStr}
                    </Text>
                    {chat.unSeenMessages > 0 &&
                    <HStack>
                        <Spacer />
                        <Box bgColor='black' borderRadius='10px' h='18px' px='5px' py='0px' my='2px'>
                            <Text fontSize='13px' color='white' mt='-1px' fontWeight='bold'>
                                {chat.unSeenMessages}
                            </Text>
                        </Box>
                    </HStack>
                    }
                    <Spacer />
                </VStack>
            </HStack>
        </Box>
    </Pressable>
}