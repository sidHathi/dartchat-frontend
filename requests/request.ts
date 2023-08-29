/**
 * request.ts
 * 
 * Defines the  apiService object used to make requests to the
 * listings API using a shared axios instance.
 * Includes response interceptors.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import auth from '@react-native-firebase/auth'

const requestInterceptors = {
    success: async (config: InternalAxiosRequestConfig<any>) => {
        if (!auth().currentUser) return Promise.reject('Unauthorized');
        return config;
    },
    error: (error: any) => {
        Promise.reject(error);
    }
};

// Type annotation for apiService
export interface ApiService {
    baseURL: string;
    instance: AxiosInstance | null;
    request: (options: AxiosRequestConfig) => Promise<AxiosResponse> | Promise<never>;
    init: (baseURL: string) => void;
}

export const apiService: ApiService = {
    baseURL: '',
    instance: null,
    request: async function(options: AxiosRequestConfig): Promise<AxiosResponse<any>> {
        if (this.instance == null || auth().currentUser == null) {
            return Promise.reject();
        }

        const headers = {
            'Authorization': `Bearer ${await auth().currentUser?.getIdToken()}`
        };
        const filteredOptions = {...options};
        if (options?.data !== undefined) {
            filteredOptions.data = Object.fromEntries(
                Object.entries(options.data).filter(([key, value]) => 
                value !== undefined && key !== undefined)
            );
        }

        return this.instance({
            ...options,
            headers: {
                ...headers,
                ...options?.headers,
            },
            timeout: 5000 // 10 sec
        });
    },
    init: function(baseURL: string) : void {
        this.baseURL = baseURL;
        this.instance = axios.create({
            baseURL,
        });

        // REQUEST INTERCEPTORS
        this.instance.interceptors.request.use(
            requestInterceptors.success,
            requestInterceptors.error,
        );

        // RESPONSE INTERCEPTORS
        this.instance.interceptors.response.use(
            (response) => {
                // console.log(response);
                return response
            },
            (error) => {
                console.log(error);
                return Promise.reject(error);
            },
        );
    }
}