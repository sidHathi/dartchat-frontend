import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { setBackgroundUpdateFlag } from '../localStore/store';
import notifee from '@notifee/react-native';
import { PNPacket } from '../types/rawTypes';
import { parsePNDisplay } from '../utils/messagingUtils';

const displayNotification = async (message: FirebaseMessagingTypes.RemoteMessage) => {
    const packet = message.data ? message.data as PNPacket : undefined;
    const parsedPacket = parsePNDisplay(packet?.stringifiedDisplay);
    if (packet && parsedPacket) {
        notifee.displayNotification({
            title: parsedPacket.title,
            body: parsedPacket.body,
            android: {
              channelId: packet.type,
            },
          });
    }
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
    displayNotification(remoteMessage);
    if (remoteMessage.notification) {
        await setBackgroundUpdateFlag(true);
    }
});