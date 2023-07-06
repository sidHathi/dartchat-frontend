export type UserData = {
    id: string;
    email: string;
    handle?: string;
    secureKey?: string;
    displayName?: string;
    phone?: string;
    conversations?: ConversationPreview[];
    avatar?: AvatarImage;
};

export type UIScreen = 'messaging' |
    'conversations' |
    'social' |
    'profile';

export type UIState = {
    screen: UIScreen;
    selectedConversation: string | undefined;
};

export type UserConversationProfile = {
    id: string;
    displayName: string;
    avatar?: AvatarImage;
};

export type Message = {
    id: string;
    content: string;
    media?: string[];
    timestamp: Date;
    senderId: string;
    likes: string[];
    replyRef?: ReplyRef
};

export type ReplyRef = {
    id: string;
    content: string;
    senderId: string;
    media?: string[];
}

export type Conversation = {
    id: string;
    settings: any;
    participants: UserConversationProfile[];
    name: string;
    avatar?: AvatarImage;
    messages: Message[];
};

export type ConversationPreview = {
    cid: string;
    name: string;
    lastMessageContent?: string;
    unSeenMessages: number;
    avatar?: AvatarImage;
    lastMessageTime: Date;
};

export type UserProfile = {
    id: string;
    handle: string;
    displayName: string;
    email?: string;
    phone?: string;
    alias?: string;
    // implement later!!
    avatar?: AvatarImage;
    publicEncryptionKey?: string;
};

export type SocketEvent = {
    id: string;
    timestamp: Date;
    type: string;
    metadata?: any;
};

export type CursorContainer = {
    cursor: string | null
};

export type AvatarImage = {
    mainUri: string;
    tinyUri: string;
}
