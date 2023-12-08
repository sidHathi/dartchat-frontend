import AsyncStorage from "@react-native-async-storage/async-storage";
import Log from "../tests/log";
import Test from "../tests/test";
import TestInstance from "../tests/testInstance";

const storeLogSnapshot = async (snapshot: {
    unitTests: {
        [id: string]: Test
    },
    integrationTests: {
        [id: string]: Test
    },
    instances: {
        [id: string]: TestInstance[]
    },
    recentLogs: Log[]
}) => {
    try {
        await AsyncStorage.setItem('testSnapshot', JSON.stringify(snapshot));
        return true;
    } catch (err) {
        console.log(err);
        return false
    }
};

const getTestSnapshot = async () => {
    try {
        const stringified = await AsyncStorage.getItem('testSnapshot');
        if (!stringified) return undefined;
        const val = JSON.parse(stringified) as {
            unitTests: {
                [id: string]: Test
            },
            integrationTests: {
                [id: string]: Test
            },
            instances: {
                [id: string]: TestInstance[]
            },
            recentLogs: Log[]
        };
        return val;
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

const testStore = {
    storeLogSnapshot,
    getTestSnapshot,
};

export default testStore;
