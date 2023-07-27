import React, { useState, useContext, useEffect, PropsWithChildren, ReactNode, useCallback } from 'react';
import ConversationsContext from '../contexts/ConversationsContext';
import { Socket } from 'socket.io-client';
import SocketContext from '../contexts/SocketContext';
import AuthIdentityContext from '../contexts/AuthIdentityContext';
import { Conversation, ConversationPreview, SocketEvent, UserConversationProfile } from '../types/types';
import { SocketMessage } from '../types/rawTypes';
import UIContext from '../contexts/UIContext';
import { parseSocketMessage } from '../utils/requestUtils';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { chatSelector, receiveNewMessage, exitConvo, receiveNewLike, pullConversationDetails, handleAddUsers, handleRemoveUser } from '../redux/slices/chatSlice';
import { addConversation, userDataSelector, handleNewMessage, deleteConversation as reduxDelete, handleConversationDelete, pullLatestPreviews } from '../redux/slices/userDataSlice';
import useRequest from '../requests/useRequest';
import { updateUserConversations } from '../utils/identityUtils';
import { autoGenGroupAvatar } from '../utils/messagingUtils';

export default function UserConversationsController({
    children
}: PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const { socket } = useContext(SocketContext);
    const { navSwitch } = useContext(UIContext);
    const { user } = useContext(AuthIdentityContext);
    const [ccid, setCcid] = useState('');
    const [receivedEvents, setReceivedEvents] = useState<Set<string>>(new Set<string>());
    const dispatch = useAppDispatch();
    const { userConversations, needsServerSync }: {userConversations: ConversationPreview[], needsServerSync: boolean} = useAppSelector(userDataSelector);
    const { currentConvo }: {currentConvo?: Conversation} = useAppSelector(chatSelector);
    const { conversationsApi, usersApi } = useRequest();

    const convoDelete = useCallback((cid: string) => {
        dispatch(handleConversationDelete(cid, conversationsApi));
    }, [conversationsApi]);

    useEffect(() => {
        if (currentConvo && currentConvo.id !== ccid) {
            setCcid(currentConvo.id || '');
        }
    }, [currentConvo]);

    useEffect(() => {
        if (!socket || !user) return;
        socket.on('newConversation', async (newConvo: Conversation) => {
            console.log('new conversation message received!');
            if (userConversations.map(c => c.cid).includes(newConvo.id)) return; 
            let name = newConvo.name;
            if (!newConvo.group) {
                name = newConvo.participants.filter((p) => p.id !== user.id)[0].displayName;
            }
            dispatch(addConversation({
                newConvo: {
                    ...newConvo,
                    avatar: await autoGenGroupAvatar(newConvo.participants, user.id),
                    name
                },
                uid: user.id
            }));
            socket.emit('joinRoom', userConversations.map(c => c.cid));
        });
    }, [userConversations, socket, user]);

    useEffect(() => {
        if (socket) socket.emit('joinRoom', userConversations.map(c => c.cid));
    }, [userConversations, socket]);

    useEffect(() => {
        if (!socket || !user) return;
        socket.emit('joinRoom', userConversations.map(c => c.cid));
        socket.on('newMessage', async (cid: string, newMessage: SocketMessage) => {
            const message = parseSocketMessage(newMessage);

            const messageForCurrent: boolean = message.senderId === user?.id ||(currentConvo !== undefined && currentConvo.id === cid && currentConvo.messages.filter(m => m.id === message.id).length < 1);
            console.log(messageForCurrent);
            if (messageForCurrent) {
                socket.emit('messagesRead', currentConvo?.id);
                dispatch(receiveNewMessage({message, cid}));
            } 

            dispatch(handleNewMessage({
                cid,
                message,
                messageForCurrent
            }));
        });
    }, [currentConvo, socket, user]);

    useEffect(() => {
        if (!socket) return;
        socket.on('deleteConversation', (cid: string) => {
            if (!user) return;
            try {
                dispatch(reduxDelete(cid));
                if (currentConvo && cid === currentConvo.id) {
                    dispatch(exitConvo());
                    navSwitch('conversations');
                }
            } catch (err) {
                console.log(err);
            }
        })
    }, [currentConvo, user]);

    useEffect(() => {
        if (!socket) return;
        socket.on('newLikeEvent', (cid: string, mid: string, uid: string, event: SocketEvent) => {
            if (receivedEvents.has(event.id) || currentConvo?.id !== cid) return;
            setReceivedEvents(receivedEvents.add(event.id));
            console.log('new like received');
            dispatch(receiveNewLike({
                messageId: mid,
                userId: uid,
                event
            }));
        });
    }, [currentConvo, socket]);

    useEffect(() => {
        if (!socket) return;
        socket.on('updateConversationDetails', (cid) => {
            if (currentConvo && currentConvo.id === cid) {
                dispatch(pullConversationDetails(conversationsApi));
            }
            dispatch(pullLatestPreviews(usersApi));
        });
    }, [socket, currentConvo]);

    useEffect(() => {
        if (!socket) return;
        socket.on('newConversationUsers', (cid: string, profiles: UserConversationProfile[]) => {
            if (currentConvo && currentConvo.id === cid) {
                dispatch(handleAddUsers(profiles));
            }
            dispatch(pullLatestPreviews(usersApi));
        });

        socket.on('removeConversationUser', (cid: string, uid: string) => {
            if (currentConvo && currentConvo.id === cid && user) {
                if (uid !== user.id) {
                    dispatch(handleRemoveUser(uid));
                } else {
                    dispatch(reduxDelete(cid));
                    dispatch(exitConvo());
                    navSwitch('conversations');
                }
            }
            dispatch(pullLatestPreviews(usersApi));
        })
    }, [socket, currentConvo]);

    const createNewConversation = (newConvo: Conversation) => {
        if (socket && user) {
            // socket.emit('newConversation', newConvo);
            // dispatch(addConversation(newConvo));
        }
        return;
    }

    const deleteConversation = (conversationId: string) => {
        if (socket) {
            socket.emit('deleteConversation', conversationId);
            dispatch(reduxDelete(conversationId));
        }
        return;
    }

    return <ConversationsContext.Provider value={{
        createNewConversation,
        deleteConversation
    }}>
        {children}
    </ConversationsContext.Provider>
}