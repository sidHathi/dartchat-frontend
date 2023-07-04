import React, { useState, useEffect, createContext, PropsWithChildren, ReactNode, useContext, useCallback } from 'react';
import { Socket, io } from 'socket.io-client';
import { REACT_APP_API_URL } from '@env';
import auth from '@react-native-firebase/auth';
import NetworkContext from './NetworkContext';

type SocketContextType = {
    socket?: Socket,
    disconnected: boolean
};

const SocketContext = createContext<SocketContextType>({
    disconnected: false
});

export function SocketContextProvider({children} :PropsWithChildren<{
    children: ReactNode
}>): JSX.Element {
    const { networkConnected } = useContext(NetworkContext);

    const [socket, setSocket] = useState<Socket | undefined>();
    const [disconnected, setDisconnected] = useState(true);

    const connectAuthSocket = useCallback(async (): Promise<void> => {
        if (!(socket?.connected) && auth().currentUser && networkConnected) {
            console.log('setting new socket');
            setDisconnected(true);
            setSocket(io(REACT_APP_API_URL, {
                auth: {
                    token: await auth().currentUser?.getIdToken()
                }
            }));
        } else if (socket?.connected) {
            setDisconnected(false);
        } else {
            setDisconnected(true);
        }
    }, [socket, networkConnected]);

    useEffect(() => {
        if (auth().currentUser) {
            connectAuthSocket()
        }
    }, [networkConnected]);

    useEffect(() => {
        auth().onAuthStateChanged(() => {
            if (auth().currentUser) {
                connectAuthSocket()
            }
        });
    }, [networkConnected]);

    useEffect(() => {
        if (!socket) return;

        let interval = 0;

        socket.on('disconnect', () => {
            setDisconnected(true);
            if (auth().currentUser) {
                interval = setInterval(async () => {
                    if ((!socket || !socket.connected)) {
                        await connectAuthSocket();
                        if (socket.connected) {
                            setDisconnected(false);
                        }
                    } else {
                        setDisconnected(false);
                    }
                }, 5000);
            }
        });

        if (socket.connected) {
            setDisconnected(false);
            clearInterval(interval);
        } else {
            setDisconnected(true);
        }

        socket.on('connected', () => {
            setDisconnected(false);
            clearInterval(interval);
        });
    }, [socket, networkConnected]);

    return (
        <SocketContext.Provider value={{socket, disconnected}}>
            {children}
        </SocketContext.Provider>
    );
}

export default SocketContext;