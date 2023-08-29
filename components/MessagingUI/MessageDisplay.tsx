import React, { useEffect, useContext, useCallback, useMemo, useState, useRef } from "react";
import { Box, HStack, Spacer, VStack, Text, Pressable, Center, ScrollView } from 'native-base';
import IconButton from "../generics/IconButton";
import { DecryptedMessage, Message, UserConversationProfile } from "../../types/types";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { Dimensions } from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import IconImage from "../generics/IconImage";
import MessageMediaDisplay from "./MessageMediaControllers/MessageMediaDisplay";
import { FontAwesome5 } from '@expo/vector-icons';
import MessageTextDisplay from "./Mentions/MentionsTextDisplay";
import PollDisplay from "../Polls/PollDisplay";
import { encryptMessageForConvo, getDateTimeString } from "../../utils/messagingUtils";
import EventDisplay from "../EventsUI/EventDisplay";
import LikeButton from "./LikeButton";
import Spinner from "react-native-spinkit";
import SocketContext from "../../contexts/SocketContext";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { chatSelector, removeLocalMessage, sendNewMessage } from "../../redux/slices/chatSlice";
import UserSecretsContext from "../../contexts/UserSecretsContext";
import { handleNewMessage, userDataSelector } from "../../redux/slices/userDataSlice";
import ReplyMessageDisplay from "./ReplyMessageDisplay";

