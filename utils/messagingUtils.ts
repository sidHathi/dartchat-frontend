import { UserConversationProfile, AvatarImage, ConversationPreview, Message, SocketEvent, Conversation, UserData } from "../types/types";
import { getDownloadUrl } from "../firebase/cloudStore";
import { parseValue } from "react-native-controlled-mentions";
import ImagePicker, { Image } from 'react-native-image-crop-picker';
import { launchImageLibrary, Asset } from "react-native-image-picker";
import { parseConversation, parseSocketEvent, parseSocketMessage } from "./requestUtils";

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

export const parsePNMessage = (stringifiedBody: string): {
    cid: string;
    message: Message
} | undefined => {
    const parsedBody = JSON.parse(stringifiedBody);
    if (!('cid' in parsedBody) || !('message' in parsedBody)) return undefined;
    return {
        cid: parsedBody['cid'],
        message: parseSocketMessage(parsedBody)
    };
};

export const parsePNLikeEvent = (stringifiedBody: string): {
    cid: string
    senderId: string;
    event: SocketEvent;
    mid: string;
} | undefined => {
    const parsedBody = JSON.parse(stringifiedBody);
    if (!('senderId' in parsedBody) || 
        !('event' in parsedBody) || 
        !('cid' in parsedBody) ||
        !('mid' in parsedBody)) return undefined;
    return {
        cid: parsedBody['cid'],
        senderId: parsedBody['senderId'],
        event: parseSocketEvent(parsedBody['event']),
        mid: parsedBody['mid']
    };
};

export const autoGenGroupAvatar = async (participants: UserConversationProfile[], userId?: string): Promise<AvatarImage | undefined> => {
    if (participants.length > 2) {
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

export const parsePNNewConvo = (stringifiedBody: string): Conversation => {
    const parsedBody = JSON.parse(stringifiedBody);
    return parseConversation(parsedBody);
};

export const constructNewConvo = async (raw: Conversation, user: UserData): Promise<Conversation> => {
    let name = raw.name;
    if (!raw.group) {
        name = raw.participants.filter((p) => p.id !== user.id)[0].displayName;
    }
    return {
        ...raw,
        avatar: await autoGenGroupAvatar(raw.participants, user.id),
        name
    }
};

export const parsePNDisplay = (stringifiedDisplay: string | undefined): {
    title: string;
    body: string;
    imageUri?: string;
} | undefined => {
    if (!stringifiedDisplay) return undefined;
    const parsed = JSON.parse(stringifiedDisplay);
    if (parsed && 'title' in parsed && 'body' in parsed) {
        return parsed;
    }
    return undefined;
};
