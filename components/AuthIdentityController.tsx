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
import { storeUserData, getStoredUserData, deleteStoredUserData } from '../localStore/store';
import Spinner from 'react-native-spinkit';
import { Center } from 'native-base';
import NetworkContext from '../contexts/NetworkContext';

export default function AuthIdentityController(props: PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const { children } = props;
    const { usersApi } = useRequest();
    const { socket, disconnected: socketDisconnected } = useContext(SocketContext);
    const { networkConnected } = useContext(NetworkContext);

    const [user, setUser] = useState<UserData | undefined>(undefined);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [needsSetup, setNeedsSetup] = useState(true);
    const [loading, setLoading] = useState(false);
    const dispatch = useAppDispatch();

    const logOut = async () => {
        await auth().signOut();
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

    const initAppUser = (newUser: UserData) => {
        setUser(newUser);
        setNeedsSetup(false);
        dispatch(setConversations(newUser.conversations || []));
        if (socket) {
            try {
                socket?.emit('joinRoom', newUser.conversations?.map(c => c.cid) || []);
            } catch (err) {
                console.error(err);
            }
        }
    };

    useEffect(() => {
        return auth().onAuthStateChanged(async (authUser) => {
            console.log(authUser);
            console.log(socketDisconnected);
            if (authUser && authUser.email) {
                setUser({email: authUser.email, id: authUser.uid});
                setIsAuthenticated(true);
                setLoading(true);
                try {
                    if (networkConnected) {
                        console.log('fetching user data')
                        const serverUser = await getUserData(usersApi);
                        if (serverUser && ('handle' in serverUser)) {
                            initAppUser(serverUser);
                            storeUserData(serverUser);
                        } else {
                            setNeedsSetup(true);
                        }
                    } else {
                        const localUser = await getStoredUserData()
                        if (localUser && localUser.handle && localUser.id === authUser.uid) {
                            initAppUser(localUser)
                        }
                        setLoading(false);
                    }
                    setLoading(false);
                } catch (error) {
                    console.log(error);
                    setLoading(false);
                } finally {
                    setLoading(false);
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
                setLoading(false);
            }
        });
    }, []);

    const isSetup = () => {
        if (!needsSetup && user && user.handle && user.secureKey) {
            return true;
        }
        return false;
    }

    const getLoadingScreen = () => <Center flex='1' bgColor='#f5f5f5'>
        <Spinner type='CircleFlip' color='black' />
    </Center>

    return <AuthIdentityContext.Provider value={{
        user, 
        isAuthenticated, 
        logOut, 
        createUser,
        modifyUser}}>
        {isAuthenticated ? 
            loading || ((!networkConnected || socketDisconnected) && !isSetup()) ?
                getLoadingScreen() :
            isSetup() ? 
                children :
            <IdentitySetup />
        : <AuthUIController />}
    </AuthIdentityContext.Provider>
}