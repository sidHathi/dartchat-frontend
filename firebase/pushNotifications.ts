import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { setBackgroundUpdateFlag } from '../localStore/store';
import notifee from '@notifee/react-native';
import { PNPacket } from '../types/rawTypes';
import { getEncryptedDisplayFields, getSecureKeyForMessage, getUnencryptedDisplayFields, handleBackgroundConversationKey, parsePNDisplay, parsePNNewConvo } from '../utils/notificationUtils';

const displayNotification = async (displayFields: {
    title: string,
    body: string,
    imageUri?: string,
}, type: string) => {
    notifee.displayNotification({
        title: displayFields.title,
        body: displayFields.body,
        android: {
            channelId: type,
        },
        });
}

export const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    // await messaging().registerDeviceForRemoteMessages();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (enabled) {
        console.log('Authorization status:', authStatus);
    }
}

export const setBackgroundNotifications = () => messaging().setBackgroundMessageHandler(async remoteMessage => {
    await setBackgroundUpdateFlag(true);
    if (!remoteMessage.data) return;
    if (remoteMessage.data.type === 'newConvo' && remoteMessage.data.stringifiedBody) {
        const parsedConvo = parsePNNewConvo(remoteMessage.data.stringifiedBody as string);
        if (parsedConvo?.keyMap) {
            handleBackgroundConversationKey(parsedConvo.keyMap, parsedConvo.convo);
        }
    } else if (remoteMessage.data.type === 'message') {
        const secretKey = await getSecureKeyForMessage(remoteMessage.data as PNPacket);
        const displayFields = getEncryptedDisplayFields(remoteMessage.data as PNPacket, secretKey) ;
        if (displayFields) {
            displayNotification(displayFields, remoteMessage.data.type);
        }
    } else {
        displayNotification(getUnencryptedDisplayFields(remoteMessage.data as PNPacket), remoteMessage.data.type);
    }
});
