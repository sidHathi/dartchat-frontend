import React, { useState, useEffect, createContext, PropsWithChildren, ReactNode, useContext, useCallback, useRef } from 'react';
import { Socket, io } from 'socket.io-client';
// import { REACT_APP_API_URL } from '@env';
import Config from 'react-native-config';
import auth from '@react-native-firebase/auth';
import NetworkContext from './NetworkContext';
import { AppState } from 'react-native';
// import ReconnectingWebSocket from 'reconnecting-websocket';

type SocketContextType = {
    socket?: Socket,
    disconnected: boolean,
    resetSocket: () => void,
};

const SocketContext = createContext<SocketContextType>({
    disconnected: false,
    resetSocket: () => {return;},
});

const heartCheck: any = {
    timeout: 10000,//default 10s
    timeoutObj: null,
    serverTimeoutObj: null,
    reset: (hc: any) => {
        clearTimeout(hc.timeoutObj);
        clearTimeout(hc.serverTimeoutObj);
        return hc;
    },
    start: (hc: any, socket: Socket) => {
        let self = hc;
        hc.timeoutObj = setTimeout(function(){
            if(socket.connected){
                socket.send("ping");
            }
            self.serverTimeoutObj = setTimeout(() => {
                socket.connect();
            }, self.timeout)
        }, hc.timeout)
    }
}

export function SocketContextProvider({children} :PropsWithChildren<{
    children: ReactNode
}>): JSX.Element {
    const appState = useRef(AppState.currentState);
    const { networkConnected } = useContext(NetworkContext);

    const [socket, setSocket] = useState<Socket | undefined>();
    const [disconnected, setDisconnected] = useState(true);

    const socketRef = useRef(socket);

    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);

    const resetSocket = useCallback(async (): Promise<void> => {
        if (!(socket?.connected) && (!socket?.active) && auth().currentUser && networkConnected) {
            setDisconnected(true);
            const newSocket = io(Config.REACT_APP_API_URL || '', {
                auth: {
                    token: await auth().currentUser?.getIdToken()
                },
                reconnection: true,
                reconnectionDelay: 500,
                reconnectionAttempts: Infinity, 
                transports: ['websocket'],   
                autoConnect: false
            });
            setSocket(newSocket);
            setDisconnected(false);
        } else if (socket?.connected) {
            setDisconnected(false);
        } else {
            setDisconnected(true);
        }

        await new Promise(res => setTimeout(res, 5000));
        if (!socketRef.current?.connected) {
            setDisconnected(true);
        }
    }, [networkConnected, socket, socketRef]);

    useEffect(() => {
        if (auth().currentUser && networkConnected) {
            resetSocket().then(() => {
                if (socket?.connected) setDisconnected(false);
            })
        }

        auth().onAuthStateChanged(() => {
            if (auth().currentUser && networkConnected) {
                resetSocket().then(() => {
                    if (socket?.connected) setDisconnected(false);
                })
            }
        });
    }, [networkConnected]);

    useEffect(() => {
        const eventListener = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                // console.log('app state changed');
                appState.current = nextState;
                if (!socket?.connected) {
                    resetSocket().then(() => {
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
        if (socket && !socket.connected) {
            socket.connect();
        }
    }, [socket]);

    useEffect(() => {
        if (!socket || !networkConnected) return;

        socket.on('disconnect', async () => {
            setDisconnected(true);
            if (auth().currentUser) {
                heartCheck.reset(heartCheck).start(heartCheck, socket);
                await new Promise((res) => setTimeout(res, 2000));
                if (socket.connected) {
                    setDisconnected(false);
                } else {
                    await resetSocket();
                }
            }
        });

        return () => {
            socket.off("disconnect");
        }
    }, [networkConnected, socket]);

    useEffect(() => {
        if (!socket) return;
        socket.on('connect', () => {
            setDisconnected(false);
            heartCheck.reset(heartCheck).start(heartCheck, socket);
        });

        return () => {
            socket.off("connect");
        }
    }, [networkConnected, socket]);

    useEffect(() => {
        if (!socket) return;

        socket.on('pong', async () => {
            await new Promise((res) => setTimeout(res, 5000));
            socket.emit('ping');
        });

        return () => {
            socket.off('pong');
        }
    }, [networkConnected, socket]);

    useEffect(() => {
        if (!socket) return;

        socket.on('authFailure', async () => {
            await resetSocket();
        });

        return () => {
            socket.off('authFailure');
        }
    }, [networkConnected, socket]);

    useEffect(() => {
        if (!socket) return;

        socket.onAny(() => {
            setDisconnected(false);
            heartCheck.reset(heartCheck).start(heartCheck, socket);
        });
    }, [socket])

    return (
        <SocketContext.Provider value={{socket, disconnected, resetSocket}}>
            {children}
        </SocketContext.Provider>
    );
}

export default SocketContext;