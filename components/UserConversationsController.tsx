import React, { useState, useContext, useEffect, PropsWithChildren, ReactNode, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import SocketContext from '../contexts/SocketContext';
import AuthIdentityContext from '../contexts/AuthIdentityContext';
import { ChatRole, Conversation, ConversationPreview, DecryptedMessage, SocketEvent, UserConversationProfile } from '../types/types';
import { SocketMessage } from '../types/rawTypes';
import UIContext from '../contexts/UIContext';
import { parseSocketMessage } from '../utils/requestUtils';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { chatSelector, receiveNewMessage, exitConvo, receiveNewLike, pullConversationDetails, handleAddUsers, handleRemoveUser, handleMessageDelivered, setCCPublicKey, setSecretKey, handleMessageDelete, updateUserRole, handleNewMessageDisappearTime } from '../redux/slices/chatSlice';
import { addConversation, userDataSelector, handleNewMessage, deleteConversation as reduxDelete, handleConversationDelete, pullLatestPreviews, setPublicKey, handleRoleUpdate, setConversations } from '../redux/slices/userDataSlice';
import useRequest from '../requests/useRequest';
import { getUserData, updateUserConversations } from '../utils/identityUtils';
import { autoGenGroupAvatar, constructNewConvo } from '../utils/messagingUtils';
import UserSecretsContext from '../contexts/UserSecretsContext';
import NetworkContext from '../contexts/NetworkContext';
import LogContext from '../contexts/LogContext';

export default function UserConversationsController({
    children
}: PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const { socket, disconnected: socketDisconnected } = useContext(SocketContext);
    const { logError, logEncryptionFailure } = useContext(LogContext);
    const { navSwitch } = useContext(UIContext);
    const { apiReachable } = useContext(NetworkContext);
    const { secrets, handleNewEncryptedConversation, forgetConversationKeys, pullUserSecrets } = useContext(UserSecretsContext);
    const { user } = useContext(AuthIdentityContext);
    const dispatch = useAppDispatch();
    const { userConversations, needsServerSync } = useAppSelector(userDataSelector);
    const { currentConvo }: {currentConvo?: Conversation} = useAppSelector(chatSelector);
    const { conversationsApi, usersApi } = useRequest();

    const [ccid, setCcid] = useState('');
    const [receivedEvents, setReceivedEvents] = useState<Set<string>>(new Set<string>());

    const convoDelete = useCallback((cid: string) => {
        dispatch(handleConversationDelete(cid, conversationsApi));
    }, [conversationsApi]);

    useEffect(() => {
        const pullUser = async () => {
            if (apiReachable) {
                const userData = await getUserData(usersApi);
                if (userData && userData.conversations) {
                    dispatch(setConversations(userData?.conversations));
                }
            }
        }
        pullUser();
    }, [apiReachable, socketDisconnected]);

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
            }
            await pullUserSecrets();
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
            try {
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
            } catch (err) {
                logError(err);
            }
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
                logError(err);
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
        if (!socket || !user) return;
        socket.on('newConversationUsers', async (cid: string, profiles: UserConversationProfile[], keyMap?: { [id: string]: string }) => {
            try {
                if (currentConvo && currentConvo.id === cid) {
                    dispatch(handleAddUsers(profiles));
                }
                const convo = await conversationsApi.getConversationInfo(cid);
                // let secretKey: Uint8Array | undefined;
                if (keyMap && user.id in keyMap &&  convo.publicKey) {
                    await handleNewEncryptedConversation(convo.id, keyMap[user.id], convo.publicKey);
                }
                dispatch(pullLatestPreviews(usersApi));
            } catch (err) {
                logError(err);
                console.log(err);
            }
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
        if (!socket || !user) return;
        socket.on('keyChange', async (cid: string, newPublicKey: string, userKeyMap: { [id: string]: string }) => {
            try {
                if (cid === currentConvo?.id) {
                    if (newPublicKey === currentConvo.publicKey) return;
                    dispatch(setCCPublicKey(newPublicKey));
                }
                const updatedConvo = await conversationsApi.getConversationInfo(cid);
                if (userKeyMap && user.id in userKeyMap && updatedConvo.publicKey) {
                    await handleNewEncryptedConversation(updatedConvo.id, userKeyMap[user.id], updatedConvo.publicKey);
                    await pullUserSecrets();
                } else {
                    logEncryptionFailure('keyChange socket event failure - user id not found in new key map');
                }
            } catch (err) {
                logError(err);
                console.log(err);
            }
        });

        return () => {
            socket.off('keyChange');
        }
    }, [socket, currentConvo, user, handleNewEncryptedConversation]);

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

    useEffect(() => {
        if (!socket) return;
        socket.on('messageDisappearTimeChanged', (cid: string, newTime: number | null) => {
            if (cid === currentConvo?.id) {
                dispatch(handleNewMessageDisappearTime(newTime));
            }
        });

        return () => {
            socket.off('messageDisappearTimeChanged');
        }
    }, [socket, currentConvo]);

    return <>
        {children}
    </>;
}
