import { UsersApi } from "../requests/usersApi";
import { ConversationPreview, UserData } from "../types/types";
import { parseUserData } from "./requestUtils";

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
