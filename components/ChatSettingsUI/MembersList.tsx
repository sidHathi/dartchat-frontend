import React, { useCallback, useMemo, useState, useContext, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { Heading, ScrollView, View, VStack, Box, Button, Modal, Center, Text, Icon, FlatList, SectionList } from 'native-base';
import { addUsers, chatSelector, openPrivateMessage, removeUser } from '../../redux/slices/chatSlice';
import { Conversation, UserConversationProfile } from '../../types/types';
import MemberCard from './MemberCard';
import { Feather, Ionicons } from '@expo/vector-icons';
import AuthIdentityContext from '../../contexts/AuthIdentityContext';
import NewMemberSearch from './NewMemberSearch';
import useRequest from '../../requests/useRequest';
import SocketContext from '../../contexts/SocketContext';
import uuid from 'react-native-uuid';
import { userDataSelector } from '../../redux/slices/userDataSlice';
import RemoveUserModal from './RemoveUserModal';
import UserDetailsModal from './UserDetailsModal';
import UserSecretsContext from '../../contexts/UserSecretsContext';
import { decodeKey, getNewMemberKeys } from '../../utils/encryptionUtils';
import { useKeyboard } from '@react-native-community/hooks';
import secureStore from '../../localStore/secureStore';

export default function MembersList({
    exit
}: {
    exit: () => void;
}): JSX.Element {
    const dispatch = useAppDispatch();
    const { user } = useContext(AuthIdentityContext);
    const { socket } = useContext(SocketContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { userConversations } = useAppSelector(userDataSelector);
    const { conversationsApi } = useRequest();
    const { secrets } = useContext(UserSecretsContext);
    const { keyboardShown, keyboardHeight } = useKeyboard();

    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const [userDetailModal, setUserDetailModalOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<UserConversationProfile | undefined>();
    const [selectedNewMembers, setSelectedNewMembers] = useState<UserConversationProfile[] | undefined>();
    const [confirmRemoveModalOpen, setConfirmRemoveModalOpen] = useState(false);

    const upToDateSecretsRef = useRef(secrets);

    useEffect(() => {
        upToDateSecretsRef.current = secrets;
    }, [secrets])

    const handleOpenButton = useCallback(async () => {
        if (user && currentConvo && socket && socket.connected && addMenuOpen && selectedNewMembers && selectedNewMembers.length > 0) {
            let keyMap: { [id: string]: string } | undefined = undefined;
            if (currentConvo.publicKey && upToDateSecretsRef.current && upToDateSecretsRef.current[currentConvo.id]) {
                const storedSecretKey = await secureStore.getSecretKeyForKey(user.id, currentConvo.id);
                const secretKey = upToDateSecretsRef.current[currentConvo.id] || storedSecretKey;
                keyMap = getNewMemberKeys(selectedNewMembers, secretKey);
            }

            dispatch(addUsers(selectedNewMembers, conversationsApi, keyMap, () => {
                socket && socket.emit('newConversationUsers', currentConvo.id, selectedNewMembers, keyMap);
                setSelectedNewMembers(undefined);
            }));
        }
        setAddMenuOpen(!addMenuOpen);
    }, [addMenuOpen, currentConvo, selectedNewMembers, secrets, socket]);

    const handleSelect = (profile: UserConversationProfile) => {
        if (user && profile.id === user.id) return;
        setSelectedProfile(profile);
        setUserDetailModalOpen(true);
        return;
    };
    
    const handleMessage = (profile: UserConversationProfile) => {
        if (!user) return;
        const seedConvo: Conversation = {
            id: uuid.v4() as string,
            settings: {},
            participants: [
                profile,
                {
                    displayName: user.displayName || user.handle || user.email,
                    id: user.id || 'test',
                    handle: user.handle,
                    avatar: user.avatar,
                    notifications: 'all',
                }
            ],
            name: 'Private Message',
            group: false,
            avatar: profile.avatar,
            messages: []
        };
        dispatch(openPrivateMessage(seedConvo, user.id, userConversations, conversationsApi));
        exit();
        return;
    };

    const handleRemove = (profile: UserConversationProfile) => {
        setSelectedProfile(profile);
        setUserDetailModalOpen(false);
        setConfirmRemoveModalOpen(true);
        return;
    };

    const userRole = useMemo(() => {
        if (!currentConvo || !user) return undefined;
        return currentConvo.participants.find((p: UserConversationProfile) => p.id === user.id)?.role;
    }, [currentConvo, user]);

    const renderProfile = ({item}: {item: UserConversationProfile}) => {
        return <Box my='3px'>
            <MemberCard 
                key={item.id}
                profile={item}
                handleSelect={() => handleSelect(item)}
                handleMessage={() => handleMessage(item)}
                handleRemove={() => handleRemove(item)} 
                userRole={userRole}
                />
        </Box>
    };

    const admins = useMemo(() => {
        if (!currentConvo) return undefined;
        return currentConvo.participants.filter((p) => p.role && p.role === 'admin');
    }, [currentConvo]);

    const plebians = useMemo(() => {
        if (!currentConvo) return [];
        if (!admins) return currentConvo.participants;
        return currentConvo.participants.filter((p) => p.role !== 'admin');
    }, [currentConvo, admins]);

    const listSections = useMemo(() => {
        if (admins && admins.length > 0) return [
            {title: 'Group admins:', data: admins, renderItem: renderProfile},
            {title: 'Non-admin users:', data: plebians, renderItem: renderProfile}
        ];
        return [{title: 'Non-admin users:', data: plebians, renderItem: renderProfile}];
    }, [currentConvo, admins, plebians])

    return <View flex='1'>
        <Heading px='24px' mt='24px' fontSize='lg'>
            Members
        </Heading>

        <SectionList
            mx='12px'
            renderSectionHeader={({ section: { title }}) => (
                <Text fontWeight='bold' fontSize='sm' color='gray.500' mt='12px' mb='6px' mx='6px'>
                    {title}
                </Text>
            )}
            sections={listSections}
            keyExtractor={(item, index) => item.id} 
            />
        
        <View flexGrow='0' flexShrink='0' bgColor='transparent' overflow='visible'>
            <Box m='6px' shadow='9' borderRadius='24px' bgColor='white' w='100%' p='24px' style={{shadowOpacity: 0.12}} mb='-6px' pb={keyboardShown ? `${keyboardHeight + 12}px`: '24px'}>
            <ScrollView overflow='visible'>
                {
                    addMenuOpen &&
                    <NewMemberSearch selectedNewMembers={selectedNewMembers} setSelectedNewMembers={setSelectedNewMembers} />
                }
                <Button colorScheme='dark' variant='subtle' borderRadius='24px' w='100%' onPress={handleOpenButton} mb='6px'>
                    {
                        !addMenuOpen ? 'Add members' : 
                            selectedNewMembers && selectedNewMembers.length > 0 ? 'Confirm' : 'Cancel'
                    }
                </Button>
            </ScrollView>
            </Box>
        </View>
        {
            selectedProfile &&
            <UserDetailsModal
                isOpen={userDetailModal}
                handleClose={() => setUserDetailModalOpen(false)}
                profile={selectedProfile}
                setProfile={setSelectedProfile}
                navToMessages={exit}
                handleRemove={() => handleRemove(selectedProfile)}
                />
        }
        {
            selectedProfile &&
            <RemoveUserModal
                isOpen={confirmRemoveModalOpen}
                handleClose={() => setConfirmRemoveModalOpen(false)}
                profile={selectedProfile}
                onRemove={() => setSelectedProfile(undefined)} />
        }
    </View>
}
