import { useEffect } from "react";

import { apiService } from "./request";
import profilesApi from "./profilesApi";
import usersApi from "./usersApi";
import { REACT_APP_API_URL } from '@env';

export default function useRequest() {
    const baseUrl: string = REACT_APP_API_URL || '';

    useEffect(() => apiService.init(baseUrl));

    return {
        profilesApi: profilesApi(apiService),
        usersApi: usersApi(apiService)
    }
}
