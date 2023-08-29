import { ReplyRef, UserConversationProfile, Poll, CalendarEvent, ObjectRef, MessageMedia, LikeIcon, Message, ConversationPreview, Conversation, KeyInfo } from "./types";

export type ServerConversationPreview = Omit<ConversationPreview, 'lastMessageTime'> &  {
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
    contacts?: string[];
    archivedConvos?: string[];
};

export type SocketMessage = Omit<Message, 'timestamp'> & {
    timestamp: string;
};

export type RawKeyInfo = {
    createdAt: string;
    privilegedUsers: string[];
    numberOfMessages: number;
};

export type RawConversation = Omit<Conversation, 'messages' | 'keyInfo'> & {
    messages: SocketMessage[];
    keyInfo?: RawKeyInfo;
};

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
};
