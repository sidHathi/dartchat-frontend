import React, { useState, useEffect, createContext, PropsWithChildren, ReactNode, useContext, useCallback, useRef } from 'react';
import { Socket, io } from 'socket.io-client';
import { REACT_APP_API_URL } from '@env';
import auth from '@react-native-firebase/auth';
import NetworkContext from './NetworkContext';
import { AppState } from 'react-native';

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
    const appState = useRef(AppState.currentState);
    const { networkConnected } = useContext(NetworkContext);

    const [socket, setSocket] = useState<Socket | undefined>();
    const [disconnected, setDisconnected] = useState(true);

    const connectAuthSocket = useCallback(async (): Promise<void> => {
        if (!(socket?.connected) && auth().currentUser && networkConnected) {
            console.log('setting new socket');
            setDisconnected(true);
            const newSocket = io(REACT_APP_API_URL, {
                auth: {
                    token: await auth().currentUser?.getIdToken()
                }
            });
            setSocket(newSocket);
            setDisconnected(false);
        } else if (socket?.connected) {
            setDisconnected(false);
        } else {
            setDisconnected(true);
        }
    }, [networkConnected, socket]);

    useEffect(() => {
        if (auth().currentUser && networkConnected) {
            connectAuthSocket().then(() => {
                if (socket?.connected) setDisconnected(false);
            })
        }

        auth().onAuthStateChanged(() => {
            if (auth().currentUser && networkConnected) {
                connectAuthSocket().then(() => {
                    if (socket?.connected) setDisconnected(false);
                })
            }
        });
    }, [networkConnected]);

    useEffect(() => {
        const eventListener = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                console.log('app state changed');
                appState.current = nextState;
                if (!socket?.connected) {
                    connectAuthSocket().then(() => {
                        if (socket?.connected) setDisconnected(false);
                    });
                } else {
                    setDisconnected(false);
                }
            }
        });

        return () => {
            eventListener.remove();
        };
    }, [socket]);

    useEffect(() => {
        if (!socket || !networkConnected) return;

        socket.on('disconnect', async () => {
            setDisconnected(true);
        });

        socket.on('connected', () => {
            setDisconnected(false);
        });
    }, [networkConnected, socket]);

    return (
        <SocketContext.Provider value={{socket, disconnected}}>
            {children}
        </SocketContext.Provider>
    );
}

export default SocketContext;