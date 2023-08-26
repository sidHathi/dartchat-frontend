import React, { useContext, useState, useEffect, useMemo, useCallback } from "react";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { AvatarImage, Conversation, UserConversationProfile } from "../../types/types";
import ProfilesSearch from "./ProfileSearch";
import { Ionicons } from '@expo/vector-icons';
import { View, Box, Button, Center, Heading, Text, Input, VStack, HStack, Pressable, Flex, ScrollView } from 'native-base';
import { Image as RNImage, Dimensions } from "react-native";
import uuid from 'react-native-uuid';
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { addConversation, userDataSelector } from "../../redux/slices/userDataSlice";
import { openPrivateMessage, setConvo } from "../../redux/slices/chatSlice";
import SocketContext from "../../contexts/SocketContext";
import useRequest from "../../requests/useRequest";
import { getDownloadUrl } from "../../firebase/cloudStore";
import IconImage from "../generics/IconImage";
import { autoGenGroupAvatar } from "../../utils/messagingUtils";
import { getNewConversationKeys } from "../../utils/encryptionUtils";
import UserSecretsContext from "../../contexts/UserSecretsContext";
import { getGroupAvatarFromCropImage, selectProfileImage } from "../../utils/identityUtils";
import { Image } from 'react-native-image-crop-picker';
import Spinner from "react-native-spinkit";

