import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { getStoredUserData, setBackgroundUpdateFlag } from '../localStore/localStore';
import notifee, { EventType } from '@notifee/react-native';
import { PNPacket } from '../types/types';
import { getEncryptedDisplayFields, getSecureKeyForMessage, getUnencryptedDisplayFields, handleBackgroundConversationInfo, handleBackgroundConversationKey, handleBackgroundSecrets, parsePNDisplay, parsePNLikeEvent, parsePNNewConvo, parsePNSecrets } from '../utils/notificationUtils';
import notificationStore from '../localStore/notificationStore';

const displayNotification = async (displayFields: {
    title: string,
    body: string,
    imageUri?: string,
    id?: string,
    data?: any,
}, type: string) => {
    if (type === 'message') {
        await notifee.incrementBadgeCount();
        await setBackgroundUpdateFlag(true);
    }
  
    try {
        notifee.displayNotification({
            id: displayFields.id,
            title: displayFields.title,
            body: displayFields.body,
            data: displayFields.data || {},
            android: {
                channelId: type,
            },
            ios: {
                sound: 'default',
                interruptionLevel: 'active'
            }
        });
    } catch (err) {
        console.log('NOTIFICATION DISPLAY FAILURE');
        console.log(displayFields)
        console.log({
            id: displayFields.id,
            title: displayFields.title,
            body: displayFields.body,
            data: displayFields.data || {},
            android: {
                channelId: type,
            },
            ios: {
                sound: 'default',
                interruptionLevel: 'active'
            }
        })
        console.log(err);
    }
};

export const setBackgroundHandler = () => notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
        await setBackgroundUpdateFlag(true);
        if (detail?.notification?.data) {
            await notifee.decrementBadgeCount();
            await notificationStore.setNotificationAction(JSON.stringify(detail.notification.data));
        }
    } else if (type === EventType.DISMISSED) {
        await notifee.decrementBadgeCount();
    } else {
        await setBackgroundUpdateFlag(true);
    }
});

export const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    await notifee.requestPermission();
    const settings = await notifee.getNotificationSettings();
    await messaging().registerDeviceForRemoteMessages();
    // const enabled =
    //     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    //     authStatus === messaging.AuthorizationStatus.PROVISIONAL;
};

export const setBackgroundNotifications = () => messaging().setBackgroundMessageHandler(async remoteMessage => {
    await setBackgroundUpdateFlag(true);
    if (!remoteMessage.data) return;
    try {
        if (remoteMessage.data.type === 'secrets') {
            const parsedPNS: any = parsePNSecrets(remoteMessage.data.stringifiedBody);
            try {
                const user = await getStoredUserData();
                if (!user) return;
                if (parsedPNS?.newKeyMap && user.id in parsedPNS.newKeyMap) {
                    const { cid, newPublicKey, newKeyMap } = parsedPNS;
                    await handleBackgroundSecrets(cid, newKeyMap, newPublicKey);
                }
            } catch (err) {
                console.log(err);
            }
        }   
        // if ((remoteMessage.data.type === 'newConvo' || remoteMessage.data.type === 'addedToConvo') && remoteMessage.data.stringifiedBody) {
        //     const parsedConvo = parsePNNewConvo(remoteMessage.data.stringifiedBody as string);
        //     parsedConvo && await handleBackgroundConversationInfo(parsedConvo.convo);
        //     if (!parsedConvo) {
        //         console.log('conversation parsing failure');
        //         return;
        //     }
        //     if (parsedConvo?.keyMap) {
        //         handleBackgroundConversationKey(parsedConvo.keyMap, parsedConvo.convo);
        //     }
        //     if (!parsedConvo) return;
        //     const displayFields = getUnencryptedDisplayFields(remoteMessage.data as PNPacket);
        //     const data = {
        //         type: 'newConvo',
        //         cid: parsedConvo.convo.id || '',
        //     };
        //     // displayNotification({
        //     //     ...displayFields,
        //     //     data,
        //     //     id: remoteMessage.messageId || parsedConvo.convo.id
        //     // }, remoteMessage.data.type);
        // } else if (remoteMessage.data.type === 'message') {
        //     const secretKey = await getSecureKeyForMessage(remoteMessage.data as PNPacket);
        //     const displayFields = await getEncryptedDisplayFields(remoteMessage.data as PNPacket, secretKey);
        //     if (displayFields) {
        //         // displayNotification(displayFields, remoteMessage.data.type);
        //     }
        // } else if (remoteMessage.data.type === 'like') {
        //     const parsedLike = parsePNLikeEvent((remoteMessage.data.stringifiedBody as string));
        //     const displayFields = getUnencryptedDisplayFields(remoteMessage.data as PNPacket);
        //     if (!displayFields) {
        //         console.log('NOTIFICATION MESSAGE DECRYPTION FAILURE');
        //         console.log(remoteMessage.data);
        //     }
        //     const data = {
        //         type: 'like',
        //         cid: parsedLike?.cid || '',
        //         mid: parsedLike?.mid
        //     }
        //     displayNotification({
        //         ...displayFields,
        //         data,
        //         id: remoteMessage.messageId || parsedLike?.mid
        //     }, remoteMessage.data.type);
        // } else 
    } catch (err) {
        console.log('NOTIFICATION ERROR');
        console.log(remoteMessage);
        console.log(err);
    }
});
