import { createSlice, PayloadAction, ThunkAction } from '@reduxjs/toolkit';
import { Message, ConversationPreview, Conversation, AvatarImage } from '../../types/types';
import { RootState } from '../store';
import { Socket } from 'socket.io-client';
import { UsersApi } from '../../requests/usersApi';
import { ConversationsApi } from '../../requests/conversationsApi';

const initialState: {
    userConversations: ConversationPreview[];
    lastReceivedMessageId: string;
    needsServerSync: boolean;
    requestLoading: boolean;
} = {
    userConversations: [],
    lastReceivedMessageId: '',
    needsServerSync: false,
    requestLoading: false
};

export const userConversationsSlice = createSlice({
    name: 'userConversations',
    initialState,
    reducers: {
        setConversations: (state, action: PayloadAction<ConversationPreview[]>) => {
            return ({
                ...state,
                userConversations: action.payload
            })
        },
        handleNewMessage: (state, action: PayloadAction<{
            cid: string, message: Message, messageForCurrent: boolean
        }>) => {
            console.log('handling new message');
            const { cid, message, messageForCurrent } = action.payload;
            const matches = state.userConversations.filter((c) => c.cid === cid);
            if (matches.length > 0 && message.id !== state.lastReceivedMessageId) {
                const convoToUpdate = matches[0];
                const updatedConvo = {
                    ...convoToUpdate,
                    unSeenMessages: messageForCurrent ? 0 : convoToUpdate.unSeenMessages + 1,
                    lastMessageContent: message.content,
                    lastMessageTime: message.timestamp
                };
                return ({
                    ...state,
                    needsServerSync: true,
                    userConversations: state.userConversations.map((c) => c.cid === cid ? updatedConvo : c),
                    lastReceivedMessageId: messageForCurrent ? state.lastReceivedMessageId : message.id
                })
            }
            return state;
        },
        deleteConversation: (state, action: PayloadAction<string>): any => {
            return ({
              ...state,
                needsServerSync: true,
                userConversations: state.userConversations.filter((c) => c.cid !== action.payload)
            });
        },
        addConversation: (state, action: PayloadAction<{
            newConvo: Conversation,
            uid: string
        }>) => {
            console.log('adding conversation');
            const { newConvo, uid } = action.payload;
            if (state.userConversations.map((c) => c.cid).includes(newConvo.id)) return state;
            const lastMessage = newConvo.messages.length > 0 ? newConvo.messages[newConvo.messages.length - 1] : undefined;
            let name = newConvo.name;
            if (!newConvo.group && newConvo.participants.length > 1) {
                name = newConvo.participants.filter((p) => p.id !== uid)[0].displayName;
            }
            return ({
                ...state,
                userConversations: [
                    ...state.userConversations, 
                    {
                        cid: newConvo.id,
                        name: newConvo.name,
                        lastMessageContent: lastMessage ? lastMessage.content : '',
                        lastMessageTime: lastMessage ? lastMessage?.timestamp : new Date(),
                        unSeenMessages: 0,
                        avatar: newConvo.avatar
                    }
                ]
            });
        },
        readConversationMessages: (state, action: PayloadAction<string>) => {
            const cid: string = action.payload;
            return ({
                ...state,
                needsServerSync: true,
                userConversations: state.userConversations.map((c) => {
                    if (c.cid === cid) {
                        return {
                            ...c,
                            needsServerSync: true,
                            unSeenMessages: 0
                        }
                    }
                    return c;
                })
            })
        },
        setNeedsServerSync: (state, action: PayloadAction<boolean>) => {
            return ({
                ...state,
                needsServerSync: action.payload
            });
        },
        setRequestLoading: (state, action: PayloadAction<boolean>) => {
            return ({
                ...state,
                requestLoading: action.payload
            });
        },
        handleUpdatedChat: (state, action: PayloadAction<{
            cid: string
            newName?: string,
            newAvatar?: AvatarImage,
        }>) => {
            const matches = state.userConversations.filter((c) => c.cid === action.payload.cid);
            if (matches.length < 1) return state;
            const updatedPreview: ConversationPreview = {
                ...matches[0],
                name: action.payload.newName || matches[0].name,
                avatar: action.payload.newAvatar || matches[0].avatar
            };
            return {
                ...state,
                userConversations: [
                    updatedPreview,
                    ...state.userConversations.filter((c) => c.cid !== action.payload.cid)
                ]
            };
        },
        leaveConversation: (state, action: PayloadAction<string>) => {
            const cid = action.payload;
            return {
                ...state,
                userConversations: state.userConversations.filter((c) => c.cid !== cid)
            }
        }
    }
});

const userConversationsReducer = userConversationsSlice.reducer;

export const {
    setConversations,
    handleNewMessage,
    deleteConversation,
    addConversation,
    readConversationMessages,
    setNeedsServerSync,
    setRequestLoading,
    handleUpdatedChat
} = userConversationsSlice.actions;

export const handleConversationDelete = (cid: string, conversationsApi: ConversationsApi): ThunkAction<void, RootState, any, any> => async (dispatch) => {
    try {
        dispatch(setRequestLoading(true));
        await conversationsApi.deleteConversation(cid);
        dispatch(deleteConversation(cid));
        dispatch(setRequestLoading(false));
    } catch (err) {
        dispatch(setRequestLoading(false));
        console.log(err);
    }
};

export const pullLatestPreviews = (usersApi: UsersApi): ThunkAction<void, RootState, any, any> => async (dispatch) => {
    dispatch(setRequestLoading(true));

    try {
        const updatedUser = await usersApi.getCurrentUser();
        if (updatedUser && updatedUser.conversations) {
            dispatch(setConversations(updatedUser.conversations));
        }
        dispatch(setRequestLoading(false)); 
    } catch (err) {
        console.log(err);
        dispatch(setRequestLoading(false));
    }
};

export const joinConversation = (cid: string, conversationsApi: ConversationsApi, usersApi: UsersApi): ThunkAction<void, RootState, any, any> => async (dispatch) => {
    try {
        dispatch(setRequestLoading(true));
        await conversationsApi.joinChat(cid);
        dispatch(pullLatestPreviews(usersApi));
    } catch (err) {
        dispatch(setRequestLoading(false));
        console.log(err);
    }
}

export const userConversationsSelector = (state: RootState) => state.userConversationsReducer;
export default userConversationsReducer;