import AsyncStorage from "@react-native-async-storage/async-storage"
import { decodeKey } from "../utils/encryptionUtils";
import storeData from "./store";

const getUserPINEncryptionKey = async (uid: string) => {
    try {
        const key = await AsyncStorage.getItem(`userPINEncryptionKey-${uid}`);
        return key;
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

const setUserPINEncryptionKey = async (uid: string, key: string) => {
    try {
        await AsyncStorage.setItem(`userPINEncryptionKey-${uid}`, key);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const getUserSecretKeyStore = async (uid: string): Promise<any | undefined> => {
    try {
        const storeString = await AsyncStorage.getItem(`user-${uid}-secrets`);
        if (storeString) {
            return JSON.parse(storeString);
        }
        return undefined
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

const getSecretKeyForKey = async (uid: string, key: string): Promise<Uint8Array | undefined> => {
    try {
        const store = await getUserSecretKeyStore(uid);
        if (store && key in store) {
            return decodeKey(store[key]);
        }
        return undefined
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

const getUserSecretKey = async (uid: string): Promise<Uint8Array | undefined> => {
    const keyStore = await getUserSecretKeyStore(uid);
    if (keyStore && 'userSecretKey' in keyStore) return decodeKey(keyStore.userSecretKey as string);
    return undefined;
};

const initUserSecretKeyStore = async (uid: string, keys: { [id: string]: string }) => {
    try {
        await storeData(`user-${uid}-secrets`, JSON.stringify(keys));
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const addSecureKey = async (uid: string, key: string, newVal: string) =>{
    try {
        const currStore = await getUserSecretKeyStore(uid) || {};
        // console.log(`adding key for ${key} to store`)
        // console.log(currStore);
        const updatedStore = {
            ...currStore,
            [key]: newVal
        };
        await AsyncStorage.setItem(`user-${uid}-secrets`, JSON.stringify(updatedStore));
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const removeKey = async (uid: string, key: string) => {
    try {
        const currStore = await getUserSecretKeyStore(uid) || {};
        const updatedStore = Object.keys(currStore).filter((k) => k !== key);
        await storeData(`user-${uid}-secrets`, JSON.stringify(updatedStore))
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

const dumpSecrets = async (uid: string) => {
    try {
        await AsyncStorage.multiRemove([
            `userPINEncryptionKey-${uid}`,
            `user-${uid}-secrets`
        ]);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

const secureStore = {
    getUserPINEncryptionKey,
    setUserPINEncryptionKey,
    getUserSecretKey,
    getUserSecretKeyStore,
    getSecretKeyForKey,
    initUserSecretKeyStore,
    addSecureKey,
    removeKey,
    dumpSecrets
};

export default secureStore;
