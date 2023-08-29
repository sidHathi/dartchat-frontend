import { useEffect } from "react";

import { apiService } from "./request";
import profilesApi, { ProfilesApi } from "./profilesApi";
import usersApi, { UsersApi } from "./usersApi";
import conversationsApi, { ConversationsApi } from "./conversationsApi";
import Config from "react-native-config";

export type APISuite = {
    profilesApi: ProfilesApi;
    usersApi: UsersApi;
    conversationsApi: ConversationsApi;
};

export default function useRequest(): APISuite {
    const baseUrl: string = Config.REACT_APP_API_URL || '';

    useEffect(() => apiService.init(baseUrl));

    return {
        profilesApi: profilesApi(apiService),
        usersApi: usersApi(apiService),
        conversationsApi: conversationsApi(apiService)
    }
}
