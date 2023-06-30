import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import userConversationsReducer from './slices/userConversationsSlice';

export const store = configureStore({
  reducer: {
    chatReducer,
    userConversationsReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({serializableCheck: false})
});
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;