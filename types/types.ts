export type UserData = {
    id: string;
    email: string;
    handle?: string;
    displayName?: string;
    phone?: string;
    conversations?: ConversationPreview[];
    avatar?: AvatarImage;
    contacts?: string[];
    archivedConvos?: string[];
    publicKey?: string;
    keySalt?: string; // base64 encoded random prime number
    secrets?: string;
    uiTheme?: 'dark' | 'light';
    devMode?: boolean;
    systemRole?: 'admin' | 'plebian';
};

export type UIScreen = 'messaging' |
    'conversations' |
    'social' |
    'profile' |
    'dev';

type MessageType = 'user' | 'system' | 'deletion';

type EncryptionLevel = 'none' | 'encrypted' | 'doubleRatchet';

export type UIState = {
    screen: UIScreen;
    selectedConversation: string | undefined;
};

export type NotificationStatus = 'all' | 'mentions' | 'none';

export type ChatRole = 'admin' | 'plebian';

export type UserConversationProfile = {
    id: string;
    handle?: string;
    displayName: string;
    avatar?: AvatarImage;
    notifications?: NotificationStatus;
    publicKey?: string;
    role?: ChatRole;
};

type MessageBase = {
    id: string;
    timestamp: Date;
    messageType: MessageType;
    encryptionLevel: EncryptionLevel;
    senderId: string;
    likes: string[];
    inGallery?: boolean;
    senderProfile?: UserConversationProfile;
    delivered?: boolean;
    mentions?: {
        id: string;
        displayName: string;
    }[];
    replyRef?: ReplyRef;
    messageLink?: string;
};

export type EncryptionFields = {
    content: string;
    media?: MessageMedia[];
    objectRef?: ObjectRef;
};

export type DecryptedMessage = MessageBase & EncryptionFields;

export type EncryptedMessage = MessageBase & {
    encryptedFields: string;
};

export type Message = DecryptedMessage | EncryptedMessage;

export type ReplyRef = {
    id: string;
    content: string;
    senderId: string;
    media?: boolean;
    mentions?: UserConversationProfile[];
};

export type KeyInfo = {
    createdAt: Date;
    privilegedUsers: string[];
    numberOfMessages: number;
};

export type Conversation = {
    id: string;
    settings: any;
    participants: UserConversationProfile[];
    name: string;
    avatar?: AvatarImage;
    messages: Message[];
    group: boolean;
    polls?: Poll[];
    events?: CalendarEvent[];
    customLikeIcon?: LikeIcon;
    encryptionLevel?: EncryptionLevel;
    publicKey?: string;
    keyInfo?: KeyInfo;
    adminIds?: string[];
    messageDisappearTime?: number; // hours
};

export type DecryptedConversation = Omit<Conversation, 'messages'> & {
    messages: DecryptedMessage[];
};

export type ConversationPreview = {
    cid: string;
    name: string;
    lastMessageContent?: string;
    lastMessage?: Message;
    unSeenMessages: number;
    avatar?: AvatarImage;
    lastMessageTime: Date;
    recipientId?: string;
    group: boolean;
    keyUpdate?: string;
    publicKey?: string;
    userRole?: ChatRole;
    notfications?: NotificationStatus;
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
    publicKey?: string;
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
    messageLink?: string;
};

export type CalendarEvent = {
    id: string;
    name: string;
    date: Date;
    reminders: Date[];
    going: string[];
    notGoing: string[];
    messageLink?: string;
};

export type ObjectRef = {
    type: string;
    id: string;
};

export type LikeIcon = {
    type: 'none' | 'icon' | 'img';
    emptyImageUri?: string;
    partialImageUri?: string;
    activeImageUri?: string;
    iconName?: string;
};

export type PNType = 'message' | 'like' | 'newConvo' | 'secrets' | 'deleteMessage' | 'roleChanged' | 'addedToConvo' | 'messageDisappearTimeChanged';

export type PNPacket = {
    type: PNType;
    stringifiedBody: string;
    stringifiedDisplay?: string;
};

export type AdaptingColor = {
    light: string;
    dark: string;
}
