import React, { useContext, useEffect, useState } from 'react';
import { DecryptedMessage, ReplyRef } from '../../types/types';
import { Message } from 'reconnecting-websocket';
import { useAppSelector } from '../../redux/hooks';
import { chatSelector } from '../../redux/slices/chatSlice';
import useRequest from '../../requests/useRequest';
import UserSecretsContext from '../../contexts/UserSecretsContext';
import { handlePossiblyEncryptedMessage } from '../../utils/messagingUtils';
import { Pressable, HStack, Box, Text, VStack, Spacer } from 'native-base';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import MessageTextDisplay from "./Mentions/MentionsTextDisplay";

export default function ReplyMessageDisplay({
    replyRef,
    handleReplySelect
}: {
    replyRef: ReplyRef;
    handleReplySelect?: () => void;
}) {
    const { currentConvo } = useAppSelector(chatSelector);
    const { secrets } = useContext(UserSecretsContext);
    const { conversationsApi } = useRequest();

    const [pulledMessage, setPulledMessage] = useState<DecryptedMessage | undefined>();

    useEffect(() => {
        if (pulledMessage || !currentConvo) return;

        const getMessage = async () => {
            const messageRes = await conversationsApi.getMessage(currentConvo.id, replyRef.id);
            const convoSecretKey = secrets ? secrets[currentConvo.id] : undefined;
            const decryptedMessageRes = handlePossiblyEncryptedMessage(messageRes, convoSecretKey);
            setPulledMessage(decryptedMessageRes);
        }
        getMessage();
    }, [pulledMessage, replyRef]);

    return (pulledMessage ? <Pressable onPress={handleReplySelect} paddingLeft='12px'
            maxWidth='100%'>
        <HStack maxWidth='100%'>
        <Box paddingTop='12px' paddingX='6px' opacity='0.8'>
            <FontAwesome name="arrows-v" size={20} color="gray" />
        </Box>
        <Box paddingX='15px' paddingY='4px' borderRadius='12px' backgroundColor='#f7f7f7' marginBottom='3px' opacity='0.7'
        mr='24px'>
            <VStack>
                {
                    (pulledMessage && pulledMessage.messageType !== 'system') &&
                    <Text color='coolGray.600' fontSize='9px'>{pulledMessage.senderProfile?.displayName || ''}</Text>
                }
                {
                    (pulledMessage?.media || pulledMessage?.objectRef) &&
                    <HStack space={2} mt='4px'>
                        <FontAwesome5 name="images" size={24} color="gray" />
                        <Text color='trueGray.600' fontSize='xs' mt='6px' fontWeight='bold'>
                            Media
                        </Text>
                    </HStack>
                }
                {(pulledMessage && pulledMessage.content) &&
                <MessageTextDisplay message={pulledMessage} fontSize='xs' noOfLines={1} isTruncated />
                }
            </VStack>
        </Box>
        <Spacer />
        </HStack>
        <Text pl='40px' fontSize='xs' lineHeight='4px' fontWeight='bold' pb='2px' color='coolGray.400'>. . .</Text>
    </Pressable> : <></>)
}