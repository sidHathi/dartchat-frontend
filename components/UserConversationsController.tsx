import React, { useState, useContext, useEffect, PropsWithChildren, ReactNode } from 'react';
import ConversationsContext from '../contexts/ConverstionsContext';
import { Socket } from 'socket.io-client';
import SocketContext from '../contexts/SocketContext';
import AuthIdentityContext from '../contexts/AuthIdentityContext';
import { Conversation, ConversationPreview, SocketEvent } from '../types/types';
import { SocketMessage } from '../types/rawTypes';
import CurrentConversationContext from '../contexts/CurrentConversationContext';
import UIContext from '../contexts/UIContext';
import { parseSocketMessage } from '../utils/requestUtils';

export default function UserConversationsController({
    children
}: PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const { socket } = useContext(SocketContext);
    const { navSwitch } = useContext(UIContext);
    const { user, modifyUser } = useContext(AuthIdentityContext);
    const { currentConvo, receiveNewMessage, exitConvo, receiveNewLike } = useContext(CurrentConversationContext);
    const [ccid, setCcid] = useState('');
    const [receivedEvents, setReceivedEvents] = useState<Set<string>>(new Set<string>());
    const [receivedMessages, setReceivedMessages] = useState<Set<string>>(new Set<string>());

    useEffect(() => {
        if (currentConvo && currentConvo.id !== ccid) {
            setCcid(currentConvo.id || '');
        }
    }, [currentConvo])

    useEffect(() => {
        if (!socket) return;

        socket.on('newConversation', (newConvo: Conversation) => {
            console.log('new conversation message received!');
            if (user && user.conversations && user.conversations.map(c => c.cid).includes(newConvo.id)) return;
            const lastMessage = newConvo.messages.length > 0 ? newConvo.messages[newConvo.messages.length - 1] : undefined;
            const preview: ConversationPreview = {
                cid: newConvo.id,
                name: newConvo.name,
                avatar: newConvo.avatar,
                lastMessageContent: lastMessage ? lastMessage.content : '',
                unSeenMessages: 0,
                lastMessageTime: lastMessage ? lastMessage?.timestamp : new Date()
            };
            if (user) {
                const currConvos: ConversationPreview[] = user.conversations || [];
                modifyUser({
                    ...user,
                    conversations: [preview, ...currConvos]
                })
                .then(() => {
                    console.log('joining new conversation room ' + [newConvo.id]);
                    socket.emit('joinRoom', [newConvo.id]);
                })
                .catch((err) => {
                    console.log(err);
                });
            }
        });
        if (user?.conversations) {
            socket.emit('joinRoom', user.conversations.map(c => c.cid));
        }
    }, [socket, user]);

    // TODO: move a lot of this logic into another file
    useEffect(() => {
        if (!socket || !user) return;
        if (user.conversations) socket.emit('joinRoom', user.conversations.map(c => c.cid));
        // let receivedMessages = new Set<string>();
        socket.on('newMessage', async (cid: string, newMessage: SocketMessage) => {
            if (receivedMessages.has(newMessage.id)) return;
            const message = parseSocketMessage(newMessage);

            const messageForCurrent: boolean = currentConvo !== undefined && currentConvo.id === cid && currentConvo.messages.filter(m => m.id === message.id).length < 1;
            console.log(messageForCurrent);
            if (messageForCurrent) {
                console.log('adding message to ccContext');
                console.log(message);
                receiveNewMessage(message);
                setReceivedMessages(receivedMessages.add(newMessage.id));
            } 

            if (user.conversations) {
                const matchingPreviews = user.conversations?.filter((c) => 
                    c.cid === cid
                );
                if (matchingPreviews && matchingPreviews.length > 0) {
                    console.log('modifying user conversations')
                    const convoToUpdate: ConversationPreview = matchingPreviews[0];
                    const updatedConvo = {
                        ...convoToUpdate,
                        unSeenMessages: messageForCurrent ? 0 : convoToUpdate.unSeenMessages + 1,
                        lastMessageContent: message.content,
                        lastMessageTime: message.timestamp
                    };
                    modifyUser({
                        ...user,
                        conversations: [
                            updatedConvo,
                            ...user.conversations.filter(c => c.cid !== cid),
                        ]
                    })
                    .catch(err => {console.log(err)});
                }
            }
        });
        socket.on('deleteConversation', async (cid: string) => {
            if (!user) return;
            try {
                await modifyUser({
                    ...user,
                    conversations: user.conversations?.filter(c => c.cid !== cid)
                });
                exitConvo();
                navSwitch('conversations');
            } catch (err) {
                console.log(err);
            }
        })
    }, [currentConvo]);

    useEffect(() => {
        if (!socket) return;
        socket.on('newLikeEvent', (cid: string, mid: string, uid: string, event: SocketEvent) => {
            console.log(event);
            console.log(receivedEvents);
            console.log(currentConvo?.id);
            console.log(mid);
            if (receivedEvents.has(event.id) || currentConvo?.id !== cid) return;
            setReceivedEvents(receivedEvents.add(event.id));
            console.log('new like received');
            receiveNewLike(mid, uid, event);
        });
    }, [currentConvo, receivedEvents]);

    const createNewConversation = (newConvo: Conversation) => {
        if (socket && user) {
            socket.emit('newConversation', newConvo);
            modifyUser({
                ...user,
                conversations: [
                    {
                        cid: newConvo.id,
                        name: newConvo.name,
                        avatar: newConvo.avatar,
                        lastMessageContent: '',
                        unSeenMessages: 0,
                        lastMessageTime: new Date()
                    },
                    ...(user.conversations || [])
                ]
            }).catch(err => {
                console.log(err);
            })
        }
        return;
    }

    const deleteConversation = (conversationId: string) => {
        if (socket) {
            socket.emit('deleteConversation', conversationId);
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