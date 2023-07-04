import React, { createContext, useState, useEffect, PropsWithChildren, ReactNode } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { REACT_APP_API_URL } from '@env';

const NetworkContext = createContext<{
    networkConnected: boolean;
}>({ networkConnected: false });

export function NetworkContextProvider({children}: PropsWithChildren<{
    children: ReactNode
}>): JSX.Element {
    const netInfo = useNetInfo({
        reachabilityUrl: `${REACT_APP_API_URL}/`,
        reachabilityTest: async (response) => response.status === 204,
        reachabilityLongTimeout: 60 * 1000, // 60s
        reachabilityShortTimeout: 5 * 1000, // 5s
        reachabilityRequestTimeout: 15 * 1000, // 15s
        reachabilityShouldRun: () => true,
        shouldFetchWiFiSSID: true, // met iOS requirements to get SSID
        useNativeReachability: false
      });
    const [networkConnected, setNetworkConnected] = useState(false);

    useEffect(() => {
        setNetworkConnected(netInfo?.isConnected || false);
    }, [netInfo])

    return <NetworkContext.Provider value={{networkConnected}}>
        {children}
    </NetworkContext.Provider>
}

export default NetworkContext;