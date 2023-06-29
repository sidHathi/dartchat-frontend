import { ReplyRef, UserConversationProfile } from "./types";

export type ServerConversationPreview = {
    cid: string;
    name: string;
    lastMessageContent?: string;
    unSeenMessages: number;
    avatar?: any;
    lastMessageTime: string;
};

export type RawUserData = {
    id: string;
    email: string;
    handle?: string;
    secureKey?: string;
    displayName?: string;
    phone?: string;
    conversations?: ServerConversationPreview[];
};

export type SocketMessage = {
    id: string;
    content: string;
    media?: string[];
    timestamp: string;
    senderId: string;
    likes: string[];
    replyRef?: ReplyRef
};

export type RawConversation = {
    id: string;
    settings: any;
    participants: UserConversationProfile[];
    name: string;
    avatar?: any;
    messages: SocketMessage[];
}