import React, { useContext, useState, useEffect } from "react";
import ConversationContext from "../../contexts/ConversationContext";
import { AuthIdentityContext } from "../AuthIdentityContainer";
import { Conversation, UserConversationProfile } from "../../types/types";
import ProfilesSearch from "./ProfileSearch";
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

import { View, Box, Button, Center, Heading, Text, Input, VStack, HStack, Pressable, Flex } from 'native-base';
import { ScrollView } from "react-native";

export default function ChatBuilder({exit}: {
        exit: () => void
    }): JSX.Element {
    const { newConvo } = useContext(ConversationContext);
    const { user } = useContext(AuthIdentityContext);
    const [isGroup, setIsGroup] = useState(false);
    const [userQuery, setUserQuery] = useState<string | undefined>(undefined);
    const [groupName, setGroupName] = useState<string | undefined>(undefined);
    const [userDispName, setUserDispName] = useState<string | undefined>(undefined);
    const [selectedProfiles, setSelectedProfiles] = useState<UserConversationProfile[]>([]);

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

    useEffect(() => {
        if (!isGroup) {
            setSelectedProfiles([]);
        }
    }, [isGroup]);

    const RecipientBadge = ({
        fullSize,
        profile,
        onPress
    }: {
        fullSize: boolean,
        profile: UserConversationProfile;
        onPress: () => void;
    }) : JSX.Element => (
        <Pressable onPress={onPress} mr='4px' mb='8px'>
            <Box py={fullSize ? '12px' : '4px'} px='6px' borderRadius='12px' bgColor='#fefefe' shadow='3' w={fullSize ? '100%' : 'auto'}>
                <HStack w='100%'>
                    <Image source={require('../../assets/profile-01.png')} 
                        style={{
                            width: fullSize ? 30 : 20,
                            height: fullSize ? 30 : 20,
                            marginTop: 'auto',
                            marginBottom: 'auto',
                        }}/>
                    { fullSize ?
                        <Box mr='auto' my='auto'>
                            <Text fontSize='md' mx='4px' fontWeight='bold'>
                                {profile.displayName}
                            </Text>
                        </Box> :
                        <Box>
                            <Text fontSize='sm' mx='4px'>
                                {profile.displayName}
                            </Text>
                        </Box>
                    }
                    <Box h='100%' display='flex' mt='2px'>
                        <Ionicons name="remove-circle" size={fullSize ? 24 : 16} color="pink" 
                        my='auto' />
                    </Box>
                </HStack>
            </Box>
        </Pressable>
    )

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
                {
                    selectedProfiles.length > 0 &&
                    <Box>
                    <Text color='gray.500' fontSize='xs' mb='4px'>
                        { isGroup ? 'Selected recipients:' : 'Recipient:' }
                    </Text>
                    <ScrollView>
                    <Flex direction='row' flexWrap='wrap' w='100%' maxHeight='200px'>
                    {
                        selectedProfiles.map((profile, idx) => (
                            <RecipientBadge
                                key={idx} 
                                fullSize={!isGroup}
                                profile={profile}
                                onPress={() => {
                                    setSelectedProfiles(
                                        selectedProfiles.filter(p =>
                                            p.id !== profile.id
                                        )
                                    )
                                }}
                            />
                        ))
                    }
                    </Flex>
                    </ScrollView>
                    </Box>
                }
                <VStack space={1} pb='12px'>
                    <ProfilesSearch 
                        isGroup={isGroup}
                        selectedProfiles={selectedProfiles}
                        setSelectedProfiles={setSelectedProfiles}
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