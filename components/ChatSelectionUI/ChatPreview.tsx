import React, { useContext, useEffect, useMemo } from 'react';
import { ConversationPreview } from '../../types/types';

import { Box, HStack, Spacer, Pressable, Center, Heading, Text, VStack } from 'native-base';
import { Image, Dimensions } from 'react-native';
import IconImage from '../generics/IconImage';
import MentionsTextDisplay from '../MessagingUI/Mentions/MentionsTextDisplay';
import { getTimeGapForConversationPreview, getTimeString, handlePossiblyEncryptedMessage } from '../../utils/messagingUtils';
import UserSecretsContext from '../../contexts/UserSecretsContext';
import { decryptJSON } from '../../utils/encryptionUtils';
import { TouchableOpacity } from 'react-native-gesture-handler';
import colors from '../colors';
import UIContext from '../../contexts/UIContext';

export default function ChatPreview({
    chat,
    onSelect
}: {
    chat : ConversationPreview,
    onSelect : () => void
}) : JSX.Element {
    const screenWidth = Dimensions.get('window').width;
    const { theme } = useContext(UIContext);
    const { secrets, pullUserSecrets } = useContext(UserSecretsContext);
    const lastMessageTimeStr = getTimeGapForConversationPreview(chat.lastMessageTime);

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

    return <TouchableOpacity onPress={onSelect}>
        <Box p='18px' bgColor={colors.card[theme]} borderRadius='24px' shadow='9' style={{shadowOpacity: 0.06}} mx='12px'>
            <HStack w='100%'>
                <Box bgColor='transparent' borderRadius='25px' shadow='7' mr='12px'>
                    {
                        chat.avatar ? 
                        <IconImage 
                            imageUri={chat.avatar.mainUri} 
                            // UI is all multiples of 3
                            size={51}
                            shadow='9'
                            nbProps={{
                                style: {
                                    shadowOpacity: 0.12
                                },
                                my: 'auto'
                            }}
                            /> :
                        <Image 
                            source={require('../../assets/profile-01.png')}
                            style={{
                                width: 51,
                                height: 51,
                                shadowColor: "black",
                                borderRadius: 25,
                                marginVertical: "auto"
                            }} />
                    }
                </Box>
                <VStack h='100%'>
                    <Spacer />
                    <Heading fontSize='sm' mb='2px' fontWeight='bold' color={colors.textMainNB[theme]}>
                        {chat.name}
                    </Heading>
                    <MentionsTextDisplay
                        message={{
                            content: safeLastMessageContent,
                        }}
                        color={colors.subTextNB[theme]} fontSize='sm' maxWidth={`${screenWidth - 200}px`} noOfLines={2} />
                    {/* <Text color='gray.700' fontSize='xs'  maxWidth={`${screenWidth - 200}px`} noOfLines={2}>
                        {chat.lastMessageContent || 'New conversation'}
                    </Text> */}
                    <Spacer />
                </VStack>
                <Spacer />
                <VStack>
                    <Text color={colors.subTextNB[theme]} fontSize='xs'>
                        {lastMessageTimeStr}
                    </Text>
                    {chat.unSeenMessages > 0 &&
                    <HStack>
                        <Spacer />
                        <Box bgColor={colors.textMainNB[theme]} borderRadius='10px' h='18px' px='5px' py='0px' my='2px'>
                            <Text fontSize='13px' color={colors.invertedText[theme]} mt='-1px' fontWeight='bold'>
                                {chat.unSeenMessages}
                            </Text>
                        </Box>
                    </HStack>
                    }
                    <Spacer />
                </VStack>
            </HStack>
        </Box>
    </TouchableOpacity>
}