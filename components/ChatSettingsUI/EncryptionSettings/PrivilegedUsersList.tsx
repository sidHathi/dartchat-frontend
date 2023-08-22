import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FlatList, Box, Text, HStack, Spacer, VStack, Center, Button } from 'native-base';
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { addUsers, chatSelector } from "../../../redux/slices/chatSlice";
import { UserConversationProfile, UserProfile } from "../../../types/types";
import useRequest from "../../../requests/useRequest";
import IconImage from "../../generics/IconImage";
import IconButton from "../../generics/IconButton";
import RemoveUserModal from "../RemoveUserModal";
import SocketContext from "../../../contexts/SocketContext";
import UserSecretsContext from "../../../contexts/UserSecretsContext";
import { getNewMemberKeys } from "../../../utils/encryptionUtils";
import { buildCProfileForUserProifle, buildDefaultProfileForUser } from "../../../utils/identityUtils";
import AuthIdentityContext from "../../../contexts/AuthIdentityContext";
import { hasPermissionForAction } from "../../../utils/messagingUtils";

export default function PrivilegedUsersList({
    currentMembers
}: {
    currentMembers: boolean;
}): JSX.Element {
    const dispatch = useAppDispatch();
    const { currentConvo } = useAppSelector(chatSelector);
    const { socket } = useContext(SocketContext);
    const { secrets } = useContext(UserSecretsContext);
    const { conversationsApi, profilesApi } = useRequest();
    const { user } = useContext(AuthIdentityContext);

    const [privilegedUserProfiles, setPrivilegedUserProfiles] = useState<UserProfile[]>([]);
    const [removeUserModalOpen, setRemoveUserModalOpen] = useState(false);
    const [upForRemove, setUpForRemove] = useState<UserConversationProfile | undefined>();

    useEffect(() => {
        if (!currentConvo?.keyInfo || currentConvo.keyInfo.privilegedUsers === privilegedUserProfiles.map(p => p.id)) return;
        const fetchProfiles = async () => {
            if (!currentConvo?.keyInfo || currentConvo.keyInfo.privilegedUsers.length < 1) return;
            try {
                const fetchedProfiles = await profilesApi.getProfiles(currentConvo.keyInfo.privilegedUsers);
                setPrivilegedUserProfiles(fetchedProfiles);
            } catch (err) {
                console.log(err);
            }
        }
        fetchProfiles();
    }, [currentConvo]);

    const userProfile = useMemo(() => {
        if (!currentConvo || !user) return undefined;
        return currentConvo.participants.find((p) => p.id === user.id);
    }, [currentConvo, user]);

    const participantMap = useMemo(() => {
        if (!currentConvo) return {};
        return Object.fromEntries(
            currentConvo.participants.map((p) => [p.id, p])
        );
    }, [currentConvo]);

    const getAvatarElem = (profile: UserProfile) => {
        if (profile.avatar) {
            return <IconImage imageUri={profile.avatar.tinyUri} size={36} />;
        }
        return <IconButton label='profile' size={42} />;
    };

    const profilesForContext = useMemo(() => {
        if (!currentConvo || !currentConvo.keyInfo || !privilegedUserProfiles) return [];

        const participantIdSet = new Set(currentConvo.participants.map((p: UserConversationProfile) => p.id));
        if (currentMembers) {
            return privilegedUserProfiles.filter((profile) => {
                return participantIdSet.has(profile.id)
            });
        } else {
            return privilegedUserProfiles.filter((profile) => {
                return !participantIdSet.has(profile.id)
            });
        }
    }, [currentConvo, privilegedUserProfiles, currentMembers]);

    const handleAddUser = useCallback((userPublicProfile: UserProfile) => {
        if (!currentConvo) return;

        const cProfileForUser = buildCProfileForUserProifle(userPublicProfile);
        let keyMap: { [id: string]: string } | undefined = undefined;
        if (currentConvo?.encryptionLevel && currentConvo.encryptionLevel !== 'none' && currentConvo.publicKey && secrets && secrets[currentConvo.id]) {
            const secretKey = secrets[currentConvo.id];
            keyMap = getNewMemberKeys([cProfileForUser], secretKey);
        }

        dispatch(addUsers([cProfileForUser], conversationsApi, () => {
            socket && socket.emit('newConversationUsers', currentConvo.id, [cProfileForUser], keyMap);
        }));
    }, [currentConvo, socket]);

    const handleRemoveUser = useCallback((profileToRemove: UserProfile) => {
        if (!currentConvo) return;
        const cProfile = buildCProfileForUserProifle(profileToRemove);
        setUpForRemove(cProfile);
        setRemoveUserModalOpen(true);
    }, [currentConvo]);

    const renderItem = ({item, index}: {item: UserProfile, index: number}) => {
        const permissionToRemove = hasPermissionForAction('removeUser', userProfile?.role, participantMap[item.id]?.role);
        const showButton = !currentMembers || permissionToRemove;
        return <Box w='100%' borderRadius='12px' bgColor={index % 2 === 0 ? 'transparent': '#f5f5f5'}>
            <HStack px='6px' space={3} py='6px'>
                {getAvatarElem(item)}
                <VStack>
                    <Spacer />
                    <Text fontSize='sm' fontWeight='bold'>
                        {item.displayName}
                    </Text>
                    <Text fontSize='9px' color='gray.500'>
                        {item.handle}
                    </Text>
                    <Spacer />
                </VStack>
            <Spacer />
            {
                (!(user?.id === item.id) && showButton) &&
                <Center>
                    <Button size='xs' colorScheme='dark' variant='subtle' borderRadius='full' onPress={
                        currentMembers ? 
                        () => {handleRemoveUser(item)} :
                        () => {handleAddUser(item)}
                    } px='24px'>
                        {currentMembers ? 'Remove -' : 'Add +'}
                    </Button>
                </Center>
            }
            </HStack>
        </Box>;
    }

    return <Box w='100%'>
        {
             <Text color='gray.500' fontSize='xs' mt='12px' px='12px'>
             {
                currentMembers ? 'All current members have access to the key' :
                'Former members have seen the key but are not authorized to store or use it'
             }
             </Text>
        }
        {
            currentConvo?.keyInfo &&
            <FlatList 
                my='6px'
                data={profilesForContext}
                renderItem={renderItem}
                />
        }
        {
        upForRemove &&
        <RemoveUserModal
            isOpen={removeUserModalOpen}
            handleClose={() => setRemoveUserModalOpen(false)}
            profile={upForRemove} />
        }
    </Box>
}