import { createSlice, PayloadAction, ThunkAction } from "@reduxjs/toolkit";
import { Conversation, Message, UserConversationProfile, SocketEvent, CursorContainer } from "../../types/types";
import { RootState } from "../store";
import { Socket } from "socket.io-client";
import uuid from 'react-native-uuid';
import { ConversationsApi } from "../../requests/conversationsApi";

const initialState: {
    currentConvo?: Conversation;
    needsScroll: boolean;
    requestLoading: boolean;
    requestCursor?: string;
} = {
    needsScroll: false,
    requestLoading: false,
};

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setConvo: (state, action: PayloadAction<Conversation | undefined>) => (
            {...state, currentConvo: action.payload}
        ),
        exitConvo: (state) => ({ ...state, currentConvo: undefined }),
        addMessageHistory: (state, action: PayloadAction<Message[]>) => {
            if (!state.currentConvo) return state;
            const mIds = state.currentConvo.messages.map((m) => m.id);
            return {
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    messages: [
                        ...state.currentConvo.messages,
                        ...action.payload.filter((m) =>
                        !mIds.includes(m.id))
                    ]
                }
            };
        },
        sendNewMessage: (state, action: PayloadAction<{
            socket: Socket, message: Message
        }>) => {
            const { socket, message } = action.payload;
            if (state.currentConvo) {
                socket.emit('newMessage', state.currentConvo.id, message);
                return ({
                    ...state,
                    currentConvo: {
                            ...state.currentConvo,
                            messages: [message, ...state.currentConvo.messages]
                        }
                });
            }
            return state;
        },
        receiveNewMessage: (state, action: PayloadAction<{
            message: Message, cid?: string
        }>) => {
            if (!state.currentConvo) return state;
            const { message, cid } = action.payload;
            if ((state.currentConvo.messages.map(m => m.id).includes(message.id)) || (cid && cid !== state.currentConvo.id)) return state;
            return ({
                ...state,
                needsScroll: true,
                currentConvo: {
                  ...state.currentConvo,
                    messages: [message, ...state.currentConvo.messages]
                }
            });
        },
        modifyConversationSettings: (state, action: PayloadAction<any>) => {
            if (!state.currentConvo) return state;
            return ({
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    settings: action.payload
                }
            })
        },
        addParticipant: (state, action: PayloadAction<UserConversationProfile>) => {
            if (!state.currentConvo) return state;
            return ({
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    participants:  [...state.currentConvo.participants, action.payload]
                }
            })
        },
        removeParticipant: (state, action: PayloadAction<UserConversationProfile>) => {
            if (!state.currentConvo) return state;
            return ({
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    participants:  state.currentConvo.participants.filter(p => p.id !== action.payload.id)
                }
            })
        },
        sendNewLike: (state, action: PayloadAction<{
            socket: Socket, messageId: string, userId: string
        }>) => {
            if (!state.currentConvo) return state;
            const { socket, messageId, userId } = action.payload;
            let type= 'newLike';
            const newState = ({
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    messages: [...state.currentConvo.messages].map(m => {
                        if (m.id === messageId) {
                            const prevLikes = m.likes.filter(l => l !== userId);
                            if (m.likes.length > prevLikes.length) {
                                type='disLike';
                                return {
                                    ...m,
                                    likes: prevLikes
                                }
                            } else {
                                return {
                                    ...m,
                                    likes: [...m.likes, userId]
                                }
                            }
                        }
                        return m;
                    })
                }
            });
            if (socket) {
                const event: SocketEvent = {
                    id: uuid.v4() as string,
                    type,
                    timestamp: new Date()
                }
                socket.emit('newLikeEvent', state.currentConvo.id, messageId, event);
            }
            return newState;
        },
        receiveNewLike: (state, action: PayloadAction<{
            messageId: string, userId: string, event: SocketEvent
        }>) => {
            const { messageId, userId, event } = action.payload;
            console.log('liking message');
            console.log(state.currentConvo?.messages.map((m) => m.id));
            if (!state.currentConvo) return state;
            console.log('currentConvo exists');
            return ({
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    messages: [...state.currentConvo.messages].map(m => {
                        if (m.id === messageId) {
                            const prevLikes = m.likes.filter(l => l !== userId);
                            if (m.likes.length > prevLikes.length && (event.type === 'disLike')) {
                                return {
                                    ...m,
                                    likes: prevLikes
                                }
                            } else if (event.type ==='newLike' && !(userId in m.likes)) {
                                return {
                                    ...m,
                                    likes: [...m.likes, userId]
                                }
                            }
                        }
                        return m;
                    })
                }
            });
        },
        updateAvatar: (state, action: PayloadAction<any>) => {
            if (!state.currentConvo) return state;
            return ({
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    avatar: action.payload
                }
            });
        },
        setNeedsScroll: (state, action: PayloadAction<boolean>) => {
            return ({
                ...state,
                needsScroll: action.payload
            });
        },
        setRequestLoading: (state, action: PayloadAction<boolean>) => {
            return ({
               ...state,
                requestLoading: action.payload
            });
        },
        setRequestCursor: (state, action: PayloadAction<string | undefined>) => {
            return ({
              ...state,
                requestCursor: action.payload
            });
        },
        handleUpdatedProfile: (state, action: PayloadAction<UserConversationProfile>) => {
            if (!state.currentConvo) return state;
            return ({
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    participants: [
                        ...state.currentConvo.participants.filter((p) => p.id !== action.payload.id),
                        action.payload
                    ]
                }
            });
        }
    }
});
export const { 
    setConvo,
    exitConvo,
    addMessageHistory,
    sendNewMessage,
    receiveNewMessage,
    sendNewLike,
    receiveNewLike,
    modifyConversationSettings,
    addParticipant,
    removeParticipant,
    updateAvatar,
    setNeedsScroll,
    setRequestLoading,
    setRequestCursor,
    handleUpdatedProfile
 } = chatSlice.actions;

