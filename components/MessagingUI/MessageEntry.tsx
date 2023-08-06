import React, { useState, useContext, useCallback, useMemo } from "react";
import { Box, HStack, VStack, Spacer} from 'native-base';
import IconButton from "../generics/IconButton";
import { Dimensions } from "react-native";
import { DecryptedMessage, Message, MessageMedia, MessageMediaBuffer, ReplyRef, UserConversationProfile } from '../../types/types';
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import uuid from 'react-native-uuid';
import SocketContext from "../../contexts/SocketContext";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { chatSelector, sendNewMessage } from "../../redux/slices/chatSlice";
import { handleNewMessage } from "../../redux/slices/userDataSlice";
import NetworkContext from "../../contexts/NetworkContext";
import { useKeyboard } from "@react-native-community/hooks";
import MediaBufferDisplay from "./MessageMediaControllers/MediaBufferDisplay";
import { getDownloadUrl, storeMessagingImage } from "../../firebase/cloudStore";
import Spinner from "react-native-spinkit";
import MentionsInput from "./Mentions/MentionsInput";
import { encryptMessageForConvo, getMentionsFromMessage } from "../../utils/messagingUtils";
import PollBuilder from "../Polls/PollBuilder";
import EventBuilder from "../EventsUI/EventBuilder";
import UserSecretsContext from "../../contexts/UserSecretsContext";

export default function MessageEntry({
    replyMessage, 
    onSend, 
    openContentMenu,
    selectedMediaBuffer,
    setSelectedMediaBuffer,
    pollBuilderOpen,
    setPollBuilderOpen,
    eventBuilderOpen,
    setEventBuilderOpen,
}: {
    replyMessage?: DecryptedMessage,
    onSend?: () => void,
    openContentMenu?: () => void,
    selectedMediaBuffer?: MessageMediaBuffer[],
    setSelectedMediaBuffer: (mediaBuffer: MessageMediaBuffer[] | undefined) => void,
    pollBuilderOpen: boolean,
    setPollBuilderOpen: (newVal: boolean) => void,
    eventBuilderOpen: boolean,
    setEventBuilderOpen: (newVal: boolean) => void,
}): JSX.Element {
    const screenWidth = Dimensions.get('window').width;
    const dispatch = useAppDispatch();
    const { keyboardShown, keyboardHeight } = useKeyboard();

    const { user } = useContext(AuthIdentityContext);
    const { socket, disconnected: socketDisconnected, resetSocket } = useContext(SocketContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { networkConnected } = useContext(NetworkContext);
    const { secrets } = useContext(UserSecretsContext);

    const [messageText, setMessageText] = useState<string | undefined>(undefined);
    const [mediaProgress, setMediaProgress] = useState<{[id: string]: number}>({});
    const [mediaLoading, setMediaLoading] = useState(false);
    const [socketReconnectSent, setSocketReconnectSent] = useState(false);

    // Need better way to render mentions inline as the user is typing -> version of MessageText for input??

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
                    // console.log(mediaProgress)
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

    const userProfile = useMemo(() => {
        if (!user || !currentConvo) return undefined;
        const matches = currentConvo.participants.filter((p) => p.id === user.id);
        if (matches.length > 0) return matches[0];
        return undefined;
    }, [user, currentConvo])

    const handleMessageSend = useCallback(async () => {
        // console.log('button pressed');
        setPollBuilderOpen(false);
        setEventBuilderOpen(false);
        await checkSocketReconnect();
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
                media: replyMessage.media !== undefined,
            }
        }
        const mentions = currentConvo && messageText ? getMentionsFromMessage(messageText, currentConvo.participants) : undefined;
        const message: DecryptedMessage = {
            id: id.toString(),
            content: messageText || "",
            timestamp: new Date(),
            senderId: user.id,
            likes: [],
            replyRef,
            media: messageMedia,
            senderProfile: userProfile,
            mentions: mentions,
            delivered: false,
            messageType: 'user',
            encryptionLevel: 'none'
        }
        if (socket && currentConvo) {
            console.log('sending message');
            const userSecretKey = secrets ? secrets.userSecretKey : undefined;
            const encryptedMessage = encryptMessageForConvo(message, currentConvo, userSecretKey);
            dispatch(sendNewMessage({socket, message: encryptedMessage}));
            dispatch(handleNewMessage({cid: currentConvo.id, message: encryptedMessage, messageForCurrent: true}));
            setMessageText(undefined);
            onSend && onSend();
        } else {
            console.log(socketDisconnected);
            console.log(socket);
            console.log(currentConvo);
        }
        return;
    }, [selectedMediaBuffer, messageText, user, networkConnected, currentConvo, socket]);

    const checkSocketReconnect = useCallback(async () => {
        if (!socketReconnectSent && (!socket || socketDisconnected)) {
            console.log('reseting socket');
            setSocketReconnectSent(true);
            resetSocket();
            await new Promise(res => setTimeout(res, 1000));
            setSocketReconnectSent(false);
        }
    }, [socketReconnectSent, socket, socketDisconnected, resetSocket]);

    return <Box w='100%' paddingBottom={keyboardShown && !eventBuilderOpen && !pollBuilderOpen ? `${keyboardHeight + 12}px` : '30px'} paddingTop='12px' borderTopRadius={replyMessage ? '0' : '24px'} backgroundColor='white' paddingX='12px' shadow={replyMessage ? '0': '9'} overflow='visible' mt={keyboardShown ? '24px': '0px'}>
        {
            selectedMediaBuffer &&
            <MediaBufferDisplay
                mediaBuffer={selectedMediaBuffer}
                setMediaBuffer={setSelectedMediaBuffer}
                progressMap={mediaProgress}
                />
        }
        <HStack w='100%' space='1'>
            <VStack>
                <Spacer />
            <IconButton label='plus' size={32} shadow='none' color='black' onPress={() => {
                openContentMenu && openContentMenu();
                setPollBuilderOpen(false);
                setEventBuilderOpen(false);
            }} additionalProps={{mb: '6px'}}/>
            </VStack>
            {/* <Input
                placeholder='Message'
                value={messageText}
                onChangeText={setMessageText}
                flex='1'
                h='40px'
                borderRadius='20px'
                paddingX='20px'
                backgroundColor='#f5f5f5'
                isDisabled={!networkConnected || socketDisconnected}
            /> */}
            <Box flex='1'>
            <MentionsInput
                onPressIn={() => {
                    checkSocketReconnect()
                    setPollBuilderOpen(false)
                    setEventBuilderOpen(false)
                }}
                messageText={messageText}
                setMessageText={setMessageText}
                onChange={checkSocketReconnect}
                />
            </Box>
            <VStack>
            <Spacer />
            {!pollBuilderOpen && !eventBuilderOpen && (
                mediaLoading ? 
                <Spinner type='CircleFlip' color="#333" size={40} /> :
                <IconButton label='send' size={40} onPress={handleMessageSend} color="black" shadow="2" disabled={(!networkConnected || socketDisconnected)} />)
            }
            </VStack>
        </HStack>
        {
            pollBuilderOpen &&
            <Box mt='12px' w='100%'>
                <PollBuilder 
                    close={() => setPollBuilderOpen(false)}
                    />
            </Box>
        }
        {
            eventBuilderOpen &&
            <Box mt='12px' w='100%'>
                <EventBuilder 
                    close={() => setEventBuilderOpen(false)}
                    />
            </Box>
        }
    </Box>;
}