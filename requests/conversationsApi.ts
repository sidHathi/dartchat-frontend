import { ApiService } from "./request";
import { Conversation, CursorContainer, Message, UserConversationProfile } from "../types/types";
import { parseConversation, parseSocketMessage, addCursorToRequest } from "../utils/requestUtils";
import { SocketMessage } from "../types/rawTypes";

export type ConversationsApi = {
    getConversation: (cid: string, cursorContainer?: CursorContainer) => Promise<Conversation | never>;
    getConversationMessages: (cid: string, cursorContainer?: CursorContainer) => Promise<Message[]>;
    getConversationMessagesToDate: (cid: string, date: Date, cursorContainer?: CursorContainer) => Promise<Message[]>;
    getMessage: (cid: string, mid: string) => Promise<Message | never>;
    deleteConversation: (cid: string) => Promise<any | never>;
    updateConversationProfile: (cid: string, newProfile: UserConversationProfile) => Promise<any | never>;
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
                console.log(res);
                return res.data;
            }
            return Promise.reject(res);
        })
        .catch((err) => Promise.reject(err));
    }

    return {
        getConversation,
        getConversationMessages,
        getConversationMessagesToDate,
        getMessage,
        deleteConversation,
        updateConversationProfile
    }
}