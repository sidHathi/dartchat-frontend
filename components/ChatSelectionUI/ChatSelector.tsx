import React, { useContext, useState } from "react";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { Heading, VStack, Text, Box, Spinner, ScrollView } from "native-base";

import ChatPreview from "./ChatPreview";
import { ConversationPreview } from "../../types/types";
import useRequest from "../../requests/useRequest";
import IconButton from "../generics/IconButton";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated from "react-native-reanimated";
import { TouchableOpacity } from "react-native-gesture-handler";
import ConfirmationModal from "../generics/ConfirmationModal";
import ConversationsContext from "../../contexts/ConversationsContext";
import SocketContext from "../../contexts/SocketContext";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { deleteConversation, readConversationMessages, userConversationsSelector } from "../../redux/slices/userConversationsSlice";
import { updateUserConversations } from "../../utils/identityUtils";
import { parseConversation } from "../../utils/requestUtils";
import { pullConversation, setConvo } from "../../redux/slices/chatSlice";
import NetworkContext from "../../contexts/NetworkContext";

export default function ChatSelector({openChat}: {openChat: () => void}): JSX.Element {
    const { socket } = useContext(SocketContext);
    const { user } = useContext(AuthIdentityContext);
    const { networkConnected } = useContext(NetworkContext);
    const { userConversations } = useAppSelector(userConversationsSelector);
    const { deleteConversation: socketDelete } = useContext(ConversationsContext);
    const { conversationsApi, usersApi } = useRequest();
    const dispatch = useAppDispatch();

    const [dcModalOpan, setDcModalOpen] = useState(false);
    const [upForDelete, setUpForDelete] = useState<undefined | ConversationPreview>();
    const [deleteLoadingId, setDeleteLoadingId] = useState<string | undefined>();

    if (!user || userConversations.length === 0) {
        return <>
        </>
    }

    const handleSelect = (chat: ConversationPreview) => {
        if (!networkConnected) return;
        dispatch(pullConversation(chat.cid, conversationsApi));
        dispatch(readConversationMessages(chat.cid));
        if (socket) {
            socket.emit("messagesRead", chat.cid);
            dispatch(readConversationMessages(chat.cid));
        }
        openChat();
    }

    const handleDelete = async (chat: ConversationPreview | undefined) => {
        if (!chat || !user || !user.conversations) return;
        try {
            setDeleteLoadingId(chat.cid);
            // await conversationsApi.deleteConversation(chat.cid);
            dispatch(deleteConversation(chat.cid));
            socketDelete(chat.cid);
            setDeleteLoadingId(undefined);
        } catch (err) {
            setDeleteLoadingId(undefined);
            console.log(err);
        }
    };

    const closeModal = () => setDcModalOpen(false);

    const modalConfirm = () => {
        setDcModalOpen(false);
        handleDelete(upForDelete);
    }

    const openConfirmModal = (chat: ConversationPreview) => {
        setUpForDelete(chat);
        setDcModalOpen(true);
    }

    const DeleteButton = (chat: ConversationPreview) => 
        <Animated.View>
            <TouchableOpacity 
                activeOpacity={0.5}
                onPress={() => openConfirmModal(chat)} 
                style={{
                    margin: 'auto',
                    height: '100%'
                }}>
                <Box pr='18px' pl='6px' m='auto'>
                    <Box m='auto' w='50px' bgColor='#f5f5f5' borderRadius='30px' h='50px' display='flex' pt='10px' shadow='0'>
                        {
                            !(deleteLoadingId && chat.cid === deleteLoadingId) ?
                            <IconButton label='delete' size={30} color='salmon' shadow='none' additionalProps={{margin: 'auto'}}/> :
                            <Spinner color='black' />
                        }
                    </Box>
                </Box>
            </TouchableOpacity>
        </Animated.View>

    return <ScrollView style={{flex: 1}}>
        <VStack space={3} py='24px'>
            {/* <Heading fontSize='xl'>Chats</Heading> */}
            {
                [...userConversations].sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()).map((chat) =>
                    <Swipeable
                        key={chat.cid}
                        renderRightActions={() => DeleteButton(chat)}>
                        <ChatPreview 
                            key={chat.cid} 
                            chat={chat}
                            onSelect={() => handleSelect(chat)}
                        />
                    </Swipeable>
                )
            }
        </VStack>
        <ConfirmationModal
            isOpen={dcModalOpan}
            onClose={closeModal}
            onConfirm={modalConfirm}
            title='Confirm Deletion'
            content='This action cannot be reversed'
            size='md'
        />
    </ScrollView>
}