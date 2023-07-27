import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import userDataReducer from './slices/userDataSlice';

export const store = configureStore({
    reducer: {
        chatReducer,
        userDataReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    })
});
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;