import messaging from '@react-native-firebase/messaging';
import { setBackgroundUpdateFlag } from '../localStore/store';

export const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
    }
}

export const setBackgroundNotifications = () => messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
    // TODO: store message reception event in local storage, trigger request to retrieve latest user data and add that to local storage as well
    if (remoteMessage.notification) {
        await setBackgroundUpdateFlag(true);
    }
});