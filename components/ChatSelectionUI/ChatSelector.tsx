import React, { useCallback, useContext, useState } from "react";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { Pressable, VStack, Text, Box, Spinner, ScrollView } from "native-base";

import ChatPreview from "./ChatPreview";
import { ConversationPreview } from "../../types/types";
import useRequest from "../../requests/useRequest";
import IconButton from "../generics/IconButton";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated from "react-native-reanimated";
import { TouchableOpacity } from "react-native-gesture-handler";
import ConfirmationModal from "../generics/ConfirmationModal";
import SocketContext from "../../contexts/SocketContext";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { deleteConversation, handleUserConvoLeave, readConversationMessages, userDataSelector } from "../../redux/slices/userDataSlice";
import { buildDefaultProfileForUser, updateUserConversations } from "../../utils/identityUtils";
import { parseConversation } from "../../utils/requestUtils";
import { chatSelector, leaveChat, pullConversation, setConvo } from "../../redux/slices/chatSlice";
import NetworkContext from "../../contexts/NetworkContext";
import UserSecretsContext from "../../contexts/UserSecretsContext";

export default function ChatSelector({
    openChat,
    closeChat
}: {
    openChat: () => void;
    closeChat: () => void;
}): JSX.Element {
    const { socket } = useContext(SocketContext);
    const { user } = useContext(AuthIdentityContext);
    const { networkConnected } = useContext(NetworkContext);
    const { secrets } = useContext(UserSecretsContext);
    const { userConversations } = useAppSelector(userDataSelector);
    const { requestLoading } = useAppSelector(chatSelector);
    const { conversationsApi, usersApi } = useRequest();
    const dispatch = useAppDispatch();

    const [dcModalOpen, setDcModalOpen] = useState(false);
    const [upForDelete, setUpForDelete] = useState<undefined | ConversationPreview>();
    const [deleteLoadingId, setDeleteLoadingId] = useState<string | undefined>();
    const [upForLeave, setUpForLeave] = useState<ConversationPreview | undefined>();
    const [confirmLeaveModalOpen, setConfirmLeaveModalOpen] = useState(false);


    const handleSelect = useCallback((chat: ConversationPreview) => {
        if (!networkConnected) return;
        
        const secretKey = (secrets && chat.cid in secrets) ? secrets[chat.cid] : undefined;
        dispatch(pullConversation(chat.cid, conversationsApi, secretKey, undefined, () => {
            closeChat();
        }));
        dispatch(readConversationMessages(chat.cid));
        if (socket) {
            socket.emit("messagesRead", chat.cid);
        }
        openChat();
    }, [secrets]);

    const handleDelete = async (chat: ConversationPreview | undefined) => {
        if (!chat || !user || !user.conversations) return;
        try {
            setDeleteLoadingId(chat.cid);
            // await conversationsApi.deleteConversation(chat.cid);
            dispatch(deleteConversation(chat.cid));
            if (socket) {
                socket.emit('deleteConversation', chat.cid);
            }
            setDeleteLoadingId(undefined);
        } catch (err) {
            setDeleteLoadingId(undefined);
            console.log(err);
        }
    };

    const handleLeaveChat = useCallback(async () => {
        if (!upForLeave || !user || !socket) return;

        try {
            await conversationsApi.leaveChat(upForLeave.cid);
            dispatch(handleUserConvoLeave(upForLeave.cid));
            socket && socket.emit('removeConversationUser', upForLeave.cid, buildDefaultProfileForUser(user));
            setConfirmLeaveModalOpen(false);
        } catch (err) {
            console.log(err);
        }
    }, [upForLeave, user, socket]);

    const closeModal = () => setDcModalOpen(false);

    const deleteConfirm = () => {
        setDcModalOpen(false);
        handleDelete(upForDelete);
    }

    const openDeleteConfirmModal = (chat: ConversationPreview) => {
        setUpForDelete(chat);
        setDcModalOpen(true);
    }

    const openLeaveConfirmModal = (chat: ConversationPreview) => {
        setUpForLeave(chat);
        setConfirmLeaveModalOpen(true);
    };

    const RightButton = (chat: ConversationPreview) => 
        <Animated.View>
            <Pressable onPress={() => {
                !chat.group ? openDeleteConfirmModal(chat) : openLeaveConfirmModal(chat);
            }}>
            <TouchableOpacity 
                activeOpacity={0.5}
                onPress={() => {
                    !chat.group ? openDeleteConfirmModal(chat) : openLeaveConfirmModal(chat);
                }}
                style={{
                    margin: 'auto',
                    height: '100%'
                }}>
                <Box pr='18px' pl='6px' m='auto'>
                    <Box m='auto' w='50px' bgColor='#f5f5f5' borderRadius='30px' h='50px' display='flex' pt='10px' shadow='0'>
                        {
                            !((deleteLoadingId && chat.cid === deleteLoadingId) || requestLoading) ?
                            <IconButton label={chat.group ? 'leave' : 'delete'} size={30} color='salmon' shadow='none' additionalProps={{margin: 'auto'}}/> :
                            <Spinner color='black' />
                        }
                    </Box>
                </Box>
            </TouchableOpacity>
            </Pressable>
        </Animated.View>

    if (!user || userConversations.length === 0) {
        return <>
        </>;
    }

    return <><ScrollView style={{flex: 1}}>
        <VStack space={3} py='24px'>
            {/* <Heading fontSize='xl'>Chats</Heading> */}
            {
                [...userConversations].sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()).map((chat) =>
                    <Swipeable
                        key={chat.cid}
                        renderRightActions={() => RightButton(chat)}>
                        <ChatPreview 
                            key={chat.cid} 
                            chat={chat}
                            onSelect={() => handleSelect(chat)}
                        />
                    </Swipeable>
                )
            }
        </VStack>
        
    </ScrollView>
        <ConfirmationModal
            isOpen={dcModalOpen}
            onClose={closeModal}
            onConfirm={deleteConfirm}
            title='Confirm Deletion'
            content='This action cannot be reversed'
            size='md'
        />

        <ConfirmationModal
            isOpen={confirmLeaveModalOpen}
            onClose={() => setConfirmLeaveModalOpen(false)}
            onConfirm={handleLeaveChat}
            title='Confirm Leave'
            content={`You will no longer be a member of "${upForLeave?.name}" if you select confirm.`}
            size='md'
        />
    </>
}