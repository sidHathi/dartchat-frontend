import React, { useState, useContext, useEffect, PropsWithChildren, ReactNode, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import SocketContext from '../contexts/SocketContext';
import AuthIdentityContext from '../contexts/AuthIdentityContext';
import { Conversation, ConversationPreview, DecryptedMessage, SocketEvent, UserConversationProfile } from '../types/types';
import { SocketMessage } from '../types/rawTypes';
import UIContext from '../contexts/UIContext';
import { parseSocketMessage } from '../utils/requestUtils';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { chatSelector, receiveNewMessage, exitConvo, receiveNewLike, pullConversationDetails, handleAddUsers, handleRemoveUser, handleMessageDelivered, setCCPublicKey, setSecretKey } from '../redux/slices/chatSlice';
import { addConversation, userDataSelector, handleNewMessage, deleteConversation as reduxDelete, handleConversationDelete, pullLatestPreviews, setPublicKey } from '../redux/slices/userDataSlice';
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
        socket.on('newConversation', async (newConvo: Conversation, encryptedSecretKey?: string) => {
            // console.log('new conversation message received!');
            if (userConversations.map(c => c.cid).includes(newConvo.id)) return; 
            const completedConvo = await constructNewConvo(newConvo, user);
            let secretKey: Uint8Array | undefined = undefined;
            if (encryptedSecretKey && completedConvo.publicKey) {
                console.log(encryptedSecretKey);
                secretKey = await handleNewEncryptedConversation(completedConvo.id, encryptedSecretKey, completedConvo.publicKey);
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
        })
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

    useEffect(() => {
        if (!socket || !currentConvo) return;
        socket.on('messageDelivered', (cid: string, mid: string) => {
            if (cid === currentConvo.id) {
                dispatch(handleMessageDelivered(mid))
            }
        });
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
    }, [socket, currentConvo]);

    return <>
        {children}
    </>;
}