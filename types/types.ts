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
};

export type UIScreen = 'messaging' |
    'conversations' |
    'social' |
    'profile';

type MessageType = 'user' | 'system';

type EncryptionLevel = 'none' | 'encrypted' | 'doubleRatchet';

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
    notifications?: NotificationStatus;
    publicKey?: string;
};

type MessageBase = {
    id: string;
    timestamp: Date;
    messageType: MessageType;
    encryptionLevel: EncryptionLevel;
    senderId: string;
    likes: string[];
    senderProfile?: UserConversationProfile;
    delivered?: boolean;
    mentions?: UserConversationProfile[];
    replyRef?: ReplyRef;
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
};

export type CalendarEvent = {
    id: string;
    name: string;
    date: Date;
    reminders: Date[];
    going: string[];
    notGoing: string[];
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
