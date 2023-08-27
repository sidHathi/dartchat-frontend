import React, { useContext, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { AppState } from 'react-native';
import useRequest from '../requests/useRequest';
import { chatSelector, handleMessageDelete, pullConversation, receiveNewLike, receiveNewMessage, setCCPublicKey, setConvo, setNotificationLoading, setSecretKey, updateUserRole } from '../redux/slices/chatSlice';
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
import notifee, { EventType } from '@notifee/react-native';

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
                                try {
                                    if (!userConversations.find((c) => c.cid === parsedPNS.cid)) return;
                                    if (parsedPNS.cid === currentConvo?.id) {
                                        if (parsedPNS.newPublicKey === currentConvo?.publicKey) return;
                                        dispatch(setCCPublicKey(parsedPNS.newPublicKey));
                                    }
                                    if (!(user.id in parsedPNS.newKeyMap)) return;
                                    const newSecretKey = parsedPNS.newKeyMap[user.id];
                                    const updatedConvo = await conversationsApi.getConversationInfo(parsedPNS.cid);
                                    if (updatedConvo.publicKey && newSecretKey) {
                                        const secretKey = await handleNewEncryptedConversation(parsedPNS.cid, newSecretKey, updatedConvo.publicKey);
                                        if (parsedPNS.cid === currentConvo?.id && secretKey) {
                                            dispatch(setSecretKey(secretKey))
                                        }   
                                    }     
                                } catch (err) {
                                    console.log(err);
                                }
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
                        case 'addedToConvo':
                            const parsedPNAC = parsePNNewConvo(messageData.stringifiedBody);
                            if (parsedPNAC && user) {
                                if (userConversations.map(c => c.cid).includes(parsedPNAC.convo.id)) return; 
                                const completedConvo = await constructNewConvo(parsedPNAC.convo, user);
                                let secretKey: Uint8Array | undefined = undefined;
                                if (completedConvo.publicKey && parsedPNAC.keyMap && parsedPNAC.keyMap[user.id]) {
                                    secretKey = await handleNewEncryptedConversation(completedConvo.id, parsedPNAC.keyMap[user.id], completedConvo.publicKey);
                                }
                                dispatch(pullLatestPreviews(usersApi));
                                socket?.emit('joinRoom', userConversations.map((c: ConversationPreview) => c.cid));
                            }
                            break;
                    }
                }
            }
        });

        return unsubscribe();
    }, [currentConvo, socket, socketDisconnected, user, userConversations, secrets, handleNewEncryptedConversation]);

    const handleNotificationSelect = (pnData: PNPacket) => {
        console.log(pnData);
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
    };

    const handleNotifeeOpenEvent = async () => {
        console.log('DEPRECATED NOTIFEE HANDLER TRIGGERED');
        dispatch(setNotificationLoading(true));
        const initialNotification = await notifee.getInitialNotification();
        console.log(initialNotification);

        if (!initialNotification?.notification.data) {
            dispatch(setNotificationLoading(false));
            return;
        }
        await handleNotificationSelect(initialNotification.notification.data as PNPacket);
    };

    // useEffect(() => {
    //     const unsubscribe = messaging().onNotificationOpenedApp(async (notification) => {
    //         if (notification.data) {
    //             const pnData: PNPacket = notification.data as PNPacket;
    //             handleNotificationSelect(pnData);
    //         }
    //     });
    //     return unsubscribe();
    // }, []);

    // useEffect(() => {
    //     messaging()
    //         .getInitialNotification()
    //         .then(notification => {
    //             if (notification?.data) {
    //                 const pnData: PNPacket = notification.data as PNPacket;
    //                 handleNotificationSelect(pnData);
    //             }
    //         });
    // }, []);

    // useEffect(() => {
    //     handleNotifeeOpenEvent()
    //         .then(() => {
    //             dispatch(setNotificationLoading(false));
    //         })
    //         .catch((err) => {
    //             console.log(err);
    //             dispatch(setNotificationLoading(false));
    //         })
    // }, []);

    useEffect(() => {
        return notifee.onForegroundEvent(({ type, detail }) => {
            console.log('NOTIFEE HANDLER TRIGGERED');
            console.log(detail.notification);
            switch (type) {
                case EventType.DISMISSED:
                    console.log('User dismissed notification', detail.notification);
                    break;
                case EventType.PRESS:
                    console.log('User pressed notification', detail.notification?.data);
                    if (detail?.notification?.data) {
                        dispatch(setNotificationLoading(true));
                        handleNotificationSelect(detail.notification.data as PNPacket)
                        dispatch(setNotificationLoading(false));
                    }
                    break;
            }
        })();
    }, []);

    useEffect(() => {
        
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
