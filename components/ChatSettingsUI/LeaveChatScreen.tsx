import React, { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { chatSelector } from '../../redux/slices/chatSlice';
import { handleRoleUpdate, handleUserConvoLeave, userDataSelector } from '../../redux/slices/userDataSlice';
import { Conversation, UserConversationProfile } from '../../types/types';
import useRequest from '../../requests/useRequest';
import AuthIdentityContext from '../../contexts/AuthIdentityContext';
import ConfirmationModal from '../generics/ConfirmationModal';
import SocketContext from '../../contexts/SocketContext';
import { buildDefaultProfileForUser } from '../../utils/identityUtils';
import UIContext from '../../contexts/UIContext';
import { Box, Center, VStack, Spacer, Text, HStack, FlatList, Modal, Heading, Button } from 'native-base';
import IconButton from '../generics/IconButton';
import IconImage from '../generics/IconImage';
import { Pressable } from 'react-native';
import Spinner from 'react-native-spinkit';

export default function LeaveChatScreen({
    cid,
    isOpen,
    onClose
}: {
    cid: string;
    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    const { user } = useContext(AuthIdentityContext);
    const { socket } = useContext(SocketContext);
    const { navSwitch } = useContext(UIContext);
    const { userConversations } = useAppSelector(userDataSelector);
    const { currentConvo } = useAppSelector(chatSelector);
    const { conversationsApi } = useRequest();
    const dispatch = useAppDispatch();

    const [convoData, setConvoData] = useState<Conversation | undefined>();
    const [selectedSuccessorAdminIds, setSelectedSuccessorAdminIds] = useState<string[]>([]);

    useEffect(() => {
        if (convoData) return;
        setConvoData(undefined);
        const pullConvoData = async () => {
            try {
                const pulledConvo = await conversationsApi.getConversationInfo(cid);
                setConvoData(pulledConvo);
            } catch (err) {
                console.log(err);
            }
        }
        pullConvoData();
    }, [cid, convoData, currentConvo]);

    const shouldDelegateAdminStatus = useMemo(() => {
        const currPreview = userConversations.find((c) => c.cid === cid);
        if (!currPreview?.userRole || currPreview.userRole !== 'admin') {
            return false;
        }

        if (!convoData) return undefined;
        const remainingAdmins = convoData.participants.filter((p) => {
            if (p.role === 'admin' && p.id !== user?.id) {
                return true;
            }
            return false;
        });
        if (remainingAdmins.length > 0) return false;
        return true;
    }, [userConversations, cid, convoData, user]);

    const leaveChat = useCallback(async () => {
        if (!user || !socket) return;

        try {
            await conversationsApi.leaveChat(cid);
            dispatch(handleUserConvoLeave(cid));
            socket && socket.emit('removeConversationUser', cid, buildDefaultProfileForUser(user));
            if (currentConvo?.id === cid) {
                navSwitch('conversations');
            }
            onClose();
        } catch (err) {
            console.log(err);
        }
    }, [currentConvo, cid, socket, user]);

    const getProfileAvatarElem = (profile: UserConversationProfile) => {
        if (profile.avatar) {
            return <IconImage imageUri={profile.avatar.tinyUri} size={36} />;
        }
        return <IconButton label='profile' size={36} />;
    };

    const handleSuccessorSelect = useCallback((id: string) => {
        if (selectedSuccessorAdminIds.includes(id)) {
            setSelectedSuccessorAdminIds(selectedSuccessorAdminIds.filter((s) => s !== id));
        } else {
            setSelectedSuccessorAdminIds([
                ...selectedSuccessorAdminIds,
                id
            ]);
        }
    }, [selectedSuccessorAdminIds]);

    const appointSuccessors = useCallback(async () => {
        try {
            await Promise.all(
                selectedSuccessorAdminIds.map(async (sid) => {
                    await conversationsApi.updateUserRole(cid, sid, 'admin');
                    socket && socket.emit('userRoleChanged', cid, sid, 'admin');
                })
            );
        } catch (err) {
            console.log(err);
        }
    }, [conversationsApi, selectedSuccessorAdminIds, cid, socket]);

    const handleConfirmLeave = useCallback(async () => {
        if (selectedSuccessorAdminIds.length > 0) {
            await appointSuccessors();
        }
        await leaveChat();
    }, [cid, appointSuccessors]);

    const renderSuccessorSelector = ({item}: {item: UserConversationProfile}) => {
        const selected = selectedSuccessorAdminIds.includes(item.id);
        return <Pressable onPress={() => handleSuccessorSelect(item.id)}>
            <Box borderRadius='24px' bgColor={selected ? '#222' : '#f1f1f1'}my='3px'>
                <HStack pl='12px' pr='6px' space={3} py='9px'>
                    {getProfileAvatarElem(item)}
                    <VStack>
                        <Spacer />
                        <Text fontSize='sm' fontWeight='bold' color={selected ? 'white': 'black'}>
                            {item.displayName}
                        </Text>
                        <Text fontSize='9px' color={selected ? 'white': 'gray.500'}>
                            {item.handle}
                        </Text>
                        <Spacer />
                    </VStack>
                    <Spacer />
                </HStack>
            </Box>
        </Pressable>
    }

    const SuccessorsList = () => (
        <FlatList
            w='100%'
            maxHeight='500px'
            my='6px'
            data={convoData?.participants}
            renderItem={renderSuccessorSelector}
            />
    );

    if (shouldDelegateAdminStatus === false) {
        return <ConfirmationModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={leaveChat}
            title='Confirm Leave'
            content={`You can rejoin the chat at any time.`}
            size='xl'
        />
    }

    return <Modal isOpen={isOpen} onClose={onClose} size='xl'>
    <Modal.Content borderRadius='24px' shadow='9' style={{shadowOpacity: 0.12}} p='24px'>
        <Modal.CloseButton />
        {
            shouldDelegateAdminStatus === undefined ? 
            <Center w='100%' py='24px'>
                <Spinner type='ThreeBounce' />
            </Center> :
            <Box w='100%' py='24px'>
                <Heading fontSize='xl'>
                    Select new admins
                </Heading>
                <Text my='12px'>
                    {'If you leave without selecting at least one new admin, this group will lose content moderation abilities until you rejoin (messages will be deletable only by their senders).'}
                </Text>
                <SuccessorsList />
                <Button 
                    mt='24px'
                    colorScheme={selectedSuccessorAdminIds.length > 0  ? 'dark' : 'light'}
                    variant={selectedSuccessorAdminIds.length > 0 ? 'subtle' : 'ghost'}
                    w='100%' 
                    borderRadius='24px' 
                    mb='6px' 
                    onPress={handleConfirmLeave}>
                    {
                        selectedSuccessorAdminIds.length > 0 ?
                        'Confirm' :
                        'Leave without successors'
                    }
                </Button>
            </Box>
        }
    </Modal.Content>
    </Modal>
}