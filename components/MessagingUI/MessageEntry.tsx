import React, { useState, useContext } from "react";
import { Box, Input, HStack } from 'native-base';
import IconButton from "../generics/IconButton";
import { Dimensions } from "react-native";
import { Message, ReplyRef } from '../../types/types';
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import uuid from 'react-native-uuid';
import SocketContext from "../../contexts/SocketContext";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { chatSelector, sendNewMessage } from "../../redux/slices/chatSlice";
import { handleNewMessage } from "../../redux/slices/userConversationsSlice";

export default function MessageEntry({replyMessage, onSend}: {
    replyMessage?: Message,
    onSend?: () => void,
}): JSX.Element {
    const screenWidth = Dimensions.get('window').width;
    const dispatch = useAppDispatch();

    const { user } = useContext(AuthIdentityContext);
    const { socket } = useContext(SocketContext);
    const { currentConvo } = useAppSelector(chatSelector);

    const [messageText, setMessageText] = useState<string | undefined>(undefined);

    const handleMessageSend = () => {
        if (!user || !messageText) return;
        const id = uuid.v4();
        let replyRef: ReplyRef | undefined = undefined;
        if (replyMessage) {
            replyRef = {
                id: replyMessage.id,
                content: replyMessage.content,
                senderId: replyMessage.senderId
            }
        }
        const message: Message = {
            id: id.toString(),
            content: messageText || "",
            timestamp: new Date(),
            senderId: user.id,
            likes: [],
            replyRef
        }
        if (socket && currentConvo) {
            dispatch(sendNewMessage({socket, message}));
            dispatch(handleNewMessage({cid: currentConvo.id, message: message, messageForCurrent: true}));
            setMessageText(undefined);
            onSend && onSend();
        }
        return;
    }

    return <Box w='100%' paddingBottom='36px' paddingTop='12px' borderTopRadius={replyMessage ? '0' : '24px'} backgroundColor='white' paddingX='24px' shadow={replyMessage ? '0': '9'}>
        <HStack>
            <Input
                placeholder='Message'
                value={messageText}
                onChangeText={setMessageText}
                w={`${screenWidth - 100} px`}
                h='40px'
                borderRadius='20px'
                paddingX='20px'
                marginRight='8px'
                backgroundColor='#f5f5f5'
            />
            <IconButton label='send' size={42} onPress={handleMessageSend} color="black" shadow="2"/>
        </HStack>
    </Box>;
}