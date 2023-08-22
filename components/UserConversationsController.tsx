import React, { useState, useContext, useEffect, PropsWithChildren, ReactNode, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import SocketContext from '../contexts/SocketContext';
import AuthIdentityContext from '../contexts/AuthIdentityContext';
import { ChatRole, Conversation, ConversationPreview, DecryptedMessage, SocketEvent, UserConversationProfile } from '../types/types';
import { SocketMessage } from '../types/rawTypes';
import UIContext from '../contexts/UIContext';
import { parseSocketMessage } from '../utils/requestUtils';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { chatSelector, receiveNewMessage, exitConvo, receiveNewLike, pullConversationDetails, handleAddUsers, handleRemoveUser, handleMessageDelivered, setCCPublicKey, setSecretKey, handleMessageDelete, updateUserRole } from '../redux/slices/chatSlice';
import { addConversation, userDataSelector, handleNewMessage, deleteConversation as reduxDelete, handleConversationDelete, pullLatestPreviews, setPublicKey, handleRoleUpdate } from '../redux/slices/userDataSlice';
import useRequest from '../requests/useRequest';
import { updateUserConversations } from '../utils/identityUtils';
import { autoGenGroupAvatar, constructNewConvo } from '../utils/messagingUtils';
import UserSecretsContext from '../contexts/UserSecretsContext';

export default function UserConversationsController({
    children
}: PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const { socket } = useContext(SocketContext);
    const { navSwitch } = useContext(UIContext);
    const { secrets, handleNewEncryptedConversation, forgetConversationKeys } = useContext(UserSecretsContext);
    const { user } = useContext(AuthIdentityContext);
    const dispatch = useAppDispatch();
    const { userConversations, needsServerSync }: {userConversations: ConversationPreview[], needsServerSync: boolean} = useAppSelector(userDataSelector);
    const { currentConvo }: {currentConvo?: Conversation} = useAppSelector(chatSelector);
    const { conversationsApi, usersApi } = useRequest();

    const [ccid, setCcid] = useState('');
    const [receivedEvents, setReceivedEvents] = useState<Set<string>>(new Set<string>());

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
        socket.on('newConversation', async (newConvo: Conversation, keyMap?: { [id: string]: string }) => {
            // console.log('new conversation message received!');
            if (userConversations.map(c => c.cid).includes(newConvo.id)) return; 
            const completedConvo = await constructNewConvo(newConvo, user);
            let secretKey: Uint8Array | undefined = undefined;
            if (keyMap && user.id in keyMap &&  completedConvo.publicKey) {
                secretKey = await handleNewEncryptedConversation(completedConvo.id, keyMap[user.id], completedConvo.publicKey);
                console.log('newConvo secret key added');
                console.log(completedConvo);
            }
            dispatch(addConversation({
                newConvo: completedConvo,
                uid: user.id,
                secretKey
            }));
            socket.emit('joinRoom', userConversations.map(c => c.cid));
        });

        return () => {
            socket.off('newConversation');
        }
    }, [userConversations, socket, user]);

    useEffect(() => {
        if (socket) socket.emit('joinRoom', userConversations.map(c => c.cid));
    }, [userConversations, socket]);

    useEffect(() => {
        if (!socket || !user) return;
        socket.emit('joinRoom', userConversations.map(c => c.cid));
        socket.on('newMessage', async (cid: string, newMessage: SocketMessage) => {
            const message = parseSocketMessage(newMessage) as DecryptedMessage;

            const messageForCurrent: boolean = message.senderId === user?.id ||(currentConvo !== undefined && currentConvo.id === cid && currentConvo.messages.filter(m => m.id === message.id).length < 1);
            // console.log(messageForCurrent);
            if (messageForCurrent) {
                socket.emit('messagesRead', currentConvo?.id);
                dispatch(receiveNewMessage({message, cid}));
            }
            const secretKey = secrets ? secrets[cid] : undefined;

            dispatch(handleNewMessage({
                cid,
                message,
                messageForCurrent,
                secretKey
            }));
        });

        return () => {
            socket.off('newMessage');
        }
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
                forgetConversationKeys(cid);
            } catch (err) {
                console.log(err);
            }
        });

        return () => {
            socket.off('deleteConversation');
        }
    }, [currentConvo, user]);

    useEffect(() => {
        if (!socket) return;
        socket.on('newLikeEvent', (cid: string, mid: string, uid: string, event: SocketEvent) => {
            if (receivedEvents.has(event.id) || currentConvo?.id !== cid) return;
            setReceivedEvents(receivedEvents.add(event.id));
            // console.log('new like received');
            dispatch(receiveNewLike({
                messageId: mid,
                userId: uid,
                event
            }));
        });

        return () => {
            socket.off('newLikeEvent');
        }
    }, [currentConvo, socket]);

    useEffect(() => {
        if (!socket) return;
        socket.on('updateConversationDetails', (cid) => {
            if (currentConvo && currentConvo.id === cid) {
                dispatch(pullConversationDetails(conversationsApi));
            }
            dispatch(pullLatestPreviews(usersApi));
        });

        return () => {
            socket.off('updateConversationDetails');
        }
    }, [socket, currentConvo]);

    useEffect(() => {
        if (!socket) return;
        socket.on('newConversationUsers', (cid: string, profiles: UserConversationProfile[]) => {
            if (currentConvo && currentConvo.id === cid) {
                dispatch(handleAddUsers(profiles));
            }
            dispatch(pullLatestPreviews(usersApi));
        });

        return () => {
            socket.off('newConversationUsers');
        }
    }, [socket, currentConvo]);

    useEffect(() => {
        if (!socket) return;
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
        });

        return () => {
            socket.off('removeConversationUser');
        }
    }, [socket, currentConvo]);

    useEffect(() => {
        if (!socket || !currentConvo) return;
        socket.on('messageDelivered', (cid: string, mid: string) => {
            if (cid === currentConvo.id) {
                dispatch(handleMessageDelivered(mid))
            }
        });

        return () => {
            socket.off('messageDelivered');
        }
    }, [socket, currentConvo]);

    useEffect(() => {
        if (!socket || !currentConvo) return;
        socket.on('keyChange', async (cid: string, newPublicKey: string, encryptedKey: string) => {
            console.log('key change received');
            if (cid === currentConvo.id) {
                if (newPublicKey === currentConvo.publicKey) return;
                dispatch(setCCPublicKey(newPublicKey));
            }
            console.log(newPublicKey);
            await handleNewEncryptedConversation(cid, encryptedKey, newPublicKey);
        });

        return () => {
            socket.off('keyChange');
        }
    }, [socket, currentConvo]);

    useEffect(() => {
        if (!socket || !currentConvo) return;
        socket.on('deleteMessage', (cid: string, mid: string) => {
            if (cid === currentConvo.id) {
                dispatch(handleMessageDelete(mid))
            }
        });

        return () => {
            socket.off('deleteMessage');
        }
    }, [socket, currentConvo]);

    useEffect(() => {
        if (!socket) return;
        socket.on('userRoleChanged', (cid: string, uid: string, newRole: ChatRole) => {
            console.log('user role change message received');
            if (cid === currentConvo?.id) {
                dispatch(updateUserRole({uid, newRole}));
            }
            if (uid === user?.id) {
                dispatch(handleRoleUpdate({cid, newRole}));
            }
        });

        return () => {
            socket.off('userRoleChanged');
        }
    }, [socket, currentConvo, user]);

    return <>
        {children}
    </>;
}
