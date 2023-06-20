export type UserData = {
    id: string;
    email: string;
};

export type UIScreen = 'messaging' |
    'conversations' |
    'social' |
    'profile';

export type UIState = {
    screen: UIScreen,
    selectedConversation: string | undefined;
};

export type UserConversationProfile = {
    id: string,
    displayName: string,
    profilePic: string,
};

export type Message = {
    content: string,
    media?: string[],
    metadata: {
        timestamp: Date,
        senderId: string,
        likes: string[],
    }
};

export type ConversationUI = {
    settings: JSON,
    participants: UserConversationProfile[],
    permissions?: JSON,
    name?: string,
    avatar?: string,
    messages: Message[],
}
