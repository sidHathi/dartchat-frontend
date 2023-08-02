import AsyncStorage from "@react-native-async-storage/async-storage"

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

const updateUserSecretKeyStore = async (uid: string, key: string, newVal: string) =>{
    try {
        const currStore = await getUserSecretKeyStore(uid) || {};
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
    getUserSecretKeyStore,
    updateUserSecretKeyStore,
    dumpSecrets
};

export default secureStore;
