import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { setBackgroundUpdateFlag } from '../localStore/store';
import notifee, { EventType } from '@notifee/react-native';
import { PNPacket } from '../types/types';
import { getEncryptedDisplayFields, getSecureKeyForMessage, getUnencryptedDisplayFields, handleBackgroundConversationInfo, handleBackgroundConversationKey, parsePNDisplay, parsePNNewConvo } from '../utils/notificationUtils';
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
    }
    notifee.displayNotification({
        title: displayFields.title,
        body: displayFields.body,
        data: displayFields.data || {},
        android: {
            channelId: type,
        },
    });
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
    // await messaging().registerDeviceForRemoteMessages();
    // const enabled =
    //     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    //     authStatus === messaging.AuthorizationStatus.PROVISIONAL;
};

export const setBackgroundNotifications = () => messaging().setBackgroundMessageHandler(async remoteMessage => {
    await setBackgroundUpdateFlag(true);
    if (!remoteMessage.data) return;
    if (remoteMessage.data.type === 'newConvo' && remoteMessage.data.stringifiedBody) {
        const parsedConvo = parsePNNewConvo(remoteMessage.data.stringifiedBody as string);
        parsedConvo && await handleBackgroundConversationInfo(parsedConvo.convo);
        if (parsedConvo?.keyMap) {
            handleBackgroundConversationKey(parsedConvo.keyMap, parsedConvo.convo);
        }
    } 
    if (remoteMessage.data.type === 'message') {
        const secretKey = await getSecureKeyForMessage(remoteMessage.data as PNPacket);
        const displayFields = await getEncryptedDisplayFields(remoteMessage.data as PNPacket, secretKey);
        if (displayFields) {
            displayNotification(displayFields, remoteMessage.data.type);
        } else {
            displayNotification({
                title: 'Decryption error',
                body: 'no body'
            }, remoteMessage.data.type);
        }
    } else if (remoteMessage.data.type === 'like') {
        displayNotification(getUnencryptedDisplayFields(remoteMessage.data as PNPacket), remoteMessage.data.type);
    } else {
        displayNotification({
            title: 'Unrecognized type',
            body: JSON.stringify(remoteMessage.data)
        }, remoteMessage.data.type);
    }
});
