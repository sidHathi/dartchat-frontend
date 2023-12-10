import AsyncStorage from "@react-native-async-storage/async-storage";
import Log, { StoredLog } from "../tests/log";
import Test, { StoredTest } from "../tests/test";
import TestInstance, { StoredTestInstance } from "../tests/testInstance";

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
        const naiveParse = JSON.parse(stringified) as {
            unitTests: {
                [id: string]: StoredTest
            },
            integrationTests: {
                [id: string]: StoredTest
            },
            instances: {
                [id: string]: StoredTestInstance[]
            },
            recentLogs: StoredLog[]
        };
        return {
            unitTests: Object.entries(naiveParse.unitTests).map(([id, ut]) => ([
                id, 
                {
                    ...ut,
                    logs: ut.logs.map((log) => ({
                        ...log, 
                        timestamp: new Date(Date.parse(log.timestamp))
                    }))
                }
            ])),
            integrationTests: Object.entries(naiveParse.integrationTests).map(([id, ut]) => ([
                id, 
                {
                    ...ut,
                    logs: ut.logs.map((log) => ({
                        ...log, 
                        timestamp: new Date(Date.parse(log.timestamp))
                    }))
                }
            ])),
            instances: Object.entries(naiveParse.instances).map(([id, instArr]) => ([
                id, 
                instArr.map((inst) => ({
                    ...inst,
                    startedAt: inst.startedAt ? new Date(Date.parse(inst.startedAt)) : undefined,
                    completedAt: inst.completedAt ? new Date(Date.parse(inst.completedAt)) : undefined,
                    logs: inst.logs.map((log) => ({
                        ...log, 
                        timestamp: new Date(Date.parse(log.timestamp))
                    }))
                }))
            ])),
            recentLogs: naiveParse.recentLogs.map((log) => ({
                ...log, 
                timestamp: new Date(Date.parse(log.timestamp))
            })),
        };
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
