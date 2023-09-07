import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConversationPreview, UserData } from '../types/types';
import { parseUserData } from '../utils/requestUtils';
import { NativeModules } from 'react-native';
import universalStore from './universalStore';

export const storeUserData = async (user: UserData) => {
    try {
        await universalStore.storeData('userData', JSON.stringify(user));
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
        await universalStore.removeData(['userData']);
    } catch (err) {
        console.error(err);
    }
};

export const setBackgroundUpdateFlag = async (needsUpdate: boolean) => {
    try {
        await AsyncStorage.setItem('backgroundUpdateFlag', needsUpdate.toString());
    } catch (err) {
        console.error(err);
    }
};

export const getBackgroundUpdateFlag = async () => {
    try {
        return await AsyncStorage.getItem('backgroundUpdateFlag') === 'true';
    } catch (err) {
        console.error(err);
    }
};

export const storeUpdatedUserConversations = async (newConversations: ConversationPreview[]) => {
    try {
        const existingUser = await getStoredUserData();
        if (existingUser) {
            const updatedUser = {
                ...existingUser,
                conversations: newConversations
            } as UserData;
            await storeUserData(updatedUser);
            return true;
        }
        return false;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const localStore = {
    storeUserData,
    getStoredUserData,
    deleteStoredUserData,
    setBackgroundUpdateFlag,
    getBackgroundUpdateFlag,
    storeUpdatedUserConversations
}

export default localStore;
