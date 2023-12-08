import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import userDataReducer from './slices/userDataSlice';
import testReducer from './slices/testSlice';

export const store = configureStore({
    reducer: {
        chatReducer,
        userDataReducer,
        testReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    })
});
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;