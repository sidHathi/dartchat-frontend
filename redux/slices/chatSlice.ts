import { createSlice, PayloadAction, ThunkAction } from "@reduxjs/toolkit";
import { Conversation, Message, UserConversationProfile, SocketEvent, CursorContainer, NotificationStatus, ConversationPreview, LikeIcon, DecryptedMessage, DecryptedConversation, KeyInfo } from "../../types/types";
import { RootState } from "../store";
import { Socket } from "socket.io-client";
import uuid from 'react-native-uuid';
import { ConversationsApi } from "../../requests/conversationsApi";
import { AvatarImage } from "../../types/types";
import { filterEncryptedMessages, findPrivateMessageIdForUser, handlePossiblyEncryptedConversation, handlePossiblyEncryptedMessage } from "../../utils/messagingUtils";
import secureStore from "../../localStore/secureStore";
import { State } from "react-native-gesture-handler";

const initialState: {
    currentConvo?: DecryptedConversation;
    galleryMessages?: DecryptedMessage[];
    needsScroll: boolean;
    requestLoading: boolean;
    silent: boolean;
    messageCursor?: string;
    galleryCursor?: string;
    silentKeyMap?: { [key: string]: string };
    onSilentCreate?: () => void;
    secretKey?: Uint8Array;
} = {
    needsScroll: false,
    requestLoading: false,
    silent: false,
};

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setConvo: (state, action: PayloadAction<{
            convo?: Conversation,
            secretKey?: Uint8Array
        }>) => ({
            ...state, 
            silent: false, 
            currentConvo: action.payload.convo ?handlePossiblyEncryptedConversation(action.payload.convo, action.payload.secretKey) : undefined,
            secretKey: action.payload.secretKey,
            galleryMessages: undefined,
            galleryCursor: undefined,
        }),
        setConvoSilently: (state, action: PayloadAction<{
            convo: Conversation,
            secretKey?: Uint8Array,
            userKeyMap?: {[key: string]: string},
            onSilentCreate?: () => void;
        }>) => ({
            ...state, 
            currentConvo: handlePossiblyEncryptedConversation(action.payload.convo, action.payload.secretKey),
            secretKey: action.payload.secretKey,
            silent: true,
            messageCursor: undefined,
            galleryMessages: undefined,
            galleryCursor: undefined,
            silentKeyMap: action.payload.userKeyMap,
            onSilentCreate: action.payload.onSilentCreate
        }),
        exitConvo: (state) => ({
             ...state, 
             currentConvo: undefined, 
             requestLoading: false, 
             messageCursor: undefined,
             galleryMessages: undefined,
             galleryCursor: undefined,
             secretKey: undefined,
        }),
        addMessageHistory: (state, action: PayloadAction<Message[]>) => {
            if (!state.currentConvo) return state;
            const mIds = state.currentConvo.messages.map((m) => m.id);

            let decryptedMessages = action.payload as DecryptedMessage[];
            if (state.secretKey) {
                decryptedMessages = filterEncryptedMessages(decryptedMessages, state.secretKey);
            }
            return {
                ...state,
                silent: false,
                currentConvo: {
                    ...state.currentConvo,
                    messages: [
                        ...state.currentConvo.messages,
                        ...decryptedMessages.filter((m) =>
                        !mIds.includes(m.id))
                    ]
                }
            };
        },
        sendNewMessage: (state, action: PayloadAction<{
            socket: Socket,
            message: Message
        }>) => {
            const { socket, message } = action.payload;
            if (state.currentConvo) {
                if (state.silent) {
                    console.log(state.silentKeyMap);
                    socket.emit('newPrivateMessage', state.currentConvo, message, state.silentKeyMap);
                    state.onSilentCreate && state.onSilentCreate();
                    return {
                        ...state,
                        silent: false,
                        silentKeyMap: undefined,
                        onSilentCreate: undefined
                    };
                }

                let decrypted = message as DecryptedMessage;
                if (state.secretKey) {
                    const unsafeDecrypted = handlePossiblyEncryptedMessage(decrypted, state.secretKey);
                    if (!unsafeDecrypted) return state;
                    decrypted = unsafeDecrypted;
                }
                const keyInfo: KeyInfo | undefined = {...state.currentConvo.keyInfo} as KeyInfo | undefined;
                if (keyInfo && message.encryptionLevel === 'encrypted') {
                    keyInfo.numberOfMessages += 1;
                }
                socket.emit('newMessage', state.currentConvo.id, message);
                return ({
                    ...state,
                    currentConvo: {
                            ...state.currentConvo,
                            messages: [decrypted, ...state.currentConvo.messages],
                            keyInfo
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

            let decrypted = message as DecryptedMessage;
            if (state.secretKey) {
               const unsafeDecrypted = handlePossiblyEncryptedMessage(decrypted, state.secretKey);
               if (!unsafeDecrypted) return state;
               decrypted = unsafeDecrypted;
            }
            const keyInfo: KeyInfo | undefined = {...state.currentConvo.keyInfo} as KeyInfo | undefined;
            if (keyInfo && message.encryptionLevel === 'encrypted') {
                keyInfo.numberOfMessages += 1;
            }
            return ({
                ...state,
                needsScroll: true,
                currentConvo: {
                  ...state.currentConvo,
                    messages: [decrypted, ...state.currentConvo.messages]
                },
                keyInfo
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
            if (!state.currentConvo) return state;
            const message = state.currentConvo.messages.filter((m) => m.id === messageId).at(0);
            if (message && event.type === 'newLike' && message.likes.includes(userId)) return;
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
        setMessageCursor: (state, action: PayloadAction<string | undefined>) => {
            return ({
              ...state,
                messageCursor: action.payload
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
            newName?: string,
            newAvatar?: AvatarImage,
            newLikeIcon?: LikeIcon
        }>) => {
            if (!state.currentConvo) return state;
            return {
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    name: action.payload.newName || state.currentConvo.name,
                    avatar: action.payload.newAvatar || state.currentConvo.avatar,
                    customLikeIcon: action.payload.newLikeIcon || undefined
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
            const added = new Set<string>();
            const newProfiles = action.payload.filter((p) => {
                if (added.has(p.id)) return false;
                added.add(p.id);
                return !state.currentConvo?.participants.map((p) => p.id).includes(p.id)
            });
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
        },
        handleNewLikeIcon: (state, action: PayloadAction<LikeIcon | undefined>) => {
            if (!state.currentConvo) return state;
            return {
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    customLikeIcon: action.payload
                }
            }
        },
        handleNewGalleryMessages: (state, action: PayloadAction<DecryptedMessage[]>) => {
            if (!state.currentConvo) return state;
            const currGallery = state.galleryMessages || [];
            return {
                ...state,
                galleryMessages: [...currGallery, ...action.payload]
            }
        },
        setGalleryCursor: (state, action: PayloadAction<string | undefined>) => {
            return {
                ...state,
                galleryCursor: action.payload
            }
        },
        handleMessageDelivered: (state, action: PayloadAction<string>) => {
            if (!state.currentConvo) return;
            return {
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    messages: state.currentConvo.messages.map((m) => {
                        if (m.id === action.payload && !m.delivered) {
                            return {
                                ...m,
                                delivered: true
                            } as DecryptedMessage;
                        }
                        return m;
                    })
                }
            }
        },
        setSecretKey: (state, action: PayloadAction<Uint8Array>) => {
            if (!state.currentConvo || state.secretKey === action.payload) return;
            return {
                ...state,
                secretKey: action.payload
            };
        },
        setKeyInfo: (state, action: PayloadAction<KeyInfo>) => {
            if (!state.currentConvo) return;
            return {
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    keyInfo: action.payload
                }
            }
        },
        setCCPublicKey: (state, action: PayloadAction<string>) => {
            if (!state.currentConvo || state.currentConvo.publicKey === action.payload) return;
            return {
                ...state,
                currentConvo: {
                    ...state.currentConvo,
                    publicKey: action.payload
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
    setMessageCursor,
    handleUpdatedProfile,
    updateChatDetails,
    handleNewUserNotStatus,
    handleRemoveUser,
    handleAddUsers,
    handleNewLikeIcon,
    handleNewGalleryMessages,
    setGalleryCursor,
    handleMessageDelivered,
    setSecretKey,
    setKeyInfo,
    setCCPublicKey
 } = chatSlice.actions;

export const pullConversation = (cid: string, api: ConversationsApi, secretKey?: Uint8Array, onComplete?: () => void, onFailure?: () => void): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    try {
        const { secretKey: currSecretKey } = getState().chatReducer;
        dispatch(setRequestLoading(true));

        const cursorContainer: CursorContainer = { cursor: null };
        const apiConvo = await api.getConversation(cid, cursorContainer);
        if (cursorContainer.cursor && cursorContainer.cursor !== 'none') {
            dispatch(setMessageCursor(cursorContainer.cursor));
        } else {
            dispatch(setMessageCursor(undefined));
        }
        dispatch(setConvo({
            convo: apiConvo,
            secretKey: secretKey || currSecretKey
        }));
        dispatch(setRequestLoading(false));
        onComplete && onComplete();
    } catch (err) {
        console.log(err);
        dispatch(setRequestLoading(false));
        onFailure && onFailure();
        return;
    }
};

export const loadAdditionalMessages = (api: ConversationsApi): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo, messageCursor } = getState().chatReducer;
    if (!currentConvo) return;

    try {
        dispatch(setRequestLoading(true))
        const cursorContainer: CursorContainer = { cursor: messageCursor || null };
        const additionalMessages: Message[] = await api.getConversationMessages(currentConvo.id, cursorContainer);
        if (cursorContainer.cursor && cursorContainer.cursor !== 'none') {
            dispatch(setMessageCursor(cursorContainer.cursor));
        } else {
            dispatch(setMessageCursor(undefined));
        }
        dispatch(addMessageHistory(additionalMessages));
        dispatch(setRequestLoading(false));
    } catch (err) {
        console.log(err);
        dispatch(setRequestLoading(false));
    }
};

export const loadMessagesToDate = (date: Date, api: ConversationsApi): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo, messageCursor } = getState().chatReducer;
    if (!currentConvo) return;

    try {
        dispatch(setRequestLoading(true))
        const cursorContainer: CursorContainer = { cursor: messageCursor || null };
        const additionalMessages: Message[] = await api.getConversationMessagesToDate(currentConvo.id, date, cursorContainer);
        if (cursorContainer.cursor && cursorContainer.cursor !== 'none') {
            dispatch(setMessageCursor(cursorContainer.cursor));
        } else {
            dispatch(setMessageCursor(undefined));
        }
        dispatch(addMessageHistory(additionalMessages));
        dispatch(setRequestLoading(false));
    } catch (err) {
        console.log(err);
        dispatch(setRequestLoading(false));
    }
};

export const updateConversationProfile = (updatedProfile: UserConversationProfile, api: ConversationsApi): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo } = getState().chatReducer;
    if (!currentConvo) return;

    dispatch(setRequestLoading(true));
    try {
        // console.log('updating profile');
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
        // console.log('updating profile');
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
        // console.log('updating profile');
        const updatedConvo = await api.getConversationInfo(currentConvo.id);
        // console.log(updatedConvo);
        dispatch(updateChatDetails({
            newName: updatedConvo.name,
            newAvatar: updatedConvo.avatar,
            newLikeIcon: updatedConvo.customLikeIcon
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
        // console.log('notifications status updated');
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
    const newUsers = userProfiles.filter((profile) => {
       return !currentConvo.participants.includes(profile);
    });
    if (newUsers.length < 1) return;

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
        onComplete && onComplete();
    } catch (err) {
        console.log(err);
        setRequestLoading(false);
    }
};

export const openPrivateMessage = (seedConvo: Conversation, uid: string, userConversations: ConversationPreview[], api: ConversationsApi, recipientKeyMap?: {[key: string]: string}, secretKey?: Uint8Array, onSilentCreate?: () => void): ThunkAction<void, RootState, unknown, any> => async (dispatch) => {
    const recipientProfiles = seedConvo.participants.filter((p) => p.id !== uid);
    if (recipientProfiles.length < 1) return;
    const recipientProfile = recipientProfiles[0];
    const existingCid = findPrivateMessageIdForUser(recipientProfile, userConversations);
    if (!existingCid) {
        dispatch(setConvoSilently({
            convo: seedConvo,
            secretKey,
            userKeyMap: recipientKeyMap,
            onSilentCreate
        }));
    } else {
        dispatch(setConvo({}));
        const storedSecretKey = await secureStore.getSecretKeyForKey(uid, seedConvo.id)
        dispatch(pullConversation(existingCid, api, storedSecretKey));
    }
};

export const changeLikeIcon = (newLikeIcon: LikeIcon, api: ConversationsApi, onSuccess?: () => void): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo } = getState().chatReducer;
    if (!currentConvo) return;

    dispatch(setRequestLoading(true));
    try {
        await api.changeLikeIcon(currentConvo.id, newLikeIcon);
        dispatch(setRequestLoading(false));
        dispatch(handleNewLikeIcon(newLikeIcon));
        onSuccess && onSuccess();
    } catch (err) {
        setRequestLoading(false);
        console.log(err);
    }
};

export const resetLikeIcon = (api: ConversationsApi, onSuccess?: () => void): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo } = getState().chatReducer;
    if (!currentConvo) return;

    dispatch(setRequestLoading(true));
    try {
        await api.resetLikeIcon(currentConvo.id);
        dispatch(setRequestLoading(false));
        dispatch(handleNewLikeIcon(undefined));
        onSuccess && onSuccess();
    } catch (err) {
        setRequestLoading(false);
        console.log(err);
    }
};

export const pullGallery = (api: ConversationsApi): ThunkAction<void, RootState, unknown, any> => async (dispatch, getState) => {
    const { currentConvo, galleryCursor } = getState().chatReducer;
    if (!currentConvo) return;

    dispatch(setRequestLoading(true))
    try {
        const cursorContainer: CursorContainer = { cursor: galleryCursor || null };
        const messages: Message[] = await api.getGallery(currentConvo.id, cursorContainer);
        if (cursorContainer.cursor && cursorContainer.cursor !== 'none') {
            dispatch(setGalleryCursor(cursorContainer.cursor));
        } else {
            dispatch(setGalleryCursor(undefined));
        }
        dispatch(handleNewGalleryMessages(messages as DecryptedMessage[]));
        dispatch(setRequestLoading(false));
    } catch (err) {
        dispatch(setRequestLoading(false));
        console.log(err);
    }
};

const chatReducer = chatSlice.reducer;
export const chatSelector = (state: RootState) => state.chatReducer;
export default chatReducer;