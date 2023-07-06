import { UserConversationProfile, AvatarImage } from "../types/types";
import { getDownloadUrl } from "../firebase/cloudStore";

export const autoGenGroupAvatar = async (participants: UserConversationProfile[], userId?: string): Promise<AvatarImage | undefined> => {
    if (participants.length > 2) {
        return {
            tinyUri: await getDownloadUrl('system/dcSquareLogo-tiny.jpg'),
            mainUri: await getDownloadUrl('system/dcSquareLogo-main.jpg'),
        }
    } else if (participants.length <= 2) {
        const otherUsers = participants.filter(p => p.id !== userId);
        if (otherUsers.length > 0) {
            console.log(otherUsers[0].avatar);
            return otherUsers[0].avatar
        }
    }
    return undefined;
};
