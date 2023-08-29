import React, { createContext } from 'react';
import { UserData } from '../types/types';

type AuthIdentityContextType = {
    user: UserData | undefined;
    isAuthenticated: boolean;
    logOut: () => void;
    initUserKeyInfo: (newKey: Uint8Array, keySalt: string) => void;
    createUser: (user: UserData) => Promise<UserData | never>;
    modifyUser: (user: UserData) => Promise<UserData | never>;
};

const AuthIdentityContext = createContext<AuthIdentityContextType>({
    user: undefined,
    isAuthenticated: false,
    logOut: () => {},
    initUserKeyInfo: () => {},
    createUser: () => Promise.reject(),
    modifyUser: () => Promise.reject(),
});

export default AuthIdentityContext;