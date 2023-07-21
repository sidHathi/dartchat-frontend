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

export type NotificationStatus = 'all' | 'mentions' | 'none';

export type UserConversationProfile = {
    id: string;
    handle?: string;
    displayName: string;
    avatar?: AvatarImage;
    notifications?: NotificationStatus
};

export type Message = {
    id: string;
    content: string;
    media?: MessageMedia[];
    timestamp: Date;
    senderId: string;
    likes: string[];
    replyRef?: ReplyRef;
    mentions?: UserConversationProfile[];
    senderProfile?: UserConversationProfile;
    objectRef?: ObjectRef;
};

export type ReplyRef = {
    id: string;
    content: string;
    senderId: string;
    media?: boolean;
    mentions?: UserConversationProfile[];
}

export type Conversation = {
    id: string;
    settings: any;
    participants: UserConversationProfile[];
    name: string;
    avatar?: AvatarImage;
    messages: Message[];
    group: boolean;
    polls?: Poll[];
    events?: Event[];
};

export type ConversationPreview = {
    cid: string;
    name: string;
    lastMessageContent?: string;
    unSeenMessages: number;
    avatar?: AvatarImage;
    lastMessageTime: Date;
    recipientId?: string;
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
};

export type MessageMedia = {
    id: string;
    type: string;
    uri: string;
    width: number;
    height: number;
};

export type MessageMediaBuffer = {
    id: string;
    type: string;
    fileUri?: string;
    width: number;
    height: number;
};

export type Poll = {
    id: string;
    multiChoice: boolean;
    question: string;
    media?: MessageMedia[];
    options: {
        idx: number;
        value: string;
        voters: string[];
    }[];
    expirationDate: Date;
    messageId?: string;
};

export type Event = {
    id: string;
    name: string;
    date: Date;
};

export type ObjectRef = {
    type: string;
    id: string;
};
