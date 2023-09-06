import React, { useCallback, useContext, useMemo, useState, useEffect } from "react";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { Pressable, VStack, Text, Box, Spinner, ScrollView, FlatList, Icon, Input, Center } from "native-base";

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
import { deleteConversation, handleUserConvoLeave, pullLatestPreviews, readConversationMessages, userDataSelector } from "../../redux/slices/userDataSlice";
import { buildDefaultProfileForUser, updateUserConversations } from "../../utils/identityUtils";
import { parseConversation } from "../../utils/requestUtils";
import { chatSelector, leaveChat, pullConversation, setConvo } from "../../redux/slices/chatSlice";
import NetworkContext from "../../contexts/NetworkContext";
import UserSecretsContext from "../../contexts/UserSecretsContext";
import LeaveChatScreen from "../ChatSettingsUI/LeaveChatScreen";
import notifee from '@notifee/react-native';
import { Ionicons } from "@expo/vector-icons";
import { Keyboard } from "react-native";
import { getBackgroundUpdateFlag, setBackgroundUpdateFlag } from "../../localStore/localStore";

export default function ChatSelector({
    openChat,
    closeChat
}: {
    openChat: () => void;
    closeChat: () => void;
}): JSX.Element {
    const { socket, resetSocket, disconnected: socketDisconnected } = useContext(SocketContext);
    const { user } = useContext(AuthIdentityContext);
    const { networkConnected } = useContext(NetworkContext);
    const { secrets, pullUserSecrets } = useContext(UserSecretsContext);
    const { userConversations } = useAppSelector(userDataSelector);
    const { requestLoading } = useAppSelector(chatSelector);
    const { conversationsApi, usersApi } = useRequest();
    const dispatch = useAppDispatch();

    const [dcModalOpen, setDcModalOpen] = useState(false);
    const [upForDelete, setUpForDelete] = useState<undefined | ConversationPreview>();
    const [deleteLoadingId, setDeleteLoadingId] = useState<string | undefined>();
    const [upForLeave, setUpForLeave] = useState<ConversationPreview | undefined>();
    const [confirmLeaveModalOpen, setConfirmLeaveModalOpen] = useState(false);
    const [searchString, setSearchString] = useState<string | undefined>();

    useEffect(() => {
        if (!socket || socketDisconnected) {
            resetSocket();
        }
        const refreshIfNeeded = async () => {
            if (await getBackgroundUpdateFlag()) {
                dispatch(pullLatestPreviews(usersApi));
                await setBackgroundUpdateFlag(false);
            }
        }
        refreshIfNeeded();
    }, []);

    useEffect(() => {
        const unreads = userConversations.reduce((acc, preview) => {
            return acc + preview.unSeenMessages;
        }, 0);
        if (unreads && !isNaN(unreads)) {
            notifee.setBadgeCount(unreads);
        } else {
            notifee.setBadgeCount(0);
        }
    }, [userConversations]);

    const handleSelect = useCallback(async (chat: ConversationPreview) => {
        if (!networkConnected) return;
        if (!socket || socketDisconnected) {
            resetSocket();
        }
        
        let secretKey = (secrets && chat.cid in secrets) ? secrets[chat.cid] : undefined;
        try {
            if (!secretKey) {
                await pullUserSecrets();
                secretKey = (secrets && chat.cid in secrets) ? secrets[chat.cid] : undefined;
            } 
        } catch (err) {
            console.log(err);
        }
        dispatch(pullConversation(chat.cid, conversationsApi, secretKey, undefined, () => {
            closeChat();
        }));
        dispatch(readConversationMessages(chat.cid));
        if (socket) {
            socket.emit('messagesRead', chat.cid);
        }
        openChat();
    }, [secrets, socket, resetSocket, socketDisconnected]);

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

    const closeModal = () => {
        setDcModalOpen(false);
        setUpForDelete(undefined);
    };

    const deleteConfirm = () => {
        setDcModalOpen(false);
        handleDelete(upForDelete);
    };

    const openDeleteConfirmModal = (chat: ConversationPreview) => {
        setUpForDelete(chat);
        setDcModalOpen(true);
    };

    const openLeaveConfirmModal = (chat: ConversationPreview) => {
        setUpForLeave(chat);
        setConfirmLeaveModalOpen(true);
    };

    const sortedConversations = useMemo(() => {
        return [...userConversations].sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime())
    }, [userConversations]);

    const searchFilteredConversations = useMemo(() => {
        if (!searchString) return sortedConversations;
        return sortedConversations.filter((c) => {
            if (c.name.toLocaleLowerCase().includes(searchString.toLocaleLowerCase())) {
                return true;
            }
            return false;
        });
    }, [sortedConversations, searchString]);

    const RightButton = (chat: ConversationPreview) => 
        <Animated.View>
            <Pressable onPress={() => {
                !(chat.group === undefined || chat.group) ? openDeleteConfirmModal(chat) : openLeaveConfirmModal(chat);
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
                            <IconButton label={chat.group === undefined || chat.group ? 'leave' : 'delete'} size={30} color='salmon' shadow='none' additionalProps={{margin: 'auto'}}/> :
                            <Spinner color='black' />
                        }
                    </Box>
                </Box>
            </TouchableOpacity>
            </Pressable>
        </Animated.View>

    if (!user || userConversations.length === 0) {
        return <Center h='100%'>
            <Text color='gray.500' mt='-60px'>
                Create a new chat to get started
            </Text>
        </Center>;
    }

    const renderListItem = ({item}: {item: ConversationPreview}) => {
        if (!item.cid) return <></>;
        return <Swipeable
            key={item.cid}
            renderRightActions={() => RightButton(item)}
            containerStyle={{overflow: 'visible'}}>
            <ChatPreview 
                key={item.cid} 
                chat={item}
                onSelect={() => handleSelect(item)}
            />
        </Swipeable>
    };

    return <>
        <Box w='100%' px='12px' pt='12px' pb='6px' mt='3px' zIndex='0' borderRadius='full'>
            <Input 
                value={searchString}
                size='md'
                placeholder="Search" 
                variant="filled" 
                borderRadius="full" 
                py="2" 
                px="2"
                InputLeftElement={
                    <Icon ml="3" size="4" color="gray.400" as={<Ionicons name="ios-search" />} />
                } 
                onChangeText={setSearchString}
                />
        </Box>
        {
            searchFilteredConversations.length < 1 &&
            <Pressable onPress={() => Keyboard.dismiss()}>
                <Center h='500px'>
                    <Text color='gray.500'>
                        No matching conversations found
                    </Text>
                </Center>
            </Pressable>
        }
        <FlatList
            data={searchFilteredConversations}
            renderItem={renderListItem}
            ItemSeparatorComponent={(() => <Box h='12px' />)}
            ListHeaderComponent={<Box h='6px' />}
            ListFooterComponent={<Box h='100px' />}
            zIndex='1'
        />

        {upForDelete &&
            <ConfirmationModal
                isOpen={dcModalOpen}
                onClose={closeModal}
                onConfirm={deleteConfirm}
                title='Confirm Deletion'
                content='This action cannot be reversed'
                size='lg'
            />
        }

        {/* <ConfirmationModal
            isOpen={confirmLeaveModalOpen}
            onClose={() => setConfirmLeaveModalOpen(false)}
            onConfirm={handleLeaveChat}
            title='Confirm Leave'
            content={`You will no longer be a member of "${upForLeave?.name}" if you select confirm.`}
            size='md'
        /> */}
        {
            upForLeave && 
            <LeaveChatScreen
                cid={upForLeave.cid}
                isOpen={confirmLeaveModalOpen}
                onClose={() => {
                    setConfirmLeaveModalOpen(false)
                    setUpForLeave(undefined)
                }}
                />
        }


    </>
}