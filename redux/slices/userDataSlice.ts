import { createSlice, PayloadAction, ThunkAction } from '@reduxjs/toolkit';
import { Message, ConversationPreview, Conversation, AvatarImage, UserData } from '../../types/types';
import { RootState } from '../store';
import { Socket } from 'socket.io-client';
import { UsersApi } from '../../requests/usersApi';
import { ConversationsApi } from '../../requests/conversationsApi';
import { getNewContacts } from '../../utils/messagingUtils';

const initialState: {
    userConversations: ConversationPreview[];
    lastReceivedMessageId: string;
    needsServerSync: boolean;
    requestLoading: boolean;
    contacts?: string[];
    archivedConvos?: string[];
} = {
    userConversations: [],
    lastReceivedMessageId: '',
    needsServerSync: false,
    requestLoading: false,
};

export const userDataSlice = createSlice({
    name: 'userConversations',
    initialState,
    reducers: {
        initReduxUser: (state, action: PayloadAction<UserData>) => ({
            ...state,
            userConversations: action.payload.conversations || [],
            contacts: action.payload.contacts || [],
            archivedConvos: action.payload.archivedConvos || [],
        }),
        setConversations: (state, action: PayloadAction<ConversationPreview[]>) => {
            return ({
                ...state,
                userConversations: action.payload
            })
        },
        setContacts: (state, action: PayloadAction<string[] | undefined>) => ({
            ...state,
            contacts: action.payload
        }),
        setArchivedConvos: (state, action: PayloadAction<string[] | undefined>) => ({
            ...state,
            archivedConvos: action.payload
        }),
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
            let recipientId: string | undefined = undefined;
            if (!newConvo.group && newConvo.participants.length > 1) {
                const otherParticipant = newConvo.participants.filter((p) => p.id !== uid)[0];
                name = otherParticipant.displayName;
                recipientId = otherParticipant.id;
            }
            const newContacts = getNewContacts(newConvo.participants.map((p) => p.id), uid, state.contacts || []);
            return ({
                ...state,
                userConversations: [
                    ...state.userConversations, 
                    {
                        cid: newConvo.id,
                        name,
                        lastMessageContent: lastMessage ? lastMessage.content : '',
                        lastMessageTime: lastMessage ? lastMessage?.timestamp : new Date(),
                        unSeenMessages: 0,
                        avatar: newConvo.avatar,
                        recipientId
                    }
                ],
                contacts: [...(state.contacts || []), ...newContacts],
                archivedConvos: state.archivedConvos?.filter((c) => c !== newConvo.id)
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
        handleUserConvoLeave: (state, action: PayloadAction<string>) => {
            const cid = action.payload;
            return {
                ...state,
                userConversations: state.userConversations.filter((c) => c.cid !== cid),
                archivedConvos: [
                    ...(state.archivedConvos || []),
                    cid
                ] || undefined
            }
        },
        handleArchiveConvoRemoval: (state, action: PayloadAction<string>) => {
            const cid = action.payload;
            return {
                ...state,
                archivedConvos: state.archivedConvos?.filter((c) => c !== cid)
            }
        }
    }
});

const userDataReducer = userDataSlice.reducer;

export const {
    initReduxUser,
    setConversations,
    setContacts,
    setArchivedConvos,
    handleNewMessage,
    deleteConversation,
    addConversation,
    readConversationMessages,
    setNeedsServerSync,
    setRequestLoading,
    handleUpdatedChat,
    handleUserConvoLeave,
    handleArchiveConvoRemoval
} = userDataSlice.actions;

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
        console.log(updatedUser);
        if (updatedUser) {
            updatedUser.conversations && dispatch(setConversations(updatedUser.conversations));
            dispatch(setContacts(updatedUser.contacts || []));
            dispatch(setArchivedConvos(updatedUser.archivedConvos || []));
        }
        dispatch(setRequestLoading(false)); 
    } catch (err) {
        console.log(err);
        dispatch(setRequestLoading(false));
    }
};

export const joinConversation = (cid: string, conversationsApi: ConversationsApi, usersApi: UsersApi, onComplete?: () => void): ThunkAction<void, RootState, any, any> => async (dispatch) => {
    try {
        dispatch(setRequestLoading(true));
        await conversationsApi.joinChat(cid);
        dispatch(handleArchiveConvoRemoval(cid));
        dispatch(pullLatestPreviews(usersApi));
        onComplete && onComplete();
    } catch (err) {
        dispatch(setRequestLoading(false));
        console.log(err);
    }
};

export const removeArchivedConvo = (cid: string, usersApi: UsersApi, onComplete?: () => void): ThunkAction<void, RootState, any, any> => async (dispatch) => {
    try {
        dispatch(setRequestLoading(true));
        await usersApi.removeArchivedConvo(cid);
        dispatch(handleArchiveConvoRemoval(cid));
        dispatch(pullLatestPreviews(usersApi));
        onComplete && onComplete();
    } catch (err) {
        dispatch(setRequestLoading(false));
        console.log(err);
    }
};

export const userDataSelector = (state: RootState) => state.userDataReducer;
export default userDataReducer;