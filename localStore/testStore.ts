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
        console.log('test snapshot: ', snapshot)
        console.log(JSON.stringify({...snapshot.instances}));
        await AsyncStorage.setItem('testSnapshot-unitTests', JSON.stringify(snapshot.unitTests));
        await AsyncStorage.setItem('testSnapshot-integrationTests', JSON.stringify(snapshot.integrationTests));
        await AsyncStorage.setItem('testSnapshot-instances', JSON.stringify({...snapshot.instances}));
        await AsyncStorage.setItem('testSnapshot-recentLogs', JSON.stringify(snapshot.recentLogs));
        return true;
    } catch (err) {
        console.log(err);
        return false
    }
};

const getTestSnapshot = async () => {
    try {
        const naiveParse = {
            unitTests: JSON.parse(await AsyncStorage.getItem('testSnapshot-unitTests') || '{}'),
            integrationTests: JSON.parse(await AsyncStorage.getItem('testSnapshot-integrationTests') || '{}'),
            instances: JSON.parse((await AsyncStorage.getItem('testSnapshot-instances')) || '{}'),
            recentLogs: JSON.parse(await AsyncStorage.getItem('testSnapshot-recentLogs') || '[]')
        } as {
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
        console.log('naive parse', naiveParse);
        console.log(naiveParse.unitTests);
        console.log(naiveParse.instances);
        console.log(naiveParse.recentLogs);
        if (!naiveParse) {
            return undefined;
        }
        const parsed = {
            unitTests: naiveParse.unitTests ? Object.entries(naiveParse.unitTests).map(([id, ut]) => ([
                id, 
                {
                    ...ut,
                    logs: ut.logs?.map((log) => ({
                        ...log, 
                        timestamp: new Date(Date.parse(log.timestamp))
                    }))
                }
            ])) : undefined,
            integrationTests: naiveParse.integrationTests ? Object.entries(naiveParse.integrationTests).map(([id, ut]) => ([
                id, 
                {
                    ...ut,
                    logs: ut.logs?.map((log) => ({
                        ...log, 
                        timestamp: new Date(Date.parse(log.timestamp))
                    }))
                }
            ])) : undefined,
            instances: Object.fromEntries(
                Object.entries(naiveParse.instances).map(([id, instArr]) => ([
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
                ]))
            ),
            recentLogs: naiveParse.recentLogs?.map((log) => ({
                ...log, 
                timestamp: new Date(Date.parse(log.timestamp))
            })),
        };
        console.log('parsed', parsed);
        return parsed;
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
