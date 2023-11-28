import React, { useCallback, useContext, useMemo } from "react";
import { Modal, Text, Center, Heading, Button, Icon, Box, theme } from 'native-base';
import { ChatRole, Conversation, UserConversationProfile } from "../../types/types";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import IconImage from "../generics/IconImage";
import IconButton from "../generics/IconButton";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import uuid from 'react-native-uuid';
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { chatSelector, openPrivateMessage, updateUserRole } from "../../redux/slices/chatSlice";
import useRequest from "../../requests/useRequest";
import { userDataSelector } from "../../redux/slices/userDataSlice";
import { findPrivateMessageIdForUser, hasPermissionForAction } from "../../utils/messagingUtils";
import SocketContext from "../../contexts/SocketContext";
import { buildCProfileForUserProfile } from "../../utils/identityUtils";
import { getNewConversationKeys } from "../../utils/encryptionUtils";
import UserSecretsContext from "../../contexts/UserSecretsContext";
import colors from "../colors";
import UIContext from "../../contexts/UIContext";
import UIButton from "../generics/UIButton";

export default function UserDetailsModal({
    isOpen,
    handleClose,
    profile,
    setProfile,
    navToMessages,
    handleRemove,
}: {
    isOpen: boolean;
    handleClose: () => void;
    profile: UserConversationProfile;
    setProfile: (newProfile: UserConversationProfile) => void;
    navToMessages?: () => void;
    handleRemove?: () => void;
}): JSX.Element {
    const dispatch = useAppDispatch();
    const { socket } = useContext(SocketContext);
    const { user } = useContext(AuthIdentityContext);
    const { handleNewConversationKey } = useContext(UserSecretsContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { userConversations } = useAppSelector(userDataSelector);
    const { conversationsApi } = useRequest();
    const { theme } = useContext(UIContext);

    const userProfile = useMemo(() => {
        if (!currentConvo || !user) return undefined;
        return currentConvo.participants.find((p) => p.id === user.id);
    }, [user, currentConvo]);

    const permissionToRemove = useMemo(() => {
        return hasPermissionForAction('removeUser', userProfile?.role, profile.role);
    }, [profile, userProfile]);

    const showToggleAdminButton = useMemo(() => {
        return userProfile?.role && userProfile?.role === 'admin';
    }, [profile]);

    const getModalProfileImage = useCallback(() => {
        if (profile && profile.avatar) {
            return <IconImage imageUri={profile.avatar.mainUri} size={180} shadow='9' />
        }
        return <IconButton label='profile' size={180} shadow="9" />
    }, [profile]);

    const handleToggleAdminStatus = useCallback(async () => {
        if (!currentConvo) return;
        try {
            const newRole: ChatRole = profile.role === 'admin' ? 'plebian' : 'admin';
            await conversationsApi.updateUserRole(currentConvo.id, profile.id, newRole);
            dispatch(updateUserRole({uid: profile.id, newRole}));
            socket && socket.emit('userRoleChanged', currentConvo.id, profile.id, newRole);
            setProfile({
                ...profile,
                role: newRole
            });
        } catch (err) {
            console.log(err);
            return;
        }
    }, [conversationsApi, currentConvo, profile, socket]);

    const handleMessage = useCallback(async () => {
        if (!user || !profile) return;
        const participants = [
            profile,
            {
                displayName: user.displayName || user.handle || user.email,
                id: user.id || 'test',
                handle: user.handle,
                avatar: user.avatar,
                notifications: 'all',
            } as UserConversationProfile
        ];
        const keys = await getNewConversationKeys(participants);
        const secretKey = keys?.keyPair.secretKey;
        const encodedSecretKey = keys?.encodedKeyPair.secretKey;
        const publicKey = keys?.encodedKeyPair.publicKey;
        const recipientKeyMap = keys?.encryptedKeysForUsers;

        const seedConvo: Conversation = {
            id: uuid.v4() as string,
            settings: {},
            participants,
            name: 'Private Message',
            group: false,
            avatar: profile.avatar,
            messages: [],
            publicKey
        };
        dispatch(openPrivateMessage(seedConvo, user.id, userConversations, conversationsApi, recipientKeyMap, secretKey));
        if (secretKey && encodedSecretKey && !findPrivateMessageIdForUser(profile, userConversations)) {
            await handleNewConversationKey(seedConvo.id, secretKey);
        }
        handleClose();
        navToMessages && navToMessages();
        return;
    }, [userConversations, user, conversationsApi, profile]);

    const AdminBadge = () => <Box px='12px' py='3px' bgColor='#f1f1f1' borderRadius='6px' mt='12px' >
        <Text color='black' fontSize='xs'fontWeight='bold'>
            ADMIN
        </Text>
    </Box>;

    return <Modal isOpen={isOpen} onClose={handleClose} size='lg'>
        <Modal.Content borderRadius='24px' shadow='9' style={{shadowOpacity: 0.12}} p='24px' bgColor={colors.card[theme]}>
            <Modal.CloseButton />
            <Center w='100%' py='24px'>
                {getModalProfileImage()}
                {
                    (profile.role && profile.role === 'admin') &&
                    <AdminBadge />
                }
                <Heading mt='18px' color={colors.textMainNB[theme]}>
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
                <UIButton 
                    context='primary' 
                    w='100%' 
                    borderRadius='24px' 
                    mb='6px'
                    leftIconProps={{
                        as: Feather,
                        name: 'message-circle'
                    }}
                    onPress={handleMessage}
                >
                    Message
                </UIButton>
            }
            {
                showToggleAdminButton &&
                <UIButton context='secondary' w='100%' borderRadius='24px' mb='6px' leftIcon={<Icon as={FontAwesome5} name={profile.role === 'admin' ? 'user': 'user-ninja'} />} onPress={handleToggleAdminStatus}>
                    {
                        profile.role === 'admin' ?
                        'Remove admin status' :
                        'Make group admin'
                    }
                </UIButton>
            }
            {
                handleRemove && permissionToRemove &&
                <UIButton context='ghost' w='100%' borderRadius='24px' mb='12px' onPress={handleRemove} textProps={{
                    color: 'red.500'
                }}>
                    {/* <Text color='red.500'> */}
                    Remove from group
                    {/* </Text> */}
                </UIButton>
            }
        </Modal.Content>
    </Modal>
}