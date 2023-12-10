import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Test from '../../tests/test';
import TestInstance from '../../tests/testInstance';
import Log from '../../tests/log';
import { RootState } from '../store';

const initialState : {
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
} = {
    unitTests: {},
    integrationTests: {},
    instances: {},
    recentLogs: []
};

export const testSlice = createSlice({
    name: 'tests',
    initialState,
    reducers: {
        initTestStore: (state, action: PayloadAction<{
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
        }>) => {
            return action.payload;
        },
        initTests: (state, action: PayloadAction<{
            unitTests: Test[],
            integrationTests: Test[]
        }>) => {
            return {
                ...state,
                unitTests: Object.fromEntries(
                    action.payload.unitTests.map((test) => [test.id, test])
                ),
                integrationTests: Object.fromEntries(
                    action.payload.integrationTests.map((test) => [test.id, test])
                ),
            }
        },
        recordTestInstance: (state, action: PayloadAction<TestInstance>) => {
            const testId = action.payload.testId;
            const newInstanceArr = testId in state.instances ? 
                [action.payload, ...state.instances[testId]] : 
                [action.payload];
            const newInstanceMap = {
                ...state.instances,
                [testId]: newInstanceArr
            };
            return {
                ...state,
                instances: newInstanceMap
            }
        },
        updateTestInstance: (state, action: PayloadAction<{
            testId: string,
            instanceId: string,
            updatedInstance: TestInstance
        }>) => {
            const { testId, instanceId, updatedInstance } = action.payload;
            if (!(testId in state.instances)) return;
            const newInstances = state.instances[testId].map((inst) => {
                if (inst.id === instanceId) {
                    return updatedInstance;
                }
                return inst;
            });
            return {
                ...state,
                instances: {
                    ...state.instances,
                    [testId]: newInstances,
                }
            }
        },
        recordLog: (state, action: PayloadAction<Log>) => {
            if (state.recentLogs.length > 1 && state.recentLogs.find((l) => l.timestamp.getTime() === action.payload.timestamp.getTime())) return state;
            return {
                ...state,
                recentLogs: [
                    action.payload,
                    ...state.recentLogs,
                ]
            }
        },
        addTestLogs: (state, action: PayloadAction<Log[]>) => {
            const sortedLogs = [...action.payload].sort((a, b) => {
                if (a.timestamp.getTime() > b.timestamp.getTime()) return -1;
                else if (b.timestamp.getTime() > a.timestamp.getTime()) return 1;
                return 0;
            });
            if (state.recentLogs.length === 0) {
                return {
                    ...state,
                    recentLogs: sortedLogs,
                }
            }
            const mostRecentLogTime = state.recentLogs[0].timestamp.getTime();
            return {
                ...state,
                recentLogs: [
                    ...sortedLogs.filter((log) => log !== undefined && log.timestamp.getTime() > mostRecentLogTime),
                    ...state.recentLogs
                ]
            };
        }
    }
});

export const {
    initTestStore,
    initTests,
    recordTestInstance,
    recordLog,
    updateTestInstance,
    addTestLogs
} = testSlice.actions;

const testReducer = testSlice.reducer;
export const testSelector = (state: RootState) => state.testReducer;
export default testReducer;
