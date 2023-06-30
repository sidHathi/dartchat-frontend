import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, ConversationPreview, Conversation } from '../../types/types';
import { RootState } from '../store';
import { Socket } from 'socket.io-client';

const initialState: {
    userConversations: ConversationPreview[];
    lastReceivedMessageId: string;
    needsServerSync: boolean;
} = {
    userConversations: [],
    lastReceivedMessageId: '',
    needsServerSync: false,
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
        addConversation: (state, action: PayloadAction<Conversation>) => {
            console.log('adding conversation');
            if (state.userConversations.map((c) => c.cid).includes(action.payload.id)) return state;
            const lastMessage = action.payload.messages.length > 0 ? action.payload.messages[action.payload.messages.length - 1] : undefined;
            return ({
                ...state,
                userConversations: [
                    ...state.userConversations, 
                    {
                        cid: action.payload.id,
                        name: action.payload.name,
                        lastMessageContent: lastMessage ? lastMessage.content : '',
                        lastMessageTime: lastMessage ? lastMessage?.timestamp : new Date(),
                        unSeenMessages: 0,
                        avatar: action.payload.avatar
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
    setNeedsServerSync
} = userConversationsSlice.actions;
export const userConversationsSelector = (state: RootState) => state.userConversationsReducer;
export default userConversationsReducer;