import React, { createContext } from 'react';
import { UserData } from '../types/types';

type AuthIdentityContextType = {
    user: UserData | undefined,
    isAuthenticated: boolean,
    logOut: () => void,
    createUser: (user: UserData) => Promise<UserData | never>;
    modifyUser: (user: UserData) => Promise<UserData | never>;
};

const AuthIdentityContext = createContext<AuthIdentityContextType>({
    user: undefined,
    isAuthenticated: false,
    logOut: () => {},
    createUser: () => Promise.reject(),
    modifyUser: () => Promise.reject(),
});

export default AuthIdentityContext;