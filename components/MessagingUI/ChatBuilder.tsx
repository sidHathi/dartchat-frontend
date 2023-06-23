import React, { useContext, useState } from "react";
import ConversationContext from "../../contexts/ConversationContext";
import { AuthIdentityContext } from "../AuthIdentityContainer";
import { Conversation, UserConversationProfile } from "../../types/types";

import { View, Box, Button, Center, Heading, Text, Input, VStack } from 'native-base';

export default function ChatBuilder({exit}: {
        exit: () => void
    }): JSX.Element {
    const { newConvo } = useContext(ConversationContext);
    const { user } = useContext(AuthIdentityContext);
    const [isGroup, setIsGroup] = useState(false);
    const [userQuery, setUserQuery] = useState<string | undefined>(undefined);
    const [groupName, setGroupName] = useState<string | undefined>(undefined);
    const [userDispName, setUserDispName] = useState<string | undefined>(undefined);

    const handleSubmit = () => {
        if (!user) return;
        const participants: UserConversationProfile[] = [
            {
                displayName: userDispName || user.displayName || user.handle || user.email,
                id: user.id || 'test',
                profilePic: ''
            }
        ]
        if (isGroup) {
            newConvo(participants, groupName);
        } else {
            newConvo(participants);
        }
    };

    return <View w='100%' h='100%' backgroundColor='#fefefe'>
        <Center h='100%'>
            <Box w='90%' shadow='9' backgroundColor='gray.100' p='20px' marginTop='-20px' borderRadius='24px'>
                <Heading  marginY='12px' size='md'>
                    New {isGroup ? 'Group' : 'Chat'}
                </Heading>
                <Button.Group isAttached marginBottom='20px' w='100%'>
                    <Button borderLeftRadius='30px' colorScheme='coolGray' variant={isGroup ? 'outline' : 'solid'} onPress={() => setIsGroup(false)} marginX='0' w='50%'>
                        Private Message
                    </Button>
                    <Button borderRightRadius='30px' colorScheme='coolGray' variant={isGroup ? 'solid' : 'outline'} onPress={() => setIsGroup(true)} marginX='0' w='50%'>
                        Group Chat
                    </Button>
                </Button.Group>
                <VStack space={1} pb='12px'>
                    <Text fontSize='xs' color='coolGray.600'>
                        {isGroup ? 'Add Participants' : 'Select recipient'}
                    </Text>
                    <Input
                        placeholder='Email, phone number, or username'
                        value={userQuery}
                        onChangeText={setUserQuery}
                        w='100%'
                        h='40px'
                        borderRadius='20px'
                        paddingX='20px'
                        marginRight='8px'
                        backgroundColor='#f1f1f1'
                        // variant="underlined"
                    />
                    {
                        isGroup &&
                        <Box>
                            <Text fontSize='xs' marginTop='8px' color='coolGray.600'>
                                Choose Group name
                            </Text>
                            <Input
                                placeholder='Chat Name'
                                value={groupName}
                                onChangeText={setGroupName}
                                w='100%'
                                h='40px'
                                // borderRadius='20px'
                                paddingX='20px'
                                marginRight='8px'
                                // backgroundColor='#f1f1f1'
                                variant="underlined"
                            />

                        </Box>
                    }{ isGroup &&
                        <Box>
                            <Text fontSize='xs' marginTop='8px' color='coolGray.600'>
                                Choose Your Display Name
                            </Text>
                            <Input
                                placeholder={user?.email || 'Firstname Lastname'}
                                value={userQuery}
                                onChangeText={setUserQuery}
                                w='100%'
                                h='40px'
                                // borderRadius='20px'
                                paddingX='20px'
                                marginRight='8px'
                                // backgroundColor='#f1f1f1'
                                variant="underlined"
                            />
                        </Box>
                    }
                </VStack>
                <Button w='100%' colorScheme='coolGray' borderRadius='30px' onPress={handleSubmit} variant='solid' color='white' marginY='12px'>
                    Create Chat
                </Button>
                <Button w='100%' colorScheme='coolGray' borderRadius='30px' onPress={exit} variant='subtle'>
                    Close
                </Button>
            </Box>
        </Center>
    </View>;
}