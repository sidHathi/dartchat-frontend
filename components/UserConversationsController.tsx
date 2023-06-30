import React, { useState, useContext, useEffect, PropsWithChildren, ReactNode } from 'react';
import ConversationsContext from '../contexts/ConversationsContext';
import { Socket } from 'socket.io-client';
import SocketContext from '../contexts/SocketContext';
import AuthIdentityContext from '../contexts/AuthIdentityContext';
import { Conversation, ConversationPreview, SocketEvent } from '../types/types';
import { SocketMessage } from '../types/rawTypes';
import UIContext from '../contexts/UIContext';
import { parseSocketMessage } from '../utils/requestUtils';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { chatSelector, receiveNewMessage, exitConvo, receiveNewLike } from '../redux/slices/chatSlice';
import { addConversation, userConversationsSelector, handleNewMessage, deleteConversation as reduxDelete, setNeedsServerSync } from '../redux/slices/userConversationsSlice';
import useRequest from '../requests/useRequest';
import { updateUserConversations } from '../utils/identityUtils';

export default function UserConversationsController({
    children
}: PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const { socket } = useContext(SocketContext);
    const { navSwitch } = useContext(UIContext);
    const { user } = useContext(AuthIdentityContext);
    const [ccid, setCcid] = useState('');
    const [receivedEvents, setReceivedEvents] = useState<Set<string>>(new Set<string>());
    const dispatch = useAppDispatch();
    const { userConversations, needsServerSync }: {userConversations: ConversationPreview[], needsServerSync: boolean} = useAppSelector(userConversationsSelector);
    const { currentConvo }: {currentConvo?: Conversation} = useAppSelector(chatSelector);
    const { usersApi } = useRequest();

    useEffect(() => {
        if (currentConvo && currentConvo.id !== ccid) {
            setCcid(currentConvo.id || '');
        }
    }, [currentConvo]);

    useEffect(() => {
        if (!socket || !user) return;
        socket.on('newConversation', (newConvo: Conversation) => {
            console.log('new conversation message received!');
            if (userConversations.map(c => c.cid).includes(newConvo.id)) return; 
            dispatch(addConversation(newConvo));
            socket.emit('joinRoom', userConversations.map(c => c.cid));
        });
    }, [userConversations]);

    useEffect(() => {
        if (socket) socket.emit('joinRoom', userConversations.map(c => c.cid));
        const update = async () => {
            if (user && needsServerSync) {
                try {
                    dispatch(setNeedsServerSync(false));
                    await updateUserConversations(usersApi, user, userConversations);
                } catch (err) {
                    console.log(err);
                }
            }
        }
        update();
    }, [userConversations])

    // TODO: move a lot of this logic into another file
    useEffect(() => {
        if (!socket || !user) return;
        socket.emit('joinRoom', userConversations.map(c => c.cid));
        // let receivedMessages = new Set<string>();
        socket.on('newMessage', async (cid: string, newMessage: SocketMessage) => {
            const message = parseSocketMessage(newMessage);

            if (currentConvo === undefined) {
                console.log('message received for undefined cc');
            }
            const messageForCurrent: boolean = currentConvo !== undefined && currentConvo.id === cid && currentConvo.messages.filter(m => m.id === message.id).length < 1;
            console.log(messageForCurrent);
            if (messageForCurrent) {
                dispatch(receiveNewMessage({message, cid}));
            } 

            dispatch(handleNewMessage({
                cid,
                message,
                messageForCurrent
            }));
        });
    }, [currentConvo]);

    useEffect(() => {
        if (!socket) return;
        socket.on('deleteConversation', async (cid: string) => {
            if (!user) return;
            try {
                dispatch(reduxDelete(cid) as any);
                await updateUserConversations(usersApi, user, userConversations);
                dispatch(exitConvo());
                navSwitch('conversations');
            } catch (err) {
                console.log(err);
            }
        })
    }, []);

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
    }, [currentConvo]);

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