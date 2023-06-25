import { UserData } from "../types/types";
import { ApiService } from "./request";

export type UsersApi = {
    getCurrentUser: () => Promise<UserData | never>;
    createNewUser: (newUser: UserData) => Promise<UserData | never>;
    updateUser: (updatedUser: UserData) => Promise<UserData | never>;
};

export default function usersApi(apiService: ApiService): UsersApi {
    const getCurrentUser = (): Promise<UserData | never> => {
        return apiService.request({
            method: 'GET',
            url: '/users/me'
        }).then((res) => {
            if (res && res.data) {
                return res.data as UserData
            }
            return Promise.reject(res);
        })
        .catch((err) => {
            // console.error(err);
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
                return res.data as UserData
            }
            return Promise.reject(res);
        })
        .catch((err) => {
            // console.error(err);
            return Promise.reject(err);
        });
    };
    
    const updateUser = (updatedUser: UserData): Promise<UserData | never> => {
        return apiService.request({
            method: 'PUT',
            url: '/users/update',
            data: updatedUser
        }).then((res) => {
            if (res && res.data) {
                return res.data as UserData
            }
            return Promise.reject(res);
        })
        .catch((err) => {
            console.error(err);
            return Promise.reject(err);
        });
    };

    return {
        getCurrentUser,
        createNewUser,
        updateUser
    };
}