import React, { useCallback, useContext } from 'react';
import { Modal, Center, Text, Button, Icon } from 'native-base';
import IconImage from '../generics/IconImage';
import IconButton from '../generics/IconButton';
import { UserConversationProfile } from '../../types/types';
import { Ionicons } from '@expo/vector-icons';
import SocketContext from '../../contexts/SocketContext';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { chatSelector, removeUser } from '../../redux/slices/chatSlice';
import useRequest from '../../requests/useRequest';

export default function RemoveUserModal({
    isOpen,
    handleClose,
    profile,
    onRemove
}: {
    isOpen: boolean;
    handleClose: () => void;
    profile: UserConversationProfile;
    onRemove?: () => void;
}): JSX.Element {
    const dispatch = useAppDispatch();
    const { socket } = useContext(SocketContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { conversationsApi } = useRequest();

    const getModalProfileImage = useCallback(() => {
        if (profile && profile.avatar) {
            return <IconImage imageUri={profile.avatar.mainUri} size={180} shadow='9' />
        }
        return <IconButton label='profile' size={180} shadow='9' />
    }, [profile]);

    const confirmDelete = useCallback(() => {
        if (!profile || !currentConvo) return;
        dispatch(removeUser(profile.id, conversationsApi, () => {
            socket && socket.emit('removeConversationUser', currentConvo.id, profile);
            handleClose();
            onRemove && onRemove();
        }));
    }, [profile, currentConvo, socket]);

    return <Modal isOpen={isOpen} onClose={handleClose} size='lg'>
        <Modal.Content borderRadius='24px' shadow='9' style={{shadowOpacity: 0.12}} p='24px'>
            <Modal.CloseButton />
            <Center w='100%' py='24px'>
                {getModalProfileImage()}
                <Text fontSize='xs' textAlign='center' mx='auto' mt='12px'>
                    {`By selecting confirm you will remove ${profile?.displayName || ''} from the group.`}
                </Text>
            </Center>
            <Button colorScheme='dark' variant='subtle' w='100%' borderRadius='24px' mb='6px' leftIcon={<Icon as={Ionicons} name='ios-person-remove-outline'/>} onPress={confirmDelete}>
                Confirm
            </Button>
            <Button colorScheme='dark' variant='solid' w='100%' borderRadius='24px' mb='6px' onPress={handleClose}>
                <Text>
                Cancel
                </Text>
            </Button>
        </Modal.Content>
    </Modal>
}
