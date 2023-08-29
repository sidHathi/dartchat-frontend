import React, { useContext, useMemo } from 'react';
import { ConversationPreview } from '../../types/types';

import { Box, HStack, Spacer, Pressable, Center, Heading, Text, VStack } from 'native-base';
import { Image, Dimensions } from 'react-native';
import IconImage from '../generics/IconImage';
import MentionsTextDisplay from '../MessagingUI/Mentions/MentionsTextDisplay';
import { getTimeString, handlePossiblyEncryptedMessage } from '../../utils/messagingUtils';
import UserSecretsContext from '../../contexts/UserSecretsContext';
import { decryptJSON } from '../../utils/encryptionUtils';

export default function ChatPreview({
    chat,
    onSelect
}: {
    chat : ConversationPreview,
    onSelect : () => void
}) : JSX.Element {
    const screenWidth = Dimensions.get('window').width;

    const { secrets } = useContext(UserSecretsContext);
    const lastMessageTimeStr = getTimeString(chat.lastMessageTime);

    const safeLastMessageContent = useMemo(() => {
        const secretKey = secrets ? secrets[chat.cid] : undefined;
        if (chat.lastMessage) {
            const safeMessage = handlePossiblyEncryptedMessage(chat.lastMessage, secretKey);
            if (safeMessage) {
                const content = safeMessage.content;
                if ((!content || content.length < 1) && safeMessage.media) {
                    return 'Media:';
                }  else if ((!content || content.length < 1)) {
                    return 'New conversation';
                }
                return content;
            }
        } 
        return 'New conversation';
    }, [chat, secrets]);

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
                    <Heading fontSize='md' mb='2px'>
                        {chat.name}
                    </Heading>
                    <MentionsTextDisplay
                        message={{
                            content: safeLastMessageContent,
                        }}
                        color='gray.700' fontSize='sm' maxWidth={`${screenWidth - 200}px`} noOfLines={2} />
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