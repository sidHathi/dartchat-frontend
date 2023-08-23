import React, { useContext, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { AppState } from 'react-native';
import useRequest from '../requests/useRequest';
import { chatSelector, handleMessageDelete, pullConversation, receiveNewLike, receiveNewMessage, setCCPublicKey, setConvo, updateUserRole } from '../redux/slices/chatSlice';
import { getUserData } from '../utils/identityUtils';
import { addConversation, handleNewMessage, handleRoleUpdate, pullLatestPreviews, setConversations, userDataSelector } from '../redux/slices/userDataSlice';
import { getBackgroundUpdateFlag, getStoredUserData, setBackgroundUpdateFlag } from '../localStore/store';
import messaging from '@react-native-firebase/messaging';
import SocketContext from '../contexts/SocketContext';
import { PNPacket } from '../types/types';
import { constructNewConvo } from '../utils/messagingUtils';
import { extractMentionNotification, parsePNLikeEvent, parsePNMessage, parsePNNewConvo, parsePNRC, parsePNSecrets, parsedPNDelete } from '../utils/notificationUtils';
import AuthIdentityContext from '../contexts/AuthIdentityContext';
import UIContext from '../contexts/UIContext';
import { ConversationPreview, DecryptedMessage } from '../types/types';
import UserSecretsContext from '../contexts/UserSecretsContext';

export default function NotificationsController(): JSX.Element {
    const dispatch = useAppDispatch();
    const { conversationsApi, usersApi } = useRequest();
    const { currentConvo } = useAppSelector(chatSelector);
    const { resetSocket, socket, disconnected: socketDisconnected } = useContext(SocketContext);
    const { user } = useContext(AuthIdentityContext);
    const { userConversations } = useAppSelector(userDataSelector);
    const { navSwitch } = useContext(UIContext);
    const { secrets, handleNewEncryptedConversation } = useContext(UserSecretsContext);
    
    useEffect(() => { 
        const eventListener = AppState.addEventListener('change', async (nextState) => {
            if (nextState === 'active' && (await getBackgroundUpdateFlag())) {
                try {
                    console.log('pulling notification updates');
                    if (currentConvo) {
                        const secretKey = (secrets && currentConvo.id in secrets) ? secrets[currentConvo.id] : undefined;
                        dispatch(pullConversation(currentConvo.id, conversationsApi, secretKey));
                    }
                    const userData = await getUserData(usersApi);
                    if (userData && userData.conversations) {
                        dispatch(setConversations(userData?.conversations));
                    }
                    await setBackgroundUpdateFlag(false);
                } catch (err) {
                    console.log(err);
                }
            }
        });

        return () => {
            eventListener.remove();
        };
    }, []);

    useEffect(() => {
        const unsubscribe = messaging().onMessage(async (message) => {
            if (!socket || socketDisconnected) {
                resetSocket();
                const messageData = message.data ? message.data as PNPacket : undefined;
                if (messageData) {
                    switch (messageData.type) {
                        case 'message':
                            const parsedPNM = parsePNMessage(messageData.stringifiedBody);
                            if (parsedPNM && parsedPNM.cid === currentConvo?.id) {
                                socket?.emit('messagesRead', currentConvo?.id);
                                dispatch(receiveNewMessage({message: parsedPNM.message, cid: parsedPNM.cid}));
                            }
                            if (parsedPNM) {
                                const secretKey = secrets ? secrets[parsedPNM.cid] : undefined;
                                dispatch(handleNewMessage({
                                    cid: parsedPNM.cid,
                                    message: parsedPNM.message as DecryptedMessage,
                                    messageForCurrent: parsedPNM.cid === currentConvo?.id,
                                    secretKey
                                }));
                            }
                            break;
                        case 'like':
                            const parsedPNL = parsePNLikeEvent(messageData.stringifiedBody);
                            if (parsedPNL && parsedPNL.cid === currentConvo?.id) {
                                dispatch(receiveNewLike({
                                    messageId: parsedPNL.mid,
                                    userId: parsedPNL.senderId,
                                    event: parsedPNL.event
                                }));
                            }
                            break;
                        case 'newConvo':
                            const parsedPNC = parsePNNewConvo(messageData.stringifiedBody);
                            if (parsedPNC && user) {
                                if (userConversations.map(c => c.cid).includes(parsedPNC.convo.id)) return; 
                                const completedConvo = await constructNewConvo(parsedPNC.convo, user);
                                let secretKey: Uint8Array | undefined = undefined;
                                if (completedConvo.publicKey && parsedPNC.keyMap && parsedPNC.keyMap[user.id]) {
                                    secretKey = await handleNewEncryptedConversation(completedConvo.id, parsedPNC.keyMap[user.id], completedConvo.publicKey);
                                }
                                dispatch(addConversation({
                                    newConvo: completedConvo,
                                    uid: user.id,
                                    secretKey
                                }));
                                socket?.emit('joinRoom', userConversations.map((c: ConversationPreview) => c.cid));
                            }
                            break;
                        case 'secrets':
                            const parsedPNS = parsePNSecrets(messageData.stringifiedBody);
                            if (parsedPNS && user) {
                                if (!userConversations.find((c) => c.cid === parsedPNS.cid)) return;
                                if (!(user.id in parsedPNS.newKeyMap)) return;
                                if (parsedPNS.cid === currentConvo?.id) {
                                    if (parsedPNS.newPublicKey === currentConvo?.publicKey) return;
                                    dispatch(setCCPublicKey(parsedPNS.newPublicKey));
                                }
                                const newSecretKey = parsedPNS.newKeyMap[user.id]
                                await handleNewEncryptedConversation(parsedPNS.cid, newSecretKey, parsedPNS.newPublicKey);
                            }
                            break;
                        case 'deleteMessage':
                            const parsedDelete = parsedPNDelete(messageData.stringifiedBody);
                            if (parsedDelete && user) {
                                const { cid, mid } = parsedDelete;
                                if (currentConvo?.id === cid) {
                                    dispatch(handleMessageDelete(mid));
                                }
                            }
                            break;
                        case 'roleChanged':
                            const parsedPNRC = parsePNRC(messageData.stringifiedBody);
                            if (parsedPNRC && user) {
                                const { cid, newRole } = parsedPNRC;
                                if (currentConvo?.id === cid) {
                                    const uid = user.id;
                                    uid && dispatch(updateUserRole({uid, newRole}));
                                }
                                dispatch(handleRoleUpdate({cid, newRole}))
                            }
                            break;
                    }
                }
            }
        });

        return unsubscribe();
    }, [currentConvo, socket, socketDisconnected, user, userConversations]);

    const handleNotificationSelect = (pnData: PNPacket) => {
        if (pnData.type && (pnData.type === 'message' || pnData.type === 'like' || pnData.type === 'newConvo')) {
            let parsed: {
                cid: string;
            } | undefined;
            switch (pnData.type) {
                case 'message':
                    parsed = parsePNMessage(pnData.stringifiedBody);
                    break;
                case 'like':
                    parsed = parsePNLikeEvent(pnData.stringifiedBody);
                    break;
                case 'newConvo':
                    const parsedNC = parsePNNewConvo(pnData.stringifiedBody);
                    if (!parsedNC?.convo) {
                        parsed = undefined;
                    } else {
                        parsed = {
                            cid: parsedNC.convo.id
                        };
                    }
                    break;
            }
            console.log(pnData);
            console.log(`OPENEDPN: ${parsed}`);
            if (parsed) {
                const secretKey = (secrets && parsed.cid in secrets) ? secrets[parsed.cid] : undefined;
                dispatch(setConvo({ convo: undefined }));
                navSwitch('messaging');
                dispatch(pullConversation(parsed.cid, conversationsApi, secretKey))
            }
        } else {
            dispatch(pullLatestPreviews(usersApi, () => {
                navSwitch('conversations');
            }));
        }
    }

    useEffect(() => {
        const unsubscribe = messaging().onNotificationOpenedApp(async (notification) => {
            if (notification.data) {
                const pnData: PNPacket = notification.data as PNPacket;
                handleNotificationSelect(pnData);
            }
        });
        return unsubscribe();
    }, []);

    useEffect(() => {
        messaging()
            .getInitialNotification()
            .then(notification => {
                if (notification?.data) {
                    const pnData: PNPacket = notification.data as PNPacket;
                    handleNotificationSelect(pnData);
                }
            });
    }, []);

    useEffect(() => {
        const addPushToken = async () => {
            console.log('adding push token');
            try {
                const token = await messaging().getToken();
                console.log(`PNTOKEN: ${token}`);
                if (token) {
                    await usersApi.addUserPushToken(token);
                }
                console.log('added');
            } catch (err) {
                console.log(err);
            }
        }
        addPushToken();
    }, []);

    return <></>;
}
