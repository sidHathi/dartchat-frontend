import { ApiService } from "./request";
import { UserProfile } from "../types/types";

export type ProfilesApi = {
    getProfile: (id: string) => Promise<UserProfile | never>;
    findProfile: (qString: string) => Promise<UserProfile[] | never>;
    getProfiles: (ids: string[]) => Promise<UserProfile[] | never>;
}

export default function profilesApi(apiService : ApiService): ProfilesApi {
    const getProfile = (id: string): Promise<UserProfile | never> => {
        return apiService.request({
            method: 'GET',
            url: `/profiles/${id}`
        }).then((res) => res.data as UserProfile)
        .catch((err) =>{
            // console.error(err);
            return Promise.reject(err);
        });
    };

    const findProfile = (qString: string): Promise<UserProfile[] | never> => {
        return apiService.request({
            method: 'POST',
            url: `/profiles/search?qString=${qString}`
        }).then((res) => res.data as UserProfile[])
        .catch((err) =>{
            // console.error(err);
            return Promise.reject(err);
        });
    };

    const getProfiles = (ids: string[]) : Promise<UserProfile[] | never> => {
        return apiService.request({
            method: 'POST',
            url: `/profiles/forIds`,
            data: ids
        }).then((res) => res.data as UserProfile[])
        .catch((err) =>{
            // console.error(err);
            return Promise.reject(err);
        });
    };

    return {
        getProfile,
        findProfile,
        getProfiles
    };
}
