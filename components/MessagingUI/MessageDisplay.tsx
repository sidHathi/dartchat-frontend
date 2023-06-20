import React, { useState, useContext } from "react";
import { Box, HStack, Spacer, VStack, Text, Pressable } from 'native-base';
import IconButton from "../generics/IconButton";
import { Message, UserConversationProfile } from "../../types/types";
import { AuthContext } from "../AuthIdentityContainer";

export default function MessageDisplay(
    { message, participants, selected, handleSelect, handleLike } : {
    message: Message, 
    participants: {[key: string]: UserConversationProfile},
    selected: boolean,
    handleSelect: () => void;
    handleLike: () => void;
}): JSX.Element {
    const { user } = useContext(AuthContext);

    const handleMessageTap = () => {
        handleSelect();
    };

    return <Box w='100%'>
        <HStack>
            <IconButton label='profile' size={20} />
            <VStack>
                <Pressable onPress={handleMessageTap}>
                    <Box paddingX='8px' paddingY='2px' borderRadius='4px' backgroundColor='#f5f5f5'>
                        <VStack>
                            <Text fontSize='xs'>{participants[message.metadata.senderId].displayName}</Text>
                            <Text fontSize='sm'>{message.content}</Text>
                        </VStack>
                    </Box>
                </Pressable>
                {
                    selected &&
                    <VStack>
                        <Text fontSize='xs' color='gray.300'>
                            Sent {message.metadata.timestamp.toDateString()}
                        </Text>
                        <HStack>
                            {
                                message.metadata.likes.map((like, idx) => (
                                    <IconButton
                                        key={idx}
                                        label='profile'
                                        size={20}
                                        onPress={() => {}}
                                    />
                                ))
                            }
                        </HStack>
                    </VStack>
                }
            </VStack>
            <Spacer />
            <VStack>
                {   
                    user && message.metadata.likes.includes(user.id) ?
                    <IconButton label='heartFill' color='red' size={30} onPress={handleLike} /> :
                    <IconButton label='heartEmpty' color='black' size={30} onPress={handleLike} /> 
                }
                {
                    selected &&
                    <IconButton
                        label='reply'
                        size={30}
                        onPress={() => {}}
                        color='gray.800'
                    />
                }
            </VStack>
        </HStack>
    </Box>
}
