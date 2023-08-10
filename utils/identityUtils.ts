import { UsersApi } from "../requests/usersApi";
import { ConversationPreview, UserConversationProfile, UserData, UserProfile } from "../types/types";
import { parseUserData } from "./requestUtils";
import ImagePicker, { Image } from 'react-native-image-crop-picker';

export const getUserData = (usersApi: UsersApi): Promise<UserData | undefined> => {
    return usersApi.getCurrentUser()
        .then((user) => {
            if (!('handle' in user)) {
                return undefined;
            }
            return user as UserData;
        })
        .catch((err) => {
            console.log(err);
            return undefined;
        });
};

export const updateUserConversations = (usersApi: UsersApi, currentUser: UserData, newConversations: ConversationPreview[]): Promise<UserData | undefined> => {
    return usersApi.updateUser({
        ...currentUser,
        conversations: newConversations
    })
    .then((user) => {
        if (!user || !('handle' in user)) {
            return undefined;
        }
        return user as UserData;
    })
    .catch((err) => {
        console.log(err);
        return undefined;
    });
};

export const selectProfileImage = async (
    setImage: (image: Image) => void,
    setEdited?: (edited: boolean) => void
) => {
    try {
        const res = await ImagePicker.openPicker({
            width: 300,
            height: 300,
            multiple: false,
            cropping: true,
            mediaType: 'photo',
            cropperCircleOverlay: true,
            compressImageQuality: 0.8,
            forceJpg: true,
            includeBase64: true,
        });
        setImage(res);
        setEdited && setEdited(true);
    } catch (err) {
        console.log(err);
    }
};

export const buildDefaultProfileForUser = (user: UserData): UserConversationProfile => {
    return {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName || user.handle || user.email,
        avatar: user.avatar,
        notifications: 'all'
    };
};

export const buildCProfileForUserProifle = (profile: UserProfile) => {
    return {
        id: profile.id,
        displayName: profile.displayName,
        avatar: profile.avatar || undefined,
        handle: profile.handle,
        notifications: 'all',
        publicKey: profile.publicKey
    } as UserConversationProfile
};
