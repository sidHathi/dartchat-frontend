import React, { useState, useEffect, createContext, PropsWithChildren, ReactNode } from 'react';
import { UserData } from '../types/types';
import AuthUIController from './AuthUI/AuthUIController';
import auth from '@react-native-firebase/auth';
import IdentitySetup from './IdentityManagement/IdentitySetup';
import useRequest from '../requests/useRequest';
import { getUserData } from '../logic/identityLogic';

type AuthContextType = {
    user: UserData | undefined,
    isAuthenticated: boolean,
    logOut: () => void,
    createUser: (user: UserData) => Promise<UserData | never>;
    modifyUser: (user: UserData) => Promise<UserData | never>;
};

export const AuthIdentityContext = createContext<AuthContextType>({
    user: undefined,
    isAuthenticated: false,
    logOut: () => {},
    createUser: () => Promise.reject(),
    modifyUser: () => Promise.reject(),
});

export default function AuthIdentityContainer(props: PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const { children } = props;
    const { usersApi } = useRequest();

    const [user, setUser] = useState<UserData | undefined>(undefined);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [needsSetup, setNeedsSetup] = useState(true);

    const logOut = () => {
        setUser(undefined);
        setIsAuthenticated(false);
    };

    const createUser = (user: UserData): Promise<UserData | never> => {
        if (!isAuthenticated) return Promise.reject('Unauthorized');
        return usersApi.createNewUser(user)
            .then(res => {
                if (res && 'handle' in user) {
                    setUser(res as UserData);
                    setNeedsSetup(false);
                }
                return res;
            }).catch(err => {
                console.error(err);
                setNeedsSetup(true);
                return Promise.reject(err);
            });
    };

    const modifyUser = (user: UserData): Promise<UserData | never> => {
        if (!isAuthenticated) return Promise.reject('Unauthorized');
        return usersApi.updateUser(user)
            .then(res => {
                if (res && 'handle' in user) {
                    setUser(res as UserData);
                    // setNeedsSetup(false);
                }
                return res;
            }).catch(err => {
                console.error(err);
                // setNeedsSetup(true);
                return Promise.reject(err);
            });
    };

    useEffect(() => {
        auth().onAuthStateChanged(async (user) => {
            if (user && user.email) {
                setUser({email: user.email, id: user.uid});
                setIsAuthenticated(true);
                const serverUser = await getUserData(usersApi);
                if (serverUser && ('handle' in serverUser)) {
                    setUser(serverUser);
                    setNeedsSetup(false);
                } else {
                    setNeedsSetup(true);
                }
            } else {
                setUser(undefined);
                setIsAuthenticated(false);
                setNeedsSetup(true);
            }
        });
    }, []);

    const isSetup = () => {
        if (!needsSetup && user && user.handle && user.secureKey) {
            return true;
        }
        return false;
    }

    return <AuthIdentityContext.Provider value={{
        user, 
        isAuthenticated, 
        logOut, 
        createUser,
        modifyUser}}>
        {isAuthenticated ? 
            isSetup() ? 
                children :
            <IdentitySetup /> : 
        <AuthUIController />}
    </AuthIdentityContext.Provider>
}