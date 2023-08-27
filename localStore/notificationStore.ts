import AsyncStorage from '@react-native-async-storage/async-storage';

const setNotificationAction = async (notifBody: string) => {
    try {
        await AsyncStorage.setItem('notification-action', notifBody);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const clearNotificationAction = async () => {
    try {
        await AsyncStorage.removeItem('notification-action');
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const notificationStore = {
    setNotificationAction,
    clearNotificationAction
};

export default notificationStore;
