import React, { useState, useEffect, useContext, PropsWithChildren, ReactNode, useCallback } from 'react';
import { UserData } from '../types/types';
import AuthUIController from './AuthUI/AuthUIController';
import auth from '@react-native-firebase/auth';
import IdentitySetup from './IdentityManagement/IdentitySetup';
import useRequest from '../requests/useRequest';
import { getUserData } from '../utils/identityUtils';
import AuthIdentityContext from '../contexts/AuthIdentityContext';
import SocketContext from '../contexts/SocketContext';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { initReduxUser, logOutUser, setConversations } from '../redux/slices/userDataSlice';
import { storeUserData, getStoredUserData, deleteStoredUserData } from '../localStore/store';
import Spinner from 'react-native-spinkit';
import { Center } from 'native-base';
import NetworkContext from '../contexts/NetworkContext';
import secureStore from '../localStore/secureStore';
import { encodeKey } from '../utils/encryptionUtils';

export default function AuthIdentityController(props: PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const { children } = props;
    const { usersApi } = useRequest();
    const { socket, disconnected: socketDisconnected } = useContext(SocketContext);
    const { apiReachable } = useContext(NetworkContext);

    const [user, setUser] = useState<UserData | undefined>(undefined);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [needsSetup, setNeedsSetup] = useState(false);
    const [loading, setLoading] = useState(false);
    const dispatch = useAppDispatch();

    const logOut = async () => {
        user && (await secureStore.dumpSecrets(user.id));
        await deleteStoredUserData();
        await auth().signOut();
        setUser(undefined);
        dispatch(logOutUser())
        setIsAuthenticated(false);
    };

    const createUser = (user: UserData): Promise<UserData | never> => {
        if (!isAuthenticated) return Promise.reject('Unauthorized');
        return usersApi.createNewUser(user)
            .then(res => {
                if (res && 'handle' in user) {
                    setUser(res as UserData);
                    setNeedsSetup(false);
                    storeUserData(res as UserData);
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
                    storeUserData(res as UserData);
                    // setNeedsSetup(false);
                }
                return res;
            }).catch(err => {
                console.error(err);
                // setNeedsSetup(true);
                return Promise.reject(err);
            });
    };

    const initAppUser = useCallback((newUser: UserData) => {
        setUser(newUser);
        setNeedsSetup(false);
        dispatch(initReduxUser(newUser));
        if (socket) {
            try {
                socket?.emit('joinRoom', newUser.conversations?.map(c => c.cid) || []);
            } catch (err) {
                console.error(err);
            }
        }
    }, [socket]);

    const initUserKeyInfo = useCallback((newKey: Uint8Array, keySalt: string) => {
        if (user) {
            setUser({
                ...user,
                publicKey: encodeKey(newKey),
                keySalt,
                secrets: undefined
            });
        }
    }, [user]);

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(async (authUser) => {
            if (authUser && authUser.email) {
                setUser({email: authUser.email, id: authUser.uid});
                setIsAuthenticated(true);
                setLoading(true);
                try {
                    if (apiReachable) {
                        // console.log('fetching user data')
                        try {
                            // console.log(authUser);
                            const serverUser = await getUserData(usersApi);
                            // console.log(serverUser);
                            if (serverUser && ('handle' in serverUser)) {
                                initAppUser(serverUser);
                                await storeUserData(serverUser);
                                return;
                            } else if (serverUser) {
                                // console.log('not initialized')
                                setNeedsSetup(true);
                                setLoading(false);
                                return;
                            }
                        } catch (err) {
                            console.log(err);
                        }
                    }
                    const localUser = await getStoredUserData();
                    if (localUser && localUser.handle && localUser.id === authUser.uid) {
                        initAppUser(localUser);
                    }
                    setLoading(false);
                } catch (error) {
                    // console.log(error);
                    setLoading(false);
                } finally {
                    setLoading(false);
                }
            } else {
                setUser(undefined);
                setIsAuthenticated(false);
                setNeedsSetup(true);
                if (socket) {
                    // console.log('socket disconnecting');
                    socket.emit('forceDisconnect');
                    socket.disconnect();
                }
                setLoading(false);
            }
        });

        return unsubscribe();
    }, [apiReachable, socket]);



    const isSetup = useCallback(() => {
        if (!needsSetup && user && user.handle) {
            return true;
        }
        return false;
    }, [needsSetup, user]);

    const getLoadingScreen = () => <Center flex='1' bgColor='#f5f5f5'>
        <Spinner type='ThreeBounce' color='black' />
    </Center>

    return <AuthIdentityContext.Provider value={{
        user, 
        isAuthenticated, 
        logOut, 
        initUserKeyInfo,
        createUser,
        modifyUser}}>
        {isAuthenticated ? 
            (loading || (!apiReachable && !isSetup())) ?
                getLoadingScreen() :
                isSetup() ? 
                    children :
                    <IdentitySetup />
        : <AuthUIController />}
    </AuthIdentityContext.Provider>
}