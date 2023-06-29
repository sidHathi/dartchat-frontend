import React, { useState, useEffect, createContext, PropsWithChildren, ReactNode } from 'react';
import { Socket, io } from 'socket.io-client';
import { REACT_APP_API_URL } from '@env';
import auth from '@react-native-firebase/auth';

type SocketContextType = {
    socket?: Socket
};

const SocketContext = createContext<SocketContextType>({});

export function SocketContextProvider({children} :PropsWithChildren<{
    children: ReactNode
}>): JSX.Element {
    const [socket, setSocket] = useState<Socket | undefined>();

    useEffect(() => {
        auth().onAuthStateChanged(async () => {
            if (auth().currentUser) {
                setSocket(io(REACT_APP_API_URL, {
                    auth: {
                        token: await auth().currentUser?.getIdToken()
                    }
                }));
            }
        });
    }, []);

    return (
        <SocketContext.Provider value={{socket}}>
            {children}
        </SocketContext.Provider>
    );
}

export default SocketContext;