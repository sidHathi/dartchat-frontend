import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules } from 'react-native';

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

export default storeData;
