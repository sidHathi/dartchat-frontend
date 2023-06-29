import { ApiService } from "./request";
import { Conversation } from "../types/types";
import { parseConversation } from "../utils/requestUtils";

export type ConversationsApi = {
    getConversation: (cid: string) => Promise<Conversation | never>;
    deleteConversation: (cid: string) => Promise<any | never>;
}

export default function conversationsApi(apiService: ApiService): ConversationsApi {
    const getConversation = (cid: string) => {
        return apiService.request({
            method: 'GET',
            url: `/conversations/${cid}`
        })
        .then((res) => {
            if (res && res.data) {
                console.log(res.data)
                return parseConversation(res.data) as Conversation;
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

    return {
        getConversation,
        deleteConversation
    }
}