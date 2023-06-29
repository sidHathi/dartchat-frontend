import React, { useState, useContext } from "react";
import { Box, HStack, Spacer, VStack, Text, Pressable, Center } from 'native-base';
import IconButton from "../generics/IconButton";
import { Message, UserConversationProfile } from "../../types/types";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { Dimensions } from "react-native";
import { FontAwesome } from '@expo/vector-icons';

export default function MessageDisplay({ 
        message,
        participants, 
        selected, 
        handleSelect, 
        handleLike, 
        handleReply,
        handleReplySelect
    } : {
    message: Message, 
    participants: {[key: string]: UserConversationProfile},
    selected: boolean,
    handleSelect: () => void,
    handleLike: () => void,
    handleReply: () => void,
    handleReplySelect?: () => void
}): JSX.Element {
    const screenWidth = Dimensions.get('window').width;

    const { user } = useContext(AuthIdentityContext);

    const handleMessageTap = () => {
        handleSelect();
    };

    const isSystemMessage = message.senderId === 'system';

    return <Box w='100%' paddingBottom='8px' paddingX='18px'>
        {
            message.replyRef &&
            <Pressable onPress={handleReplySelect} paddingLeft='12px'>
                <HStack>
                <Box paddingTop='12px' paddingX='6px' opacity='0.8'>
                    <FontAwesome name="arrows-v" size={20} color="gray" />
                </Box>
                <Box paddingX='15px' paddingY='4px' borderRadius='12px' backgroundColor='#f7f7f7' marginBottom='6px' opacity='0.7'>
                    <VStack>
                        {
                            !isSystemMessage &&
                            <Text color='coolGray.600' fontSize='9px'>{participants[message.replyRef.senderId]?.displayName}</Text>
                        }
                        <Text fontSize='xs' noOfLines={1} isTruncated>{message.replyRef.content}</Text>
                    </VStack>
                </Box>
                </HStack>
                <Text pl='40px' fontSize='xs' lineHeight='4px' fontWeight='bold' pb='4px' color='coolGray.400'>. . .</Text>
            </Pressable>
        }
        <HStack space={1} w='100%'>
            {
                !isSystemMessage ?
                <IconButton label='profile' size={28} additionalProps={{paddingTop: '6px', marginRight: '4px'}}/> :
                <Spacer />
            }
            <VStack maxWidth={`${screenWidth - 110} px`}>
                <Pressable onPress={handleMessageTap}>
                    <Box paddingX='18px' paddingY='4px' borderRadius='12px' backgroundColor={isSystemMessage ? 'transparent' : '#f7f7f7'} w='100%' margin='0px' shadow={
                        (selected && !isSystemMessage) ? '3' : 'none'
                    }>
                        <VStack>
                            {
                                !isSystemMessage &&
                                <Text color='coolGray.600' fontSize='10px'>{participants[message.senderId]?.displayName}</Text>
                            }
                            <Text fontSize='sm' color={isSystemMessage ? 'gray.500' : 'black'}>{message.content}</Text>
                        </VStack>
                    </Box>
                </Pressable>
                {
                    selected &&
                    <VStack space={1} py='6px'>
                        <Center w='100%'>
                            <Text fontSize='xs' color='gray.500'>
                                Sent {message && message.timestamp && message.timestamp.toLocaleTimeString()}
                            </Text>
                        </Center>
                        {message.likes.length > 0 &&
                        <Box>
                            <HStack space={2}>
                                {
                                    message.likes.map((like, idx) => (
                                        <IconButton
                                            key={idx}
                                            label='profile'
                                            size={24}
                                            onPress={() => {}}
                                            shadow='none'
                                        />
                                    ))
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
                {   
                    user && message.likes.includes(user.id) ?
                    <IconButton label='heartFill' color='red' size={20} onPress={handleLike} /> :
                        message.likes.length > 0 ?
                        <IconButton label='heartFill' color='gray' size={20} onPress={handleLike} shadow='none' /> :
                        <IconButton label='heartEmpty' color='gray' size={20} onPress={handleLike} shadow='none' /> 
                }
                {
                    selected && !isSystemMessage &&
                    <IconButton
                        label='reply'
                        size={20}
                        onPress={handleReply}
                        color='gray'
                    />
                }
            </VStack>
        </HStack>
    </Box>
}
