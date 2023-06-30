import React, { useState, useEffect, useContext, PropsWithChildren, ReactNode } from 'react';
import { UserData } from '../types/types';
import AuthUIController from './AuthUI/AuthUIController';
import auth from '@react-native-firebase/auth';
import IdentitySetup from './IdentityManagement/IdentitySetup';
import useRequest from '../requests/useRequest';
import { getUserData } from '../utils/identityUtils';
import AuthIdentityContext from '../contexts/AuthIdentityContext';
import SocketContext from '../contexts/SocketContext';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { setConversations } from '../redux/slices/userConversationsSlice';

export default function AuthIdentityController(props: PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const { children } = props;
    const { usersApi } = useRequest();
    const { socket } = useContext(SocketContext);

    const [user, setUser] = useState<UserData | undefined>(undefined);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [needsSetup, setNeedsSetup] = useState(true);
    const dispatch = useAppDispatch();

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
                    console.log('joining rooms');
                    console.log(serverUser.conversations);
                    dispatch(setConversations(serverUser.conversations || []));
                    if (socket) {
                        try {
                            socket?.emit('joinRoom', serverUser.conversations?.map(c => c.cid) || []);
                        } catch (err) {
                            console.error(err);
                        }
                    }
                } else {
                    setNeedsSetup(true);
                }
            } else {
                setUser(undefined);
                setIsAuthenticated(false);
                setNeedsSetup(true);
                if (socket) {
                    console.log('socket disconnecting');
                    socket.emit('forceDisconnect');
                    socket.disconnect();
                }
            }
        });
        // return unsubscribe();
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