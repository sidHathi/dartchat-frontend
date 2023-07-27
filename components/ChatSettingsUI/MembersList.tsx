import React, { useCallback, useMemo, useState, useContext } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { Heading, ScrollView, View, VStack, Box, Button, Modal, Center, Text, Icon } from 'native-base';
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

    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const [userDetailModal, setUserDetailModalOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<UserConversationProfile | undefined>();
    const [selectedNewMembers, setSelectedNewMembers] = useState<UserConversationProfile[] | undefined>();
    const [confirmRemoveModalOpen, setConfirmRemoveModalOpen] = useState(false);

    const participants = useMemo(() => currentConvo?.participants || [], [currentConvo]);

    const handleOpenButton = useCallback(() => {
        if (currentConvo && addMenuOpen && selectedNewMembers && selectedNewMembers.length > 0) {
            dispatch(addUsers(selectedNewMembers, conversationsApi, () => {
                socket && socket.emit('newConversationUsers', currentConvo.id, selectedNewMembers);
                setSelectedNewMembers(undefined);
            }));
        }
        setAddMenuOpen(!addMenuOpen);
    }, [addMenuOpen, currentConvo, selectedNewMembers]);

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

    return <View flex='1'>
        <Heading px='24px' mt='24px'>
            Members
        </Heading>

        <ScrollView flexGrow='1' flexShrink='1' px='24px'>
            <VStack my='12px' space={2}>
                {
                participants.map((p: UserConversationProfile) => (
                    <MemberCard 
                        key={p.id}
                        profile={p}
                        handleSelect={() => handleSelect(p)}
                        handleMessage={() => handleMessage(p)}
                        handleRemove={() => handleRemove(p)} />
                ))
                }
            </VStack>
        </ScrollView>
        
        <View flexGrow='0' flexShrink='0'>
            <Box m='6px' shadow='9' borderRadius='24px' bgColor='white' w='100%' p='24px' style={{shadowOpacity: 0.12}} mb='-6px'>
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
            </Box>
        </View>
        {
            selectedProfile &&
            <UserDetailsModal
                isOpen={userDetailModal}
                handleClose={() => setUserDetailModalOpen(false)}
                profile={selectedProfile}
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
