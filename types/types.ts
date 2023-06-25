export type UserData = {
    id: string;
    email: string;
    handle?: string;
    secureKey?: string;
    displayName?: string;
    phone?: string;
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
    profilePic: any;
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
    settings: any;
    participants: UserConversationProfile[];
    name?: string;
    avatar?: any;
    messages: Message[];
};

export type UserProfile = {
    id: string;
    handle: string;
    displayName: string;
    email?: string;
    phone?: string;
    alias?: string;
    // implement later!!
    profilePic?: string;
    publicEncryptionKey?: string;
};
