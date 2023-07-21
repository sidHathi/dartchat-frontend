import { createSlice, PayloadAction, ThunkAction } from "@reduxjs/toolkit";
import { Conversation, Message, UserConversationProfile, SocketEvent, CursorContainer, NotificationStatus, ConversationPreview } from "../../types/types";
import { RootState } from "../store";
import { Socket } from "socket.io-client";
import uuid from 'react-native-uuid';
import { ConversationsApi } from "../../requests/conversationsApi";
import { AvatarImage } from "../../types/types";
import { findPrivateMessageIdForUser } from "../../utils/messagingUtils";

const initialState: {
    currentConvo?: Conversation;
    needsScroll: boolean;
    requestLoading: boolean;
    silent: boolean;
    requestCursor?: string;
} = {
    needsScroll: false,
    requestLoading: false,
    silent: false,
};

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setConvo: (state, action: PayloadAction<Conversation | undefined>) => (
            {...state, silent: false, currentConvo: action.payload}
        ),
        setConvoSilently: (state, action: PayloadAction<Conversation>) => ({
            ...state, 
            currentConvo: action.payload,
            silent: true,
            requestCursor: undefined,
        }),
        exitConvo: (state) => ({ ...state, currentConvo: undefined , requestLoading: false, requestCursor: undefined}),
        addMessageHistory: (state, action: PayloadAction<Message[]>) => {
            if (!state.currentConvo) return state;
            const mIds = state.currentConvo.messages.map((m) => m.id);
            return {
                ...state,
                silent: false,
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
                if (state.silent) {
                    socket.emit('newPrivateMessage', state.currentConvo, message);
                    return {
                        ...state,
                        silent: false
                    };
                }
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
            const message = state.currentConvo.messages.filter((m) => m.id === messageId).at(0);
            if (message && event.type === 'newLike' && message.likes.includes(userId)) return;
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
        },
        updateChatDetails: (state, action: PayloadAction<{
            newName?: string;
            newAvatar?: AvatarImage
        }>) => {
            if (!state.currentConvo) return state;
            return {
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    name: action.payload.newName || state.currentConvo.name,
                    avatar: action.payload.newAvatar || state.currentConvo.avatar
                }
            }
        },
        handleNewUserNotStatus: (state, action: PayloadAction<{
            newStatus: NotificationStatus,
            uid: string
        }>) => {
            if (!state.currentConvo) return state;
            const matchingProfiles = state.currentConvo.participants.filter((p) => p.id === action.payload.uid);
            if (matchingProfiles.length > 0) {
                const updatedProfile = {
                    ...matchingProfiles[0],
                    notifications: action.payload.newStatus
                };
                return {
                    ...state,
                    currentConvo: {
                        ...state.currentConvo,
                        participants: [
                            updatedProfile,
                            ...state.currentConvo.participants.filter((p) => p.id !== action.payload.uid)
                        ]
                    }
                };
            }
            return state;
        },
        handleRemoveUser: (state, action: PayloadAction<string>) => {
            if (!state.currentConvo) return state;
            const uid = action.payload;
            return {
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    participants: state.currentConvo.participants.filter((p) => p.id !== uid)
                }
            }
        },
        handleAddUsers: (state, action: PayloadAction<UserConversationProfile[]>) => {
            if (!state.currentConvo) return state;
            const newProfiles = action.payload;
            return {
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    participants: [
                        ...state.currentConvo.participants,
                        ...newProfiles
                    ]
                }
            }
        }
    }
});
export const { 
    setConvo,
    setConvoSilently,
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
    handleUpdatedProfile,
    updateChatDetails,
    handleNewUserNotStatus,
    handleRemoveUser,
    handleAddUsers
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

export const updateConversationDetails = (updates: {newAvatar?: AvatarImage, newName?: string}, api: ConversationsApi, onSuccess?: () => void): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo } = getState().chatReducer;
    if (!currentConvo) return;

    dispatch(setRequestLoading(true));
    try {
        console.log('updating profile');
        await api.updateConversationDetails(currentConvo.id, updates);
        dispatch(updateChatDetails(updates));
        onSuccess && onSuccess();
        dispatch(setRequestLoading(false));
    } catch (err) {
        console.log(err);
        dispatch(setRequestLoading(false));
        return;
    }
};

export const pullConversationDetails = (api: ConversationsApi): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo } = getState().chatReducer;
    if (!currentConvo) return;

    dispatch(setRequestLoading(true));
    try {
        console.log('updating profile');
        const updatedConvo = await api.getConversationInfo(currentConvo.id);
        dispatch(updateChatDetails({
            newName: updatedConvo.name,
            newAvatar: updatedConvo.avatar
        }));
        dispatch(setRequestLoading(false));
    } catch (err) {
        console.log(err);
        dispatch(setRequestLoading(false));
        return;
    }
};

export const updateUserNotStatus = (uid: string, newStatus: NotificationStatus, api: ConversationsApi): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo } = getState().chatReducer;
    if (!currentConvo) return;

    dispatch(setRequestLoading(true));
    try {
        const cid = currentConvo.id;
        await api.updateUserNotStatus(cid, newStatus);
        dispatch(handleNewUserNotStatus({uid, newStatus}));
        console.log('notifications status updated');
        dispatch(setRequestLoading(false));
    } catch (err) {
        console.log(err);
        setRequestLoading(false);
    }
};

export const removeUser = (uid: string, api: ConversationsApi, onComplete?: () => void): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo } = getState().chatReducer;
    if (!currentConvo) return;

    dispatch(setRequestLoading(true));
    try {
        await api.removeConversationUser(currentConvo.id, uid);
        dispatch(handleRemoveUser(uid));
        dispatch(setRequestLoading(false));
        onComplete && onComplete();
    } catch (err) {
        console.log(err);
        setRequestLoading(false);
    }
};

export const addUsers = (userProfiles: UserConversationProfile[], api: ConversationsApi, onComplete?: () => void): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo } = getState().chatReducer;
    if (!currentConvo) return;

    dispatch(setRequestLoading(true));
    try {
        await api.addConversationUsers(currentConvo.id, userProfiles);
        dispatch(handleAddUsers(userProfiles));
        dispatch(setRequestLoading(false));
        onComplete && onComplete();
    } catch (err) {
        console.log(err);
        setRequestLoading(false);
    }
};

export const leaveChat = (uid: string, api: ConversationsApi, onComplete?: () => void): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo } = getState().chatReducer;
    if (!currentConvo) return;

    dispatch(setRequestLoading(true));
    try {
        await api.leaveChat(currentConvo.id);
        dispatch(handleRemoveUser(uid));
        dispatch(setRequestLoading(false));
    } catch (err) {
        console.log(err);
        setRequestLoading(false);
    }
};

export const openPrivateMessage = (seedConvo: Conversation, uid: string, userConversations: ConversationPreview[], api: ConversationsApi): ThunkAction<void, RootState, unknown, any> => (dispatch) => {
    const recipientProfiles = seedConvo.participants.filter((p) => p.id !== uid);
    if (recipientProfiles.length < 1) return;
    const recipientProfile = recipientProfiles[0];
    const existingCid = findPrivateMessageIdForUser(recipientProfile, userConversations);
    if (!existingCid) {
        dispatch(setConvoSilently(seedConvo));
    } else {
        dispatch(setConvo(undefined));
        dispatch(pullConversation(existingCid, api));
    }
};

const chatReducer = chatSlice.reducer;
export const chatSelector = (state: RootState) => state.chatReducer;
export default chatReducer;