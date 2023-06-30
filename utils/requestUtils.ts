import { UserData, Message, Conversation } from "../types/types"
import { RawUserData, SocketMessage, RawConversation } from "../types/rawTypes";

export const parseUserData = (data : any): UserData => {
    try{
        const casted = data as RawUserData;
        if (!casted.conversations || casted.conversations.length < 1) return casted as UserData;
        return {
            ...casted,
            conversations: casted.conversations.map((c) => {
                const date = new Date(Date.parse(c.lastMessageTime));
                return {
                    ...c,
                    lastMessageTime: date
                }
            })
        }
    } catch (e) {
        console.error(e);
        return data;
    }
};

export const parseSocketMessage = (data: any): Message => {
    try {
        const casted = data as SocketMessage;
        return {
            ...casted,
            timestamp: new Date(Date.parse(casted.timestamp))
        }
    } catch (err) {
        console.error(err);
        return data;
    }
}

export const parseConversation = (data: any) : Conversation => {
    try {
        const casted = data as RawConversation;
        if (!casted.messages || casted.messages.length < 1) return data;
        return {
            ...casted,
            messages: casted.messages.map((m) => parseSocketMessage(m))
        }
    } catch (err) {
        console.error(err);
        return data;
    }
}