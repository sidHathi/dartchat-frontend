import { UserConversationProfile, AvatarImage, ConversationPreview, Message, SocketEvent, Conversation, UserData, DecryptedMessage, EncryptedMessage, DecryptedConversation, ChatRole } from "../types/types";
import { getDownloadUrl } from "../firebase/cloudStore";
import { parseValue } from "react-native-controlled-mentions";
import ImagePicker, { Image } from 'react-native-image-crop-picker';
import { launchImageLibrary, Asset } from "react-native-image-picker";
import { parseConversation, parseSocketEvent, parseSocketMessage } from "./requestUtils";
import { decodeKey, decryptMessage, encryptMessage } from "./encryptionUtils";

export const findPrivateMessageIdForUser = (recipientProfile: UserConversationProfile, userConversations: ConversationPreview[]): string | undefined => {
    const matches = userConversations.filter((preview) => {
        if (preview.recipientId && recipientProfile.id === preview.recipientId) return true;
        // if (preview.name === recipientProfile.displayName) return true;
        return false;
    });
    if (matches.length > 0) {
        return matches[0].cid;
    }
    return undefined;
};

export const matchMentionQuery = (qString: string, profiles: UserConversationProfile[]): UserConversationProfile[] | undefined => {
    const matches = profiles.filter((profile) => (
        profile.displayName.toLowerCase().includes(qString.toLowerCase()) || (profile.handle && profile.handle.toLowerCase().includes(qString.toLowerCase()))
    ));
    if (matches.length > 0) return matches;
    return undefined;
};

export const getMentionsFromMessage = (mText: string, profiles: UserConversationProfile[]): UserConversationProfile[] | undefined => {
    const { parts } = parseValue(mText, [
        { trigger: '@' }
    ]);
    const idProfileMap = Object.fromEntries(
        profiles.map((p) => [p.id, p])
    );
    const mentions: UserConversationProfile[] = []
    if (parts && parts.length > 0) {
        parts.map((part) => {
            if (part.data && part.data.id && part.data.id in idProfileMap) {
                mentions.push(idProfileMap[part.data.id]);
            }
        })
    }
    if (mentions.length < 1) return undefined;
    return mentions;
};

export const getDateTimeString = (date: Date): string => {
    const stringRep = date.toLocaleString([], {year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute:'2-digit'});
    return stringRep;
};

export const getTimeString = (date: Date): string => {
    const stringRep = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    return stringRep;
};

export const selectIconImage = async (
    setImage: (asset: Asset) => void,
    setEdited?: (edited: boolean) => void
) => {
    try {
        const res = await launchImageLibrary({
            mediaType: 'photo',
            selectionLimit: 1,
            quality: 0.8,
            maxWidth: 72
        });
        if (res.assets) {
            setImage(res.assets[0]);
            setEdited && setEdited(true);
        }
    } catch (err) {
        console.log(err);
    }
};

export const getNewContacts = (candidates: string[], uid: string, currentContacts: string[]) => {
    const contactSet = new Set(currentContacts);
    return candidates.filter((c) => {
        return !contactSet.has(c) && c !== uid
    });
};

export const autoGenGroupAvatar = async (isGroup: boolean, participants: UserConversationProfile[], userId?: string): Promise<AvatarImage | undefined> => {
    if (isGroup) {
        return {
            tinyUri: await getDownloadUrl('system/dcSquareLogo-tiny.jpg'),
            mainUri: await getDownloadUrl('system/dcSquareLogo-main.jpg'),
        }
    } else {
        const otherUsers = participants.filter(p => p.id !== userId);
        if (otherUsers.length > 0) {
            // console.log(otherUsers[0].avatar);
            return otherUsers[0].avatar
        }
    }
    return undefined;
};

export const constructNewConvo = async (raw: Conversation, user: UserData): Promise<Conversation> => {
    let name = raw.name;
    if (!raw.group) {
        name = raw.participants.filter((p) => p.id !== user.id)[0].displayName;
    }
    if (!raw.avatar) {
        return {
            ...raw,
            avatar: await autoGenGroupAvatar(raw.group, raw.participants, user.id),
            name
        }
    }
    return {
        ...raw,
        name
    }
};

export const handlePossiblyEncryptedConversation = (convo: Conversation, secretKey?: Uint8Array) => {
    try {
        if (!secretKey || !convo.encryptionLevel || convo.encryptionLevel === 'none') return convo as DecryptedConversation;
        return {
            ...convo,
            messages: filterEncryptedMessages(convo.messages, secretKey)
        } as DecryptedConversation;
    } catch (err) {
        console.log(err);
        return convo as DecryptedConversation;
    }
}

export const filterEncryptedMessages = (messages: Message[], convoSecretKey: Uint8Array): DecryptedMessage[] => {
    try {
        return messages
            .map(message => {
                return handlePossiblyEncryptedMessage(message, convoSecretKey);
            })
            .filter((decrypted) => decrypted !== undefined) as DecryptedMessage[];
    } catch (err) {
        console.log(err);
        return [];
    }
};

export const handlePossiblyEncryptedMessage = (message: Message, convoSecretKey?: Uint8Array) => {
    try {
        if (!convoSecretKey || !message.encryptionLevel || message.encryptionLevel === 'none') {
            return message as DecryptedMessage;
        }
        if (!message.senderProfile || !message.senderProfile.publicKey) return undefined;
        const publicKey = message.senderProfile.publicKey;
        const decodedPublicKey = decodeKey(publicKey);
        const decrypted = decryptMessage(message as EncryptedMessage, convoSecretKey, decodedPublicKey);
        if (!decrypted || (!decrypted.content && !decrypted.objectRef && !decrypted.media)) return undefined;
        return decrypted;
    } catch (err) {
        console.log(err);
        return undefined;
    }
};

export const encryptMessageForConvo = (message: DecryptedMessage, convo: Conversation, userSecretKey?: Uint8Array): Message => {
    try {
        if (!convo.publicKey || !convo.encryptionLevel || convo.encryptionLevel === 'none' || !userSecretKey) return message as Message;
        const decodedPublicKey = decodeKey(convo.publicKey);
        return encryptMessage(message, userSecretKey, decodedPublicKey) as Message;
    } catch (err) {
        console.log(err);
        return message;
    }
};

export const hasPermissionForAction = (
    action: 'removeUser' | 'changeUserRole' | 'deleteForeignMessage',
    actorRole?: ChatRole,
    recipientRole?: ChatRole
) => {
    switch (action) {
        case 'removeUser':
            if (actorRole === 'admin') return true;
            else if (recipientRole !== 'admin') return true;
            return false;
        case 'changeUserRole':
            if (actorRole === 'admin') return true;
            else if (recipientRole !== 'admin') return true;
            return false;
        case 'deleteForeignMessage':
            if (actorRole === 'admin') return true;
            return false;
    }
};

export const getUserConversationAvatar = (convo: Conversation, userId: string): AvatarImage | undefined => {
    if (convo.participants.length > 2) {
        return convo.avatar;
    }
    const otherUsers = convo.participants.filter((p) => p.id !== userId);
    if (otherUsers.length > 0) {
        console.log(otherUsers[0].avatar);
        return otherUsers[0].avatar;
    }
    return undefined;
};

export const constructPreviewForConversation = (convo: Conversation, uid: string) => {
    const userProfile = convo.participants.find((p) => p.id === uid);
    if (!userProfile) return undefined;
    return {
        cid: convo.id,
        unSeenMessages: 0,
        lastMessageTime: new Date(),
        avatar: getUserConversationAvatar(convo, userProfile.id),
        group: convo.group,
        publicKey: convo.publicKey,
        userRole: userProfile.role
    } as ConversationPreview;
};
