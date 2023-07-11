import React, { useState, useContext, useCallback } from "react";
import { Box, Input, HStack } from 'native-base';
import IconButton from "../generics/IconButton";
import { Dimensions } from "react-native";
import { Message, MessageMedia, MessageMediaBuffer, ReplyRef } from '../../types/types';
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import uuid from 'react-native-uuid';
import SocketContext from "../../contexts/SocketContext";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { chatSelector, sendNewMessage } from "../../redux/slices/chatSlice";
import { handleNewMessage } from "../../redux/slices/userConversationsSlice";
import NetworkContext from "../../contexts/NetworkContext";
import { useKeyboard } from "@react-native-community/hooks";
import MediaBufferDisplay from "./MessageMediaControllers/MediaBufferDisplay";
import { getDownloadUrl, storeMessagingImage } from "../../firebase/cloudStore";
import Spinner from "react-native-spinkit";

export default function MessageEntry({
    replyMessage, 
    onSend, 
    openContentMenu,
    selectedMediaBuffer,
    setSelectedMediaBuffer
}: {
    replyMessage?: Message,
    onSend?: () => void,
    openContentMenu?: () => void,
    selectedMediaBuffer?: MessageMediaBuffer[],
    setSelectedMediaBuffer: (mediaBuffer: MessageMediaBuffer[] | undefined) => void,
}): JSX.Element {
    const screenWidth = Dimensions.get('window').width;
    const dispatch = useAppDispatch();
    const { keyboardShown, keyboardHeight } = useKeyboard();

    const { user } = useContext(AuthIdentityContext);
    const { socket, disconnected: socketDisconnected } = useContext(SocketContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { networkConnected } = useContext(NetworkContext);

    const [messageText, setMessageText] = useState<string | undefined>(undefined);
    const [mediaProgress, setMediaProgress] = useState<{[id: string]: number}>({});
    const [mediaLoading, setMediaLoading] = useState(false);

    const getMediaFromBuffer = useCallback(async (): Promise<MessageMedia[] | undefined> => {
        if (!selectedMediaBuffer) return;
        
        setMediaLoading(true);
        const messageMedia = await Promise.all(selectedMediaBuffer.map(async (mediaBuffer) => {
            if (!mediaBuffer.fileUri) return null;
            const res = storeMessagingImage(mediaBuffer.fileUri, mediaBuffer.id);
            if (res) {
                const { task, loc } = res;
                task.on('state_changed', (taskSnapshot) => {
                    setMediaProgress({
                        ...mediaProgress,
                        [mediaBuffer.id]: (taskSnapshot.bytesTransferred/taskSnapshot.totalBytes)
                    })
                    console.log(mediaProgress)
                });
                return task.then(async (): Promise<MessageMedia> => {
                    const downloadUri = await getDownloadUrl(loc);
                    setMediaProgress(Object.fromEntries(Object.entries(mediaProgress).filter(([key, ]) => key !== mediaBuffer.id)));
                    return {
                        id: mediaBuffer.id,
                        type: mediaBuffer.type,
                        uri: downloadUri,
                        width: mediaBuffer.width,
                        height: mediaBuffer.height
                    } as MessageMedia;
                }).catch(err => {
                    console.log(err);
                    return null;
                });
            }
            return null;
        }));
        return messageMedia.filter(m => m != null) as MessageMedia[];
    }, [mediaProgress, selectedMediaBuffer]);

    const handleMessageSend = useCallback(async () => {
        console.log('button pressed')
        if (!user || (!messageText && !selectedMediaBuffer) || !networkConnected || socketDisconnected) {
            console.log('unable to send');
            return;
        }
        let messageMedia: MessageMedia[] | undefined = undefined
        if (selectedMediaBuffer) {
            messageMedia = await getMediaFromBuffer();
            setMediaLoading(false);
            setSelectedMediaBuffer(undefined);
        } 
        const id = uuid.v4();
        let replyRef: ReplyRef | undefined = undefined;
        if (replyMessage) {
            replyRef = {
                id: replyMessage.id,
                content: replyMessage.content,
                senderId: replyMessage.senderId,
                media: replyMessage.media !== undefined
            }
        }
        const message: Message = {
            id: id.toString(),
            content: messageText || "",
            timestamp: new Date(),
            senderId: user.id,
            likes: [],
            replyRef,
            media: messageMedia
        }
        if (socket && currentConvo) {
            console.log('sending message')
            dispatch(sendNewMessage({socket, message}));
            dispatch(handleNewMessage({cid: currentConvo.id, message: message, messageForCurrent: true}));
            setMessageText(undefined);
            onSend && onSend();
        } else {
            console.log(socketDisconnected);
            console.log(socket);
            console.log(currentConvo);
        }
        return;
    }, [selectedMediaBuffer, messageText, user, networkConnected]);

    return <Box w='100%' paddingBottom={keyboardShown ? `${keyboardHeight + 24}px` : '36px'} paddingTop='12px' borderTopRadius={replyMessage ? '0' : '24px'} backgroundColor='white' paddingX='12px' shadow={replyMessage ? '0': '9'} overflow='visible'>
        {
            selectedMediaBuffer &&
            <MediaBufferDisplay
                mediaBuffer={selectedMediaBuffer}
                setMediaBuffer={setSelectedMediaBuffer}
                progressMap={mediaProgress}
                />
        }
        <HStack w='100%' space='1'>
            <IconButton label='plus' size={32} shadow='none' color='black' onPress={openContentMenu} additionalProps={{mt: '3px'}}/>
            <Input
                placeholder='Message'
                value={messageText}
                onChangeText={setMessageText}
                flex='1'
                h='40px'
                borderRadius='20px'
                paddingX='20px'
                backgroundColor='#f5f5f5'
                isDisabled={!networkConnected || socketDisconnected}
            />
            {
                mediaLoading ? 
                <Spinner type='CircleFlip' color="#333" size={40} /> :
                <IconButton label='send' size={40} onPress={handleMessageSend} color="black" shadow="2" disabled={(!networkConnected || socketDisconnected)} />
            }
        </HStack>
    </Box>;
}