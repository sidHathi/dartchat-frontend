import React, { useCallback, useContext } from "react";
import { Modal, Text, Center, Heading, Button, Icon } from 'native-base';
import { Conversation, UserConversationProfile } from "../../types/types";
import { Feather } from "@expo/vector-icons";
import IconImage from "../generics/IconImage";
import IconButton from "../generics/IconButton";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import uuid from 'react-native-uuid';
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { openPrivateMessage } from "../../redux/slices/chatSlice";
import useRequest from "../../requests/useRequest";
import { userDataSelector } from "../../redux/slices/userDataSlice";

export default function UserDetailsModal({
    isOpen,
    handleClose,
    profile,
    navToMessages,
    handleRemove,
}: {
    isOpen: boolean;
    handleClose: () => void;
    profile: UserConversationProfile;
    navToMessages?: () => void;
    handleRemove?: () => void;
}): JSX.Element {
    const dispatch = useAppDispatch();
    const { user } = useContext(AuthIdentityContext);
    const { userConversations } = useAppSelector(userDataSelector);
    const { conversationsApi } = useRequest();

    const getModalProfileImage = useCallback(() => {
        if (profile && profile.avatar) {
            return <IconImage imageUri={profile.avatar.mainUri} size={180} shadow='9' />
        }
        return <IconButton label='profile' size={180} shadow="9" />
    }, [profile]);

    const handleMessage = useCallback(() => {
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
        handleClose();
        navToMessages && navToMessages();
        return;
    }, [userConversations, user, conversationsApi, profile]);

    return <Modal isOpen={isOpen} onClose={handleClose} size='lg'>
        <Modal.Content borderRadius='24px' shadow='9' style={{shadowOpacity: 0.12}} p='24px'>
            <Modal.CloseButton />
            <Center w='100%' py='24px'>
                {getModalProfileImage()}
                <Heading mt='18px'>
                    {profile.displayName || ''}
                </Heading>
                {profile.handle &&
                <Text fontSize='xs' color='gray.500'>
                    {profile.handle || ''}
                </Text>
                }
            </Center>
            { 
                navToMessages !== undefined &&
                <Button colorScheme='dark' variant='subtle' w='100%' borderRadius='24px' mb='6px' leftIcon={<Icon as={Feather} name='message-circle' />} onPress={handleMessage}>
                    Message
                </Button>
            }
            {
                handleRemove &&
                <Button colorScheme='dark' variant='ghost' w='100%' borderRadius='24px' mb='12px' onPress={handleRemove}>
                    <Text color='red.500'>
                    Remove from group
                    </Text>
                </Button>
            }
        </Modal.Content>
    </Modal>
}