import React, { useCallback, useMemo, useState, useContext } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { Heading, ScrollView, View, VStack, Box, Button, Modal, Center, Text, Icon } from 'native-base';
import { addUsers, chatSelector, openPrivateMessage, removeUser } from '../../redux/slices/chatSlice';
import { Conversation, UserConversationProfile } from '../../types/types';
import MemberCard from './MemberCard';
import IconButton from '../generics/IconButton';
import ProfileImage from '../generics/ProfileImage';
import { Feather, Ionicons } from '@expo/vector-icons';
import AuthIdentityContext from '../../contexts/AuthIdentityContext';
import NewMemberSearch from './NewMemberSearch';
import useRequest from '../../requests/useRequest';
import SocketContext from '../../contexts/SocketContext';
import uuid from 'react-native-uuid';
import { userConversationsSelector } from '../../redux/slices/userConversationsSlice';

export default function MembersList({
    exit
}: {
    exit: () => void;
}): JSX.Element {
    const dispatch = useAppDispatch();
    const { user } = useContext(AuthIdentityContext);
    const { socket } = useContext(SocketContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { userConversations } = useAppSelector(userConversationsSelector);
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
    
    const getModalProfileImage = useCallback(() => {
        if (selectedProfile && selectedProfile?.avatar) {
            return <ProfileImage imageUri={selectedProfile.avatar.mainUri} size={180} shadow='9' />
        }
        return <IconButton label='profile' size={180} />
    }, [selectedProfile]);

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

    const confirmDelete = useCallback(() => {
        if (!selectedProfile || !currentConvo) return;
        dispatch(removeUser(selectedProfile.id, conversationsApi, () => {
            socket && socket.emit('removeConversationUser', currentConvo.id, selectedProfile.id);
            setConfirmRemoveModalOpen(false);
            setSelectedProfile(undefined);
        }));
    }, [selectedProfile]);

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

        <Modal isOpen={userDetailModal} onClose={() => setUserDetailModalOpen(false)} size='lg'>
            <Modal.Content borderRadius='24px' shadow='9' style={{shadowOpacity: 0.12}} p='24px'>
                <Modal.CloseButton />
                <Center w='100%' py='24px'>
                    {getModalProfileImage()}
                    <Heading mt='18px'>
                        {selectedProfile?.displayName || ''}
                    </Heading>
                    {selectedProfile?.handle &&
                    <Text fontSize='xs' color='gray.500'>
                        {selectedProfile?.handle || ''}
                    </Text>
                    }
                </Center>
                <Button colorScheme='dark' variant='subtle' w='100%' borderRadius='24px' mb='6px' leftIcon={<Icon as={Feather} name='message-circle'/>}>
                    Message
                </Button>
                <Button colorScheme='dark' variant='ghost' w='100%' borderRadius='24px' mb='12px' onPress={() => (selectedProfile && handleRemove(selectedProfile))}>
                    <Text color='red.500'>
                    Remove from group
                    </Text>
                </Button>
            </Modal.Content>
        </Modal>

        <Modal isOpen={confirmRemoveModalOpen} onClose={() => setConfirmRemoveModalOpen(false)} size='lg'>
            <Modal.Content borderRadius='24px' shadow='9' style={{shadowOpacity: 0.12}} p='24px'>
                <Modal.CloseButton />
                <Center w='100%' py='24px'>
                    {getModalProfileImage()}
                    <Text fontSize='xs' textAlign='center' mx='auto' mt='12px'>
                        {`By selecting confirm you will remove ${selectedProfile?.displayName || ''} from the group.`}
                    </Text>
                </Center>
                <Button colorScheme='dark' variant='subtle' w='100%' borderRadius='24px' mb='6px' leftIcon={<Icon as={Ionicons} name='ios-person-remove-outline'/>} onPress={confirmDelete}>
                    Confirm
                </Button>
                <Button colorScheme='dark' variant='solid' w='100%' borderRadius='24px' mb='6px' onPress={() => setConfirmRemoveModalOpen}>
                    <Text>
                    Cancel
                    </Text>
                </Button>
            </Modal.Content>
        </Modal>
    </View>
}
