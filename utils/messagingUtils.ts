import { UserConversationProfile, AvatarImage, UserData, ConversationPreview } from "../types/types";
import { getDownloadUrl } from "../firebase/cloudStore";
import { parseValue } from "react-native-controlled-mentions";

export const autoGenGroupAvatar = async (participants: UserConversationProfile[], userId?: string): Promise<AvatarImage | undefined> => {
    if (participants.length > 2) {
        return {
            tinyUri: await getDownloadUrl('system/dcSquareLogo-tiny.jpg'),
            mainUri: await getDownloadUrl('system/dcSquareLogo-main.jpg'),
        }
    } else {
        const otherUsers = participants.filter(p => p.id !== userId);
        if (otherUsers.length > 0) {
            console.log(otherUsers[0].avatar);
            return otherUsers[0].avatar
        }
    }
    return undefined;
};

export const findPrivateMessageIdForUser = (recipientProfile: UserConversationProfile, userConversations: ConversationPreview[]): string | undefined => {
    const matches = userConversations.filter((preview) => {
        if (preview.recipientId && recipientProfile.id === preview.recipientId) return true;
        if (preview.name === recipientProfile.displayName) return true;
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

