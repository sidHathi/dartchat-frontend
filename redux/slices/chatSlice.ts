import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Conversation, Message, UserConversationProfile, SocketEvent } from "../../types/types";
import { RootState } from "../store";
import { Socket } from "socket.io-client";
import uuid from 'react-native-uuid';

const initialState: {
    currentConvo?: Conversation;
    needsScroll: boolean;
} = {
    needsScroll: false,
};

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setConvo: (state, action: PayloadAction<Conversation | undefined>) => (
            {...state, currentConvo: action.payload}
        ),
        exitConvo: (state) => ({ ...state, currentConvo: undefined }),
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
                            messages: [...state.currentConvo.messages, message]
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
                    messages: [...state.currentConvo.messages, message]
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
                            } else if (event.type ==='newLike') {
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
            })
        },
    }
});

const chatReducer = chatSlice.reducer;

export const { 
    setConvo,
    exitConvo,
    sendNewMessage,
    receiveNewMessage,
    sendNewLike,
    receiveNewLike,
    modifyConversationSettings,
    addParticipant,
    removeParticipant,
    updateAvatar,
    setNeedsScroll
 } = chatSlice.actions;
export const chatSelector = (state: RootState) => state.chatReducer;
export default chatReducer;