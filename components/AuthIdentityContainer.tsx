import React, { useState, useEffect, createContext, PropsWithChildren, ReactNode } from 'react';
import { UserData } from '../types/types';
import AuthUIController from './AuthUI/AuthUIController';
import auth from '@react-native-firebase/auth';

type AuthContextType = {
    user: UserData | undefined;
    isAuthenticated: boolean;
    logOut: () => void;
};

export const AuthContext = createContext<AuthContextType>({
    user: undefined,
    isAuthenticated: false,
    logOut: () => {},
});

export default function AuthIdentityContainer(props: PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const { children } = props;

    const [user, setUser] = useState<UserData | undefined>(undefined);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const logOut = () => {
        setUser(undefined);
        setIsAuthenticated(false);
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

    return <AuthContext.Provider value={{user, isAuthenticated, logOut}}>
        {isAuthenticated ? children : <AuthUIController />}
    </AuthContext.Provider>
}