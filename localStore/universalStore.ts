import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules } from 'react-native';

// Functions to store data that can be accessed from both React Native and Pure Native modules

const storeData = async (key: string, stringifiedData: string) => {
    try {
        await AsyncStorage.setItem(key, stringifiedData);
        const { OCUserDefaults } = NativeModules;
        if (OCUserDefaults) {
            await OCUserDefaults.storeData(key, stringifiedData);
        }
    } catch (err) {
        console.log(err);
    }
};

const removeData = async (keys: string[]) => {
    try {
        await AsyncStorage.multiRemove(keys);
        const { OCUserDefaults } = NativeModules;
        if (OCUserDefaults) {
            await Promise.all(
                keys.map(async (key) => {
                    await OCUserDefaults.removeData(key);
                })
            )
        }
        return true
    } catch (err) {
        console.log(err);
        return false;
    }
}

const universalStore = {
    storeData,
    removeData
};

export default universalStore;