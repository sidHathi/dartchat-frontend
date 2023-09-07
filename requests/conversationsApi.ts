import { ApiService } from "./request";
import { AvatarImage, CalendarEvent, ChatRole, Conversation, CursorContainer, KeyInfo, LikeIcon, Message, NotificationStatus, Poll, UserConversationProfile } from "../types/types";
import { parseConversation, parseSocketMessage, addCursorToRequest, parseEvent } from "../utils/requestUtils";
import { SocketMessage } from "../types/rawTypes";

export type ConversationsApi = {
    getConversation: (cid: string, cursorContainer?: CursorContainer) => Promise<Conversation | never>;
    getConversationInfo: (cid: string) => Promise<Conversation | never>;
    getConversationMessages: (cid: string, cursorContainer?: CursorContainer) => Promise<Message[]>;
    getConversationMessagesToDate: (cid: string, date: Date, cursorContainer?: CursorContainer) => Promise<Message[]>;
    getMessage: (cid: string, mid: string) => Promise<Message | never>;
    deleteConversation: (cid: string) => Promise<any | never>;
    updateConversationProfile: (cid: string, newProfile: UserConversationProfile) => Promise<any | never>;
    updateConversationDetails: (cid: string, newDetails: {
        newName?: string,
        newAvatar?: AvatarImage
    }) => any;
    updateUserNotStatus: (cid: string, newStatus: NotificationStatus) => Promise<any | never>;
    addConversationUsers: (cid: string, newUsers: UserConversationProfile[], userKeyMap?: { [id: string]: string }) => Promise<any | never>;
    removeConversationUser: (cid: string, userId: string) => Promise<any | never>;
    leaveChat: (cid: string) => Promise<any | never>;
    joinChat: (cid: string) => Promise<any | never>;
    addPoll: (cid: string, poll: Poll) => Promise<any | never>;
    getPoll: (cid: string, pid: string) => Promise<Poll | never>;
    addEvent: (cid: string, event: CalendarEvent) => Promise<any | never>;
    getEvent: (cid: string, eid: string) => Promise<CalendarEvent | never>;
    changeLikeIcon: (cid: string, newIcon: LikeIcon) => Promise<any | never>;
    resetLikeIcon: (cid: string) => Promise<any | never>;
    getGallery: (cid: string, cursorContainer?: CursorContainer) => Promise<Message[] | never>;
    getConversationsForIds: (ids: string[]) => Promise<Conversation[] | never>;
    getEncryptionData: (id: string, dateLimit?: Date) => Promise<{
        minDate: Date;
        data: {
            id: string;
            encryptedFields: string;
            publicKey: string;
        }[];
    } | never>;
    changeEncryptionKey: (
        cid: string, 
        publicKey: string,
        userKeyMap: { [id: string]: string },
        keyInfo?: KeyInfo) => Promise<any | never>;
    pushReencryptedMessages: (cid: string, newData: {
        minDate: Date;
        data: {
            id: string;
            encryptedFields: string;
            publicKey: string;
        }[];
    }) => Promise<any | never>;
    deleteMessage: (cid: string, mid: string) => Promise<any | never>;
    updateUserRole: (cid: string, uid: string, newStatus: ChatRole) => Promise<any | never>;
}

export default function conversationsApi(apiService: ApiService): ConversationsApi {
    const getConversation = (cid: string, cursorContainer?: CursorContainer) => {
        return apiService.request(addCursorToRequest({
            method: 'GET',
            url: `/conversations/${cid}`
        }, cursorContainer))
        .then((res) => {
            if (res && res.data) {
                if (cursorContainer && 'cursor' in res.headers) {
                    cursorContainer.cursor = res.headers.cursor;
                } else if (cursorContainer) {
                    cursorContainer.cursor = null;
                }
                return parseConversation(res.data) as Conversation;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const getConversationInfo = (cid: string) => {
        return apiService.request({
            method: 'GET',
            url: `/conversations/${cid}/info`
        })
        .then((res) => {
            if (res && res.data) {
                return parseConversation(res.data) as Conversation;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const getConversationMessages = (cid: string, cursorContainer?: CursorContainer) => {
        return apiService.request(addCursorToRequest({
            method: 'GET',
            url: `/conversations/${cid}/messages`
        }, cursorContainer))
        .then((res) => {
            if (res && res.data) {
                if (cursorContainer && 'cursor' in res.headers) {
                    cursorContainer.cursor = res.headers.cursor;
                } else if (cursorContainer) {
                    cursorContainer.cursor = null;
                }
                return (res.data as SocketMessage[]).map((m) => parseSocketMessage(m));
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const getConversationMessagesToDate = (cid: string, date: Date, cursorContainer?: CursorContainer) => {
        return apiService.request(addCursorToRequest({
            method: 'POST',
            url: `/conversations/${cid}/messagesToDate`,
            data: {
                date
            }
        }, cursorContainer))
        .then((res) => {
            if (res && res.data) {
                if (cursorContainer && 'cursor' in res.headers) {
                    cursorContainer.cursor = res.headers.cursor;
                } else if (cursorContainer) {
                    cursorContainer.cursor = null;
                }
                return (res.data as SocketMessage[]).map((m) => parseSocketMessage(m));
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const getMessage = (cid: string, mid: string): Promise<Message | never> => {
        return apiService.request({
            method: 'GET',
            url: `/conversations/${cid}/messages/${mid}`
        })
        .then((res) => {
            if (res && res.data) {
                return parseSocketMessage(res.data as SocketMessage);
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const deleteConversation = (cid: string) => {
        return apiService.request({
            method: 'DELETE',
            url: `/conversations/delete/${cid}`
        })
        .then((res) => {
            if (res && res.data) {
                return res.data;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const updateConversationProfile = (cid: string, newProfile: UserConversationProfile) => {
        return apiService.request({
            method: 'POST',
            url: `/conversations/${cid}/updateProfile`,
            data: newProfile
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const updateConversationDetails = (cid: string, newDetails: {
        newName?: string,
        newAvatar?: AvatarImage
    }) => {
        return apiService.request({
            method: 'PUT',
            url: `/conversations/${cid}/updateDetails`,
            data: newDetails
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const updateUserNotStatus = (cid: string, newStatus: NotificationStatus) => {
        return apiService.request({
            method: 'PUT',
            url: `/conversations/${cid}/updateNotStatus`,
            data: {
                status: newStatus
            }
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const addConversationUsers = (cid: string, newUsers: UserConversationProfile[], userKeyMap?: { [id: string]: string }) => {
        return apiService.request({
            method: 'PUT',
            url: `/conversations/${cid}/addUsers`,
            data: {
                profiles: newUsers,
                userKeyMap
            }
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
        })
        .catch((err) => Promise.reject(err));
    };

    const removeConversationUser = (cid: string, userId: string) => {
        return apiService.request({
            method: 'PUT',
            url: `/conversations/${cid}/removeUser`,
            data: {
                userId
            }
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const leaveChat = (cid: string) => {
        return apiService.request({
            method: 'PUT',
            url: `/conversations/${cid}/leave`
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const joinChat = (cid: string) => {
        return apiService.request({
            method: 'PUT',
            url: `/conversations/${cid}/join`
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const addPoll = (cid: string, poll: Poll) => {
        return apiService.request({
            method: 'POST',
            url: `/conversations/${cid}/addPoll`,
            data: poll
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const getPoll = (cid: string, pid: string) => {
        return apiService.request({
            method: 'GET',
            url: `/conversations/${cid}/polls/${pid}`
        }).then((res) => {
            if (res && res.data) {
                return res.data as Poll;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const addEvent = (cid: string, event: CalendarEvent) => {
        return apiService.request({
            method: 'POST',
            url: `/conversations/${cid}/addEvent`,
            data: event
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const getEvent = (cid: string, eid: string) => {
        return apiService.request({
            method: 'GET',
            url: `/conversations/${cid}/events/${eid}`
        }).then((res) => {
            if (res && res.data) {
                return parseEvent(res.data) as CalendarEvent;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const changeLikeIcon = (cid: string, newIcon: LikeIcon) => {
        return apiService.request({
            method: 'PUT',
            url: `/conversations/${cid}/likeIcon`,
            data: newIcon
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const resetLikeIcon = (cid: string) => {
        return apiService.request({
            method: 'PUT',
            url: `/conversations/${cid}/likeIcon/reset`,
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const getGallery = (cid: string, cursorContainer?: CursorContainer) => {
        return apiService.request(addCursorToRequest({
            method: 'GET',
            url: `/conversations/${cid}/gallery`
        }, cursorContainer))
        .then((res) => {
            if (res && res.data) {
                if (cursorContainer && 'cursor' in res.headers) {
                    cursorContainer.cursor = res.headers.cursor;
                } else if (cursorContainer) {
                    cursorContainer.cursor = null;
                }
                return (res.data as SocketMessage[]).map((m) => parseSocketMessage(m));
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const getConversationsForIds = (ids: string[]) => {
        return apiService.request({
            method: 'POST',
            url: `/conversations/forIds`,
            data: ids
        }).then((res) => {
            if (res && res.data) {
                return res.data as Conversation[];
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const getEncryptionData = (id: string, dateLimit?: Date) => {
        return apiService.request({
            method: 'POST',
            url: `/conversations/${id}/getEncryptionData`,
            data: {
                dateLimit
            }
        }).then((res) => {
            if (res && res.data) {
                return res.data as {
                    minDate: Date;
                    data: {
                        id: string;
                        encryptedFields: string;
                        publicKey: string;
                    }[];
                };
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    };

    const changeEncryptionKey = (
        cid: string, 
        publicKey: string,
        userKeyMap: { [id: string]: string },
        keyInfo?: KeyInfo) => {
        return apiService.request({
            method: 'PUT',
            url: `/conversations/${cid}/changeKeySet`,
            data: {
                publicKey,
                userKeyMap,
                keyInfo,
            }
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
        })
        .catch((err) => Promise.reject(err));
    };

    const pushReencryptedMessages = (cid: string, newData: {
        minDate: Date;
        data: {
            id: string;
            encryptedFields: string;
            publicKey: string;
        }[];
    }) => {
        return apiService.request({
            method: 'POST',
            url: `/conversations/${cid}/pushReencryptedMessages`,
            data: newData
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
        })
        .catch((err) => Promise.reject(err));
    };

    const deleteMessage = (cid: string, mid: string) => {
        return apiService.request({
            method: 'DELETE',
            url: `/conversations/${cid}/${mid}`
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
        })
        .catch((err) => Promise.reject(err));
    };

    const updateUserRole = (cid: string, uid: string, newRole: ChatRole) => {
        return apiService.request({
            method: 'PUT',
            url: `conversations/${cid}/updateUserRole`,
            data: {
                newRole,
                uid
            }
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
        })
        .catch((err) => Promise.reject(err));
    };

    return {
        getConversation,
        getConversationInfo,
        getConversationMessages,
        getConversationMessagesToDate,
        getMessage,
        deleteConversation,
        updateConversationProfile,
        updateConversationDetails,
        updateUserNotStatus,
        addConversationUsers,
        removeConversationUser,
        leaveChat,
        joinChat,
        addPoll,
        getPoll,
        addEvent,
        getEvent,
        changeLikeIcon,
        resetLikeIcon,
        getGallery,
        getConversationsForIds,
        getEncryptionData,
        changeEncryptionKey,
        pushReencryptedMessages,
        deleteMessage,
        updateUserRole
    }
}