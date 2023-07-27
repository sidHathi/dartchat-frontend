import { ReplyRef, UserConversationProfile, Poll, CalendarEvent, ObjectRef, MessageMedia, LikeIcon } from "./types";

export type ServerConversationPreview = {
    cid: string;
    name: string;
    lastMessageContent?: string;
    unSeenMessages: number;
    avatar?: any;
    lastMessageTime: string;
    recipientId?: string;
};

export type RawUserData = {
    id: string;
    email: string;
    handle?: string;
    secureKey?: string;
    displayName?: string;
    phone?: string;
    conversations?: ServerConversationPreview[];
    contacts?: string[];
    archivedConvos?: string[];
};

export type SocketMessage = {
    id: string;
    content: string;
    media?: MessageMedia[];
    timestamp: string;
    senderId: string;
    likes: string[];
    replyRef?: ReplyRef;
    senderProfile?: UserConversationProfile;
    objectRef?: ObjectRef;
};

export type RawConversation = {
    id: string;
    settings: any;
    participants: UserConversationProfile[];
    name: string;
    avatar?: any;
    messages: SocketMessage[];
    polls?: Poll[];
    group: boolean;
    events?: CalendarEvent[];
    customLikeIcon?: LikeIcon;
}

export type RawCalendarEvent = {
    id: string;
    name: string;
    date: string;
    reminders: Date[];
    going: string[];
    notGoing: string[];
};

export type RawPoll = {
    id: string;
    multiChoice: boolean;
    question: string;
    media?: MessageMedia[];
    options: {
        idx: number;
        value: string;
        voters: string[];
    }[];
    expirationDate: string;
    messageId?: string;
}
