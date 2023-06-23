import React, { useState, useEffect, createContext, PropsWithChildren, ReactNode } from 'react';
import { UserData } from '../types/types';
import AuthUIController from './AuthUI/AuthUIController';
import auth from '@react-native-firebase/auth';
import IdentitySetup from './IdentityManagement/IdentitySetup';

type AuthContextType = {
    user: UserData | undefined,
    isAuthenticated: boolean,
    logOut: () => void,
    modifyUser: (user: UserData) => void;
};

export const AuthIdentityContext = createContext<AuthContextType>({
    user: undefined,
    isAuthenticated: false,
    logOut: () => {},
    modifyUser: () => {},
});

export default function AuthIdentityContainer(props: PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const { children } = props;

    const [user, setUser] = useState<UserData | undefined>(undefined);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const logOut = () => {
        setUser(undefined);
        setIsAuthenticated(false);
    };

    const modifyUser = (user: UserData) => {
        if (!isAuthenticated) return;
        setUser(user);
    };

    useEffect(() => {
        auth().onAuthStateChanged(user => {
            console.log(user);
            if (user && user.email) {
                setUser({email: user.email, id: user.uid});
                setIsAuthenticated(true);
            } else {
                setUser(undefined);
                setIsAuthenticated(false);
            }
        });
    }, []);

    const isSetup = () => {
        if (user && user.handle && user.secureKey) {
            return true;
        }
        return false;
    }

    return <AuthIdentityContext.Provider value={{user, isAuthenticated, logOut, modifyUser}}>
        {isAuthenticated ? 
            isSetup() ? 
                children :
            <IdentitySetup /> : 
        <AuthUIController />}
    </AuthIdentityContext.Provider>
}