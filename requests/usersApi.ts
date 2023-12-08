import { UserData } from "../types/types";
import { ApiService } from "./request";
import { parseUserData } from "../utils/requestUtils";

export type UsersApi = {
    getCurrentUser: () => Promise<UserData | never>;
    createNewUser: (newUser: UserData) => Promise<UserData | never>;
    updateUser: (updatedUser: UserData) => Promise<UserData | never>;
    addUserPushToken: (token: string) => Promise<boolean | never>;
    removeArchivedConvo: (cid: string) => Promise<any | never>;
    readConversationKeyUpdates: (cids: string[]) => Promise<any | never>;
    setKeySalt: (salt: string) => Promise<any | never>;
    setUserSecrets: (secret: string) => Promise<any | never>;
    updatePublicKey: (newKey: string) => Promise<any | never>;
    updateUiTheme: (newTheme: 'dark' | 'light') => Promise<any | never>;
    setDevMode: (devMode: boolean) => Promise<any | never>;
};

export default function usersApi(apiService: ApiService): UsersApi {
    const getCurrentUser = (): Promise<UserData | never> => {
        return apiService.request({
            method: 'GET',
            url: '/users/me'
        }).then((res) => {
            if (res && res.data) {
                return parseUserData(res.data)
            }
            return Promise.reject(res);
        })
        .catch((err) => {
            return Promise.reject(err);
        });
    };

    const createNewUser = (newUser: UserData): Promise<UserData | never> => {
        return apiService.request({
            method: 'POST',
            url: '/users/create',
            data: newUser
        }).then((res) => {
            if (res && res.data) {
                return parseUserData(res.data)
            }
            return Promise.reject(res);
        })
        .catch((err) => {
            return Promise.reject(err);
        });
    };
    
    const updateUser = (updatedUser: UserData): Promise<UserData | never> => {
        return apiService.request({
            method: 'PUT',
            url: '/users/me/update',
            data: updatedUser
        }).then((res) => {
            if (res && res.data) {
                return parseUserData(res.data)
            }
            return Promise.reject(res);
        })
        .catch((err) => {
            console.error(err);
            return Promise.reject(err);
        });
    };

    const addUserPushToken = (token: string): Promise<boolean | never> => {
        return apiService.request({
            method: 'POST',
            url: '/users/me/pushToken',
            data: {
                token
            }
        }).then(() => {
            return true;
        }).catch((err) => {
            return Promise.reject(err);
        })
    };

    const removeArchivedConvo = (cid: string): Promise<any | never> => {
        return apiService.request({
            method: 'POST',
            url: `/users/me/archiveRemove/${cid}`
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
            return Promise.reject(res);
        }).catch((err) => {
            return Promise.reject(err);
        })
    };

    const readConversationKeyUpdates = (cids: string[]): Promise<any | never> => {
        return apiService.request({
            method: 'POST',
            url: `/users/me/readKeyUpdates`,
            data: {
                cids
            }
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
        }).catch((err) => {
            return Promise.reject(err);
        })
    };

    const setKeySalt = (salt: string): Promise<any | never> => {
        return apiService.request({
            method: 'POST',
            url: `/users/me/setKeySalt`,
            data: {
                salt
            }
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
        }).catch((err) => {
            return Promise.reject(err);
        })
    };

    const setUserSecrets = (secrets: string): Promise<any | never> => {
        return apiService.request({
            method: 'POST',
            url: `/users/me/setSecrets`,
            data: {
                secrets
            }
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
        }).catch((err) => {
            return Promise.reject(err);
        })
    };

    const updatePublicKey = (newKey: string): Promise<any | never> => {
        return apiService.request({
            method: 'POST',
            url: `/users/me/updatePublicKey`,
            data: {
                publicKey: newKey
            }
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
        }).catch((err) => {
            return Promise.reject(err);
        })
    };

    const updateUiTheme = (newTheme: 'dark' | 'light'): Promise<any | never> => {
        return apiService.request({
            method: 'PUT',
            url: `/users/me/updateUiTheme`,
            data: {
                uiTheme: newTheme
            }
        }).then((res) => {
            if (res && res.data) {
                return res.data;
            }
        }).catch((err) => {
            return Promise.reject(err);
        });
    };

    const setDevMode = (devMode: boolean): Promise<any | never> => {
        return apiService.request({
            method: 'PUT',
            url: 'users/me/setDevMode',
            data: {
                devMode
            }
        }).then((res) => {
            return res.data;
        }).catch((err) => {
            return Promise.reject(err);
        });
    };

    return {
        getCurrentUser,
        createNewUser,
        updateUser,
        addUserPushToken,
        removeArchivedConvo,
        readConversationKeyUpdates,
        setKeySalt,
        setUserSecrets,
        updatePublicKey,
        updateUiTheme,
        setDevMode,
    };
}