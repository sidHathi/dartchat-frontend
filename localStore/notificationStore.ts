import AsyncStorage from '@react-native-async-storage/async-storage';
import { PNPacket } from '../types/types';

const setNotificationAction = async (notifBody: string) => {
    try {
        await AsyncStorage.setItem('notification-action', notifBody);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const getNotificationAction = async () => {
    try {
        const action = await AsyncStorage.getItem('notification-action');
        if (!action) return undefined;
        const parsedAction = JSON.parse(action) as PNPacket;
        return parsedAction;
    } catch (err) {
        console.log(err);
        return undefined;
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
    clearNotificationAction,
    getNotificationAction
};

export default notificationStore;