export const pullConversation = (cid: string, api: ConversationsApi): ThunkAction<void, RootState, unknown, any> => async (dispatch) => {
    try {
        dispatch(setRequestLoading(true));

        const cursorContainer: CursorContainer = { cursor: null };
        const apiConvo = await api.getConversation(cid, cursorContainer);
        if (cursorContainer.cursor && cursorContainer.cursor !== 'none') {
            dispatch(setRequestCursor(cursorContainer.cursor));
        } else {
            dispatch(setRequestCursor(undefined));
        }
        dispatch(setConvo(apiConvo));
        dispatch(setRequestLoading(false));
    } catch (err) {
        console.log(err);
        return;
    }
};

export const loadAdditionalMessages = (api: ConversationsApi): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo, requestCursor } = getState().chatReducer;
    if (!currentConvo) return;

    dispatch(setRequestLoading(true))
    const cursorContainer: CursorContainer = { cursor: requestCursor || null };
    const additionalMessages: Message[] = await api.getConversationMessages(currentConvo.id, cursorContainer);
    if (cursorContainer.cursor && cursorContainer.cursor !== 'none') {
        dispatch(setRequestCursor(cursorContainer.cursor));
    } else {
        dispatch(setRequestCursor(undefined));
    }
    dispatch(addMessageHistory(additionalMessages));
    dispatch(setRequestLoading(false));
};

export const loadMessagesToDate = (date: Date, api: ConversationsApi): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo, requestCursor } = getState().chatReducer;
    if (!currentConvo) return;

    dispatch(setRequestLoading(true))
    const cursorContainer: CursorContainer = { cursor: requestCursor || null };
    const additionalMessages: Message[] = await api.getConversationMessagesToDate(currentConvo.id, date, cursorContainer);
    if (cursorContainer.cursor && cursorContainer.cursor !== 'none') {
        dispatch(setRequestCursor(cursorContainer.cursor));
    } else {
        dispatch(setRequestCursor(undefined));
    }
    dispatch(addMessageHistory(additionalMessages));
    dispatch(setRequestLoading(false));
};

export const updateConversationProfile = (updatedProfile: UserConversationProfile, api: ConversationsApi): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo } = getState().chatReducer;
    if (!currentConvo) return;

    dispatch(setRequestLoading(true));
    try {
        console.log('updating profile');
        const res = await api.updateConversationProfile(currentConvo.id, updatedProfile);
        if (res) {
            dispatch(handleUpdatedProfile(updatedProfile));
            dispatch(setRequestLoading(false));
        }
    } catch (err) {
        console.log(err);
        dispatch(setRequestLoading(false));
        return;
    }
};

const chatReducer = chatSlice.reducer;
export const chatSelector = (state: RootState) => state.chatReducer;
export default chatReducer;