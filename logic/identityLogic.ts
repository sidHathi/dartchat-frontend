import { UsersApi } from "../requests/usersApi";
import { UserData } from "../types/types";

export const getUserData = (usersApi: UsersApi): Promise<UserData | undefined> => {
    return usersApi.getCurrentUser()
        .then((user) => {
            console.log(user);
            if (!('handle' in user)) {1
                return undefined;
            }
            return user as UserData;
        })
        .catch((err) => {
            console.log(err);
            return undefined;
        });
};