export default function MessageDisplay({ 
        message,
        participants, 
        selected, 
        handleSelect, 
        handleLike, 
        handleReply,
        handleReplySelect,
        handleMediaSelect,
        handleProfileSelect,
        handleDelete,
    } : {
    message: DecryptedMessage, 
    participants: {[key: string]: UserConversationProfile},
    selected: boolean,
    handleSelect: () => void,
    handleLike: () => void,
    handleReply: () => void,
    handleReplySelect?: () => void,
    handleMediaSelect?: (message: DecryptedMessage, index: number) => void,
    handleProfileSelect?: (profile: UserConversationProfile) => void,
    handleDelete?: () => void;
}): JSX.Element {
    const screenWidth = Dimensions.get('window').width;

    const dispatch = useAppDispatch();
    const { publicKey } = useAppSelector(userDataSelector);
    const { currentConvo } = useAppSelector(chatSelector);
    const { user } = useContext(AuthIdentityContext);
    const { socket, resetSocket } = useContext(SocketContext);
    const { secrets } = useContext(UserSecretsContext);

    const [sendFailed, setSendFailed] = useState(false);

    const messageRef = useRef(message);

    useEffect(() => {
        messageRef.current = message;
    }, [message])

    const handleMessageResend = useCallback(() => {
        // store message info locally -> modify timestamp -> delete local copy -> attempt resend with socket if socket connected -> return
        if (!socket || !socket.connected) {
            resetSocket();
            return;
        }
        if (!currentConvo || !message) return;
        
        const userSecretKey = secrets ? secrets.userSecretKey : undefined;
        const encryptedMessage = encryptMessageForConvo({
            ...message,
            senderProfile: message.senderProfile ? {
                ...message.senderProfile,
                publicKey: publicKey || message.senderProfile?.publicKey
            } : undefined
        }, currentConvo, userSecretKey);
        dispatch(removeLocalMessage(message.id));
        dispatch(sendNewMessage({socket, message: encryptedMessage}));
        dispatch(handleNewMessage({cid: currentConvo.id, message: encryptedMessage, messageForCurrent: true}));
    }, [socket, resetSocket, currentConvo, secrets, message]);

    useEffect(() => {
        let interval: any;
        if (sendFailed || isSystemMessage) {
            clearInterval(interval);
        } else {
            interval = setInterval(() => {
                // todo: check if the message is not delivered and was sent a long time ago -> if so, indicate this in state
                const minDif = (new Date()).getTime() - messageRef.current.timestamp.getTime();
                if (!messageRef.current.delivered && (minDif/1000 > 60)) {
                    setSendFailed(true);
                }
            }, 60000);
        }

        return () => {
            clearInterval(interval);
        }
    }, [sendFailed, message]);

    const ResendButton = () => <IconButton color="black" label='retry' size={20} onPress={handleMessageResend} />;

    const handleMessageTap = () => {
        handleSelect();
    };

    const isSystemMessage = message.senderId === 'system';

    const senderAvatar = useMemo(() => {
        if (message.senderProfile && message.senderProfile.avatar) {
            return message.senderProfile.avatar;
        } else if (message.senderId in participants) {
            return participants[message.senderId].avatar;
        }
        return undefined;
    }, [message, participants]);

    const senderName = useMemo(() => {
        if (message.senderProfile) {
            return message.senderProfile.displayName;
        } else if (message.senderId in participants) {
            return participants[message.senderId].displayName;
        }
        return undefined;
    }, [message, participants]);

    return <Box w='100%' paddingBottom='8px' paddingX='18px'>
        {
            message.replyRef &&
            <ReplyMessageDisplay 
                replyRef={message.replyRef}
                handleReplySelect={handleReplySelect}
                />
        }
        <HStack space={1} w='100%'>
            <VStack space='3'>
            {
                !isSystemMessage ?
                (
                    senderAvatar ? 
                    <IconImage imageUri={senderAvatar?.tinyUri as string} shadow='9' size={28} nbProps={{
                        mt: '6px',
                        mr: '4px'
                    }}
                    onPress={() => message.senderProfile && message.senderProfile.id !== user?.id && handleProfileSelect && handleProfileSelect(message.senderProfile)}
                    /> :
                    <IconButton label='profile' size={28} additionalProps={{paddingTop: '6px', marginRight: '4px'}} onPress={() => message.senderProfile && message.senderProfile.id !== user?.id && handleProfileSelect && handleProfileSelect(message.senderProfile)} shadow='9' />
                ) :
                <Spacer />
            }
            <Spacer />
            {
                (selected && message.senderId === user?.id && message.messageType !== 'deletion') &&
                <Box mb='20px'>
                    <IconButton label='delete' size={24} color='gray' onPress={handleDelete} />
                </Box>
            }
            </VStack>
            {isSystemMessage && <Spacer />}
            <VStack maxWidth={`${screenWidth - 110} px`} overflowX='visible'>
                <Pressable onPress={handleMessageTap}>
                    {
                        message.objectRef && ['poll', 'event'].includes(message.objectRef.type) ?
                            message.objectRef.type === 'poll' ?
                            <Box w={`${screenWidth - 110} px`} shadow={
                                (selected && !(isSystemMessage || message.messageType === 'deletion')) ? '3' : 'none'
                            }>
                                <PollDisplay pid={message.objectRef.id} />
                            </Box> :
                            message.objectRef.type === 'event' ?
                            <Box w={`${screenWidth - 110} px`} shadow={
                                (selected && !(isSystemMessage || message.messageType === 'deletion')) ? '3' : 'none'
                            }>
                                <EventDisplay eid={message.objectRef.id} selected={selected} />
                            </Box> :
                            <></>
                        :
                    <Box paddingX='18px' paddingY='4px' borderRadius='12px' backgroundColor={(isSystemMessage || message.messageType === 'deletion') ? 'transparent' : '#f5f5f5'} w='100%' margin='0px' shadow={
                        (selected && !(isSystemMessage || message.messageType === 'deletion')) ? '3' : 'none'
                    } overflowX='visible' opacity={(sendFailed && !isSystemMessage) ? '0.5' : '1'}>
                        <VStack overflowX='visible'>
                            {
                                !isSystemMessage &&
                                <Text color='coolGray.600' fontSize='xs'>{senderName}</Text>
                            }
                            {
                                message.media &&
                                <MessageMediaDisplay media={message.media} handleMediaSelect={(index: number) => {
                                    handleMediaSelect && handleMediaSelect(message, index);
                                }}/>
                            }
                            {/* <Text fontSize='sm' color={isSystemMessage ? 'gray.500' : 'black'} mt={message.media && message.content ? '12px' : '0px'}>{message.content}</Text> */}
                            <MessageTextDisplay message={message} fontSize='sm' color={(isSystemMessage || message.messageType === 'deletion') ? 'gray.500' : 'black'} mt={message.media && message.content ? '12px' : '0px'} textAlign={isSystemMessage ? 'center' : 'left'} />
                        </VStack>
                    </Box>
                    }
                </Pressable>
                {
                    selected &&
                    <VStack space={1} py='6px'>
                        <Center w='100%'>
                            <Text fontSize='xs' color='gray.500'>
                                Sent {message && message.timestamp && getDateTimeString(message.timestamp)}
                            </Text>
                        </Center>
                        {message.likes?.length > 0 && message.messageType !== 'deletion' &&
                        <Box>
                            <ScrollView horizontal={true} w='100%'>
                            <HStack space={2}>
                                {
                                    message.likes.map((like, idx) => {
                                        if (like in participants && participants[like].avatar) {
                                            return (
                                            <Pressable key={idx}>
                                                <IconImage
                                                    imageUri={participants[like]?.avatar?.tinyUri as string}
                                                    size={24}
                                                    onPress={() => handleProfileSelect && participants[like] &&handleProfileSelect(participants[like])}
                                                />
                                            </Pressable>
                                            );
                                        }
                                        else {
                                            return (
                                            <Pressable key={idx}>
                                                <IconButton
                                                    label='profile'
                                                    size={24}
                                                    onPress={() => handleProfileSelect && participants[like] &&handleProfileSelect(participants[like])}
                                                    shadow='none'
                                                />
                                            </Pressable>
                                            );
                                        }
                                    })
                                }
                            </HStack>
                            </ScrollView>
                            <Text fontSize='xs' paddingTop='2px'>{`${message.likes.length}`} Like{message.likes.length > 1 && 's'}</Text> 
                        </Box>
                        }
                    </VStack>
                }
            </VStack>
            <Spacer />
            <VStack paddingTop={isSystemMessage ? '6px': '12px'} space={3} mb={isSystemMessage ? '6px': '0px'}>
                {
                    (message.delivered === undefined || message.delivered) ?
                    <LikeButton message={message} onPress={handleLike} /> :
                    (
                        sendFailed ? 
                        <ResendButton /> :
                        <Spinner type='ThreeBounce' size={20} />
                    )
                }
                <Spacer />
                {
                    (selected && !isSystemMessage && (message.delivered === undefined || message.delivered) && message.messageType !== 'deletion') &&
                    <Box pb='24px'>
                        <IconButton
                            label='reply'
                            size={20}
                            onPress={handleReply}
                            color='gray'
                            shadow='none'
                        />
                    </Box>
                }
            </VStack>
        </HStack>
    </Box>
}
