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
                unitTests: Object.fromEntries(
                    action.payload.unitTests.map((test) => [test.id, test])
                ),
                integrationTests: Object.fromEntries(
                    action.payload.integrationTests.map((test) => [test.id, test])
                ),
                instances: {},
                recentLogs: [],
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
            return {
                ...state,
                recentLogs: [
                    ...state.recentLogs,
                    action.payload
                ]
            }
        }
    }
});

export const {
    initTestStore,
    initTests,
    recordTestInstance,
    recordLog,
    updateTestInstance,
} = testSlice.actions;

const testReducer = testSlice.reducer;
export const testSelector = (state: RootState) => state.testReducer;
export default testReducer;