export default function ChatBuilder({exit}: {
        exit: () => void
    }): JSX.Element {
    const screenHeight = Dimensions.get('window').height;

    const { socket } = useContext(SocketContext);
    const { user } = useContext(AuthIdentityContext);
    const { handleNewConversationKey } = useContext(UserSecretsContext);
    const dispatch = useAppDispatch();
    const { conversationsApi } = useRequest();
    const { userConversations } = useAppSelector(userDataSelector);

    const [isGroup, setIsGroup] = useState(false);
    const [userQuery, setUserQuery] = useState<string | undefined>(undefined);
    const [groupName, setGroupName] = useState<string | undefined>(undefined);
    const [userDispName, setUserDispName] = useState<string | undefined>(undefined);
    const [groupAvatar, setGroupAvatar] = useState<AvatarImage | undefined>();
    const [selectedProfiles, setSelectedProfiles] = useState<UserConversationProfile[]>([]);
    const [error, setError] = useState<string | undefined>(undefined);
    const [encryptedGroup, setEncryptedGroup] = useState(false);
    // const { keyboardShown, keyboardHeight } = useKeyboard();
    const [avatarDispUri, setAvatarDispUri] = useState<string | undefined>(undefined);
    const [affiliatedCid, setAffiliatedCid] = useState<string | undefined>();
    const [avatarUploading, setAvatarUploading] = useState(false);

    const encryptionPossible = useMemo(() => {
        if (selectedProfiles.length < 1) return true;
        if (selectedProfiles.find((profile) => profile.publicKey === undefined)) {
            return false;
        }
        return true;
    }, [selectedProfiles]);

    const getConversationKeys = useCallback(() => 
        getNewConversationKeys(selectedProfiles), 
    [selectedProfiles]);

    const checkParticipantValidity = () => {
        if (isGroup) {
            return true;
        } else if (selectedProfiles.length < 1) {
            setError('Please select a recipient');
            return false;
        }
        return true;
    };

    const getGroupName = useCallback(() => {
        if (groupName) return groupName;
        if (!isGroup) {
            return 'Private chat'
        }
        return `${userDispName || user?.displayName || user?.handle || user?.email || 'Unnamed chat'} + ${selectedProfiles.length} others`;
    }, [groupName, selectedProfiles, user, isGroup]);

    useEffect(() => {
        const updateAvatarDisp = async () => {
            if (groupAvatar) {
                setAvatarDispUri(groupAvatar.mainUri);
            } else if (!avatarDispUri) {
                const generatedAvatar = await autoGenGroupAvatar(isGroup, selectedProfiles, user?.id);
                setAvatarDispUri(generatedAvatar?.mainUri);
                setGroupAvatar(generatedAvatar);
            }
        };
        updateAvatarDisp();
    }, [groupAvatar, user, isGroup, selectedProfiles]);

    const handleNewAvatarImage = useCallback(async (image: Image) => {
        let cid = uuid.v4().toString();
        if (!affiliatedCid) {
            setAffiliatedCid(cid);
        } else {
            cid = affiliatedCid;
        }

        setAvatarUploading(true);
        try {
            const avatar = await getGroupAvatarFromCropImage(image, cid);
            setGroupAvatar(avatar);
            setAvatarUploading(false);
        } catch (err) {
            console.log(err);
            setAvatarUploading(false);
        }
    }, [affiliatedCid]);

    const selectImage = useCallback(async () => {
        await selectProfileImage(handleNewAvatarImage);
    }, [handleNewAvatarImage]);

    const handleSubmit = useCallback(async () => {
        console.log('attempting to create chat')
        if (!user || !checkParticipantValidity()) return;
        const participants: UserConversationProfile[] = [
            ...selectedProfiles,
            {
                displayName: userDispName || user.displayName || user.handle || user.email,
                id: user.id || 'test',
                handle: user.handle,
                avatar: user.avatar,
                notifications: 'all',
                publicKey: user.publicKey,
                role: isGroup ? 'admin' : undefined
            }
        ]

        const encrypted = (isGroup && encryptedGroup) || (!isGroup && encryptionPossible);
        let publicKey: string | undefined = undefined;
        let recipientKeyMap: {[key: string] : string} | undefined = undefined;
        let secretKey: Uint8Array | undefined = undefined;
        let encodedSecretKey: string | undefined = undefined;
        if (encrypted) {
            const keys = await getConversationKeys();
            if (keys && Object.entries(keys.encryptedKeysForUsers).length === selectedProfiles.length) {
                secretKey = keys.keyPair.secretKey;
                encodedSecretKey = keys.encodedKeyPair.secretKey;
                publicKey = keys.encodedKeyPair.publicKey;
                recipientKeyMap = keys.encryptedKeysForUsers;
            }
            console.log('new conversation keys:')
            console.log(keys);
        }

        const avatar = groupAvatar || await autoGenGroupAvatar(isGroup, participants, user?.id);
        const newConvo: Conversation = {
            id: affiliatedCid || uuid.v4() as string,
            settings: {},
            participants: participants,
            name: getGroupName(),
            messages: [],
            group: isGroup,
            avatar,
            encryptionLevel: encrypted ? 'encrypted' : 'none',
            publicKey
        };

        console.log('creating chat');
        if (isGroup) {
            dispatch(setConvo({
                convo: newConvo,
                secretKey: secretKey
            }));
            if (socket && user) {
                socket.emit('newConversation', newConvo, recipientKeyMap);
                dispatch(addConversation({
                    newConvo,
                    uid: user.id,
                    secretKey
                }));
                if (secretKey && encodedSecretKey) {
                    console.log('adding keys to store');
                    console.log(encodedSecretKey);
                    handleNewConversationKey(newConvo.id, secretKey, encodedSecretKey);
                }
            }
        } else if (user) {
            dispatch(openPrivateMessage(newConvo, user.id, userConversations, conversationsApi, recipientKeyMap, secretKey));
            if (secretKey && encodedSecretKey) {
                console.log('running private message key callback');
                console.log(secretKey);
                console.log(encodedSecretKey);
                await handleNewConversationKey(newConvo.id, secretKey, encodedSecretKey);
            }
        }
    }, [user, selectedProfiles, groupAvatar, isGroup, userConversations, getConversationKeys, encryptedGroup, getGroupName]);

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
        <Pressable onPress={onPress} mr='4px' mb='8px' overflow='visible'>
            <Box py={fullSize ? '12px' : '4px'} px='6px' borderRadius='12px' bgColor='#fefefe' shadow='3' w={fullSize ? '100%' : 'auto'}>
                <HStack w='100%'>
                    {
                    profile.avatar ?
                    <IconImage imageUri={fullSize ? profile.avatar.mainUri: profile.avatar.tinyUri} size={fullSize ? 30 : 20} /> :
                    <RNImage source={require('../../assets/profile-01.png')} 
                        style={{
                            width: fullSize ? 30 : 20,
                            height: fullSize ? 30 : 20,
                            marginTop: 'auto',
                            marginBottom: 'auto',
                        }}/>
                    }
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

    return <View w='100%' flex='1' backgroundColor='#111'>
        <Center h='100%' borderTopLeftRadius='24px' backgroundColor='#fefefe'>
            <Box w={isGroup ? '96%': '90%'} shadow='9' backgroundColor='#f5f5f5' p='20px' marginTop={isGroup ? '-72px' : '-144px'} borderRadius='24px' maxH={`${screenHeight - 190} px`} style={{shadowOpacity: 0.18}}>
                <Heading  marginY='12px' size='md'>
                    New {isGroup ? 'Group' : 'Chat'}
                </Heading>
                <ScrollView overflow='visible'>
                <Button.Group isAttached marginBottom='20px' w='100%'>
                    <Button borderLeftRadius='30px' colorScheme={isGroup ? 'light' : 'dark'} variant={isGroup ? 'outline' : 'subtle'} onPress={() => setIsGroup(false)} marginX='0' w='50%'>
                        Private Message
                    </Button>
                    <Button borderRightRadius='30px' colorScheme={!isGroup ? 'light' : 'dark'} variant={!isGroup ? 'outline' : 'subtle'} onPress={() => setIsGroup(true)} marginX='0' w='50%'>
                        Group Chat
                    </Button>
                </Button.Group>
               
                <VStack space={1} pb='18px' overflow='visible'>
                    {
                        isGroup &&
                        <Box>
                            <Button.Group isAttached marginBottom='20px' w='100%'>
                                <Button borderLeftRadius='30px' colorScheme={encryptedGroup ? 'light' : 'dark'} variant={encryptedGroup ? 'outline' : 'subtle'} onPress={() => setEncryptedGroup(false)} marginX='0' w='50%'>
                                    Public group
                                </Button>
                                <Button borderRightRadius='30px' colorScheme={!encryptedGroup ? 'light' : 'dark'} variant={!encryptedGroup ? 'outline' : 'subtle'} onPress={() => setEncryptedGroup(true)} marginX='0' w='50%'>
                                    Secured group
                                </Button>
                            </Button.Group>
                        </Box>
                    } 
                    {
                        (isGroup && avatarDispUri) && <>
                        <View h='0px' w='100%' overflow='visible'
                        zIndex='1004'>
                            <Box h='100px' w='100%' overflow='visible'>
                                <Center w='100%' overflow='visible'>
                                <Button colorScheme='coolGray' mt='40px' borderRadius='24px' px='12px' variant='solid' onPress={selectImage} py='6px' opacity='0.7' flexShrink='0'>
                                    <Text fontSize='9px' color='#f5f5f5' fontWeight='medium'>
                                        Change profile image
                                    </Text>
                                </Button>
                                </Center>
                            </Box>
                        </View>

                        <Box m='auto' mb='6px' zIndex='1001'>
                            <IconImage imageUri={avatarDispUri} size={100} shadow='9' />
                            {
                                avatarUploading &&
                                <Box m='auto'><Spinner type='ThreeBounce' /></Box>
                            }
                        </Box>
                        </>
                    }
                    {
                        selectedProfiles.length > 0 &&
                        <Box>
                        <Text color='gray.500' fontSize='xs' mb='4px'>
                            { isGroup ? 'Selected recipients:' : 'Recipient:' }
                        </Text>
                        <ScrollView style={{overflow: 'visible'}}>
                        <Flex direction='row' flexWrap='wrap' w='100%' maxHeight='200px' overflow='visible'>
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
                    <ProfilesSearch 
                        isGroup={isGroup}
                        encrypted={!isGroup || encryptedGroup}
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
                                // autoFocus={true}
                            />

                        </Box>
                    }{ isGroup &&
                        <Box>
                            <Text fontSize='xs' marginTop='8px' color='coolGray.600'>
                                Choose Your Display Name
                            </Text>
                            <Input
                                placeholder={user?.email || 'Firstname Lastname'}
                                value={userDispName}
                                onChangeText={setUserDispName}
                                w='100%'
                                h='40px'
                                // borderRadius='20px'
                                paddingX='20px'
                                marginRight='8px'
                                // backgroundColor='#f1f1f1'
                                variant="underlined"
                                // autoFocus={true}
                            />
                        </Box>
                    }
                </VStack>
                {
                    error &&
                    <Center w='100%'>
                        <Text color='red.500' fontSize='xs' mb='4px'>
                            {error}
                        </Text>
                    </Center>
                }
                </ScrollView>
                <Button w='100%' colorScheme='dark' borderRadius='30px' onPress={handleSubmit} variant='subtle' color='white' mb='12px'>
                    Create Chat
                </Button>
                <Button w='100%' colorScheme='coolGray' borderRadius='30px' onPress={exit} variant='subtle'>
                    Close
                </Button>
            </Box>
        </Center>
    </View>;
}