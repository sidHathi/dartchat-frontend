import React, { useState, useContext, useCallback, useMemo } from "react";
import { Box, HStack, Spacer, VStack, Text, Pressable, Center } from 'native-base';
import IconButton from "../generics/IconButton";
import { Message, UserConversationProfile } from "../../types/types";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { Dimensions } from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import IconImage from "../generics/IconImage";
import MessageMediaDisplay from "./MessageMediaControllers/MessageMediaDisplay";
import { FontAwesome5 } from '@expo/vector-icons';
import MessageTextDisplay from "./Mentions/MentionsTextDisplay";
import PollDisplay from "../Polls/PollDisplay";
import { getDateTimeString } from "../../utils/messagingUtils";
import EventDisplay from "../EventsUI/EventDisplay";
import LikeButton from "./LikeButton";

export default function MessageDisplay({ 
        message,
        participants, 
        selected, 
        handleSelect, 
        handleLike, 
        handleReply,
        handleReplySelect,
        handleMediaSelect,
        handleProfileSelect
    } : {
    message: Message, 
    participants: {[key: string]: UserConversationProfile},
    selected: boolean,
    handleSelect: () => void,
    handleLike: () => void,
    handleReply: () => void,
    handleReplySelect?: () => void,
    handleMediaSelect?: (message: Message, index: number) => void,
    handleProfileSelect?: (profile: UserConversationProfile) => void
}): JSX.Element {
    const screenWidth = Dimensions.get('window').width;

    const { user } = useContext(AuthIdentityContext);

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
    }, [message, participants])

    return <Box w='100%' paddingBottom='8px' paddingX='18px'>
        {
            message.replyRef &&
            <Pressable onPress={handleReplySelect} paddingLeft='12px'
            maxWidth='100%'>
                <HStack maxWidth='100%'>
                <Box paddingTop='12px' paddingX='6px' opacity='0.8'>
                    <FontAwesome name="arrows-v" size={20} color="gray" />
                </Box>
                <Box paddingX='15px' paddingY='4px' borderRadius='12px' backgroundColor='#f7f7f7' marginBottom='3px' opacity='0.7'
                mr='24px'>
                    <VStack>
                        {
                            !isSystemMessage &&
                            <Text color='coolGray.600' fontSize='9px'>{participants[message.replyRef.senderId]?.displayName}</Text>
                        }
                        {
                            message.replyRef.media &&
                            <HStack space={2} mt='4px'>
                                <FontAwesome5 name="images" size={24} color="gray" />
                                <Text color='trueGray.600' fontSize='xs' mt='6px' fontWeight='bold'>
                                    Media
                                </Text>
                            </HStack>
                        }
                        {message.content &&
                        // <Text fontSize='xs' noOfLines={1} isTruncated>{message.replyRef.content}</Text>
                        <MessageTextDisplay message={message.replyRef} fontSize='xs' noOfLines={1} isTruncated />
                        }
                    </VStack>
                </Box>
                <Spacer />
                </HStack>
                <Text pl='40px' fontSize='xs' lineHeight='4px' fontWeight='bold' pb='2px' color='coolGray.400'>. . .</Text>
            </Pressable>
        }
        <HStack space={1} w='100%'>
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
            <VStack maxWidth={`${screenWidth - 110} px`} overflowX='visible'>
                <Pressable onPress={handleMessageTap}>
                    {
                        message.objectRef && ['poll', 'event'].includes(message.objectRef.type) ?
                            message.objectRef.type === 'poll' ?
                            <Box w={`${screenWidth - 110} px`} shadow={
                                (selected && !isSystemMessage) ? '3' : 'none'
                            }>
                                <PollDisplay pid={message.objectRef.id} />
                            </Box> :
                            message.objectRef.type === 'event' ?
                            <Box w={`${screenWidth - 110} px`} shadow={
                                (selected && !isSystemMessage) ? '3' : 'none'
                            }>
                                <EventDisplay eid={message.objectRef.id} selected={selected} />
                            </Box> :
                            <></>
                        :
                    <Box paddingX='18px' paddingY='4px' borderRadius='12px' backgroundColor={isSystemMessage ? 'transparent' : '#f5f5f5'} w='100%' margin='0px' shadow={
                        (selected && !isSystemMessage) ? '3' : 'none'
                    } overflowX='visible'>
                        <VStack overflowX='visible'>
                            {
                                !isSystemMessage &&
                                <Text color='coolGray.600' fontSize='10px'>{senderName}</Text>
                            }
                            {
                                message.media &&
                                <MessageMediaDisplay media={message.media} handleMediaSelect={(index: number) => {
                                    handleMediaSelect && handleMediaSelect(message, index);
                                }}/>
                            }
                            {/* <Text fontSize='sm' color={isSystemMessage ? 'gray.500' : 'black'} mt={message.media && message.content ? '12px' : '0px'}>{message.content}</Text> */}
                            <MessageTextDisplay message={message} fontSize='sm' color={isSystemMessage ? 'gray.500' : 'black'} mt={message.media && message.content ? '12px' : '0px'} />
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
                        {message.likes.length > 0 &&
                        <Box>
                            <HStack space={2}>
                                {
                                    message.likes.map((like, idx) => {
                                        if (like in participants && participants[like].avatar) {
                                            return (
                                            <IconImage
                                                key={idx}
                                                imageUri={participants[like]?.avatar?.tinyUri as string}
                                                size={24}
                                            />
                                            );
                                        }
                                        else {
                                            return (
                                            <IconButton
                                                key={idx}
                                                label='profile'
                                                size={24}
                                                onPress={() => {}}
                                                shadow='none'
                                            />
                                            );
                                        }
                                    })
                                }
                            </HStack>
                            <Text fontSize='10px' paddingTop='2px'>{`${message.likes.length}`} Like{message.likes.length > 1 && 's'}</Text> 
                        </Box>
                        }
                    </VStack>
                }
            </VStack>
            <Spacer />
            <VStack paddingTop={isSystemMessage ? '6px': '12px'} space={3} mb={isSystemMessage ? '12px': '0px'}>
                <LikeButton message={message} onPress={handleLike} />
                {
                    message.media &&
                    <Spacer />
                }
                {
                    selected && !isSystemMessage &&
                    <Box pb={message.media ? '24px' : '0px'}>
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
