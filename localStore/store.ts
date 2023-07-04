import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData } from '../types/types';
import { parseUserData } from '../utils/requestUtils';

export const storeUserData = async (user: UserData) => {
    try {
        await AsyncStorage.setItem('userData', JSON.stringify(user));
    } catch (err) {
        console.error(err);
    }
};

export const getStoredUserData = async () => {
    try {
        const val = await AsyncStorage.getItem('userData');
        if (!val) {
            return undefined;
        }
        return parseUserData(JSON.parse(val));
    } catch (err) {
        console.error(err);
    }
};

export const deleteStoredUserData = async () => {
    try {
        await AsyncStorage.removeItem('userData');
    } catch (err) {
        console.error(err);
    }
};
