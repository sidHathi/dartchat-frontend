import React, { createContext, useState, useEffect, PropsWithChildren, ReactNode } from 'react';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
// import { REACT_APP_API_URL } from '@env';
import Config from 'react-native-config';

const NetworkContext = createContext<{
    networkConnected: boolean;
    apiReachable: boolean;
}>({ networkConnected: false, apiReachable: false });

export function NetworkContextProvider({children}: PropsWithChildren<{
    children: ReactNode
}>): JSX.Element {
    const { isConnected, isInternetReachable} = useNetInfo({
        reachabilityUrl: `${Config.REACT_APP_API_URL}/`,
        reachabilityTest: async (response) => response.status === 204,
        reachabilityLongTimeout: 60 * 1000, // 60s
        reachabilityShortTimeout: 5 * 1000, // 5s
        reachabilityRequestTimeout: 15 * 1000, // 15s
        reachabilityShouldRun: () => true,
        shouldFetchWiFiSSID: true, // met iOS requirements to get SSID
        useNativeReachability: false
      });
    const [networkConnected, setNetworkConnected] = useState(false);
    const [apiReachable, setApiReachable] = useState(false);

    useEffect(() => {
        NetInfo.fetch()
    }, []);

    useEffect(() => {
        const getNetInfo = async () => {
            setNetworkConnected(isConnected || false);
            setApiReachable(isInternetReachable !== null ? isInternetReachable : isConnected || false);
            try {
                const state = await NetInfo.fetch();
                // console.log(state);
                if (state) {
                    setNetworkConnected(state.isConnected || false);
                    setApiReachable(state.isInternetReachable !== null ? state.isInternetReachable : state.isConnected || false);
                }
            } catch (err) {
                console.log(err);
            }
            if (!isInternetReachable) {
                NetInfo.refresh();
                await NetInfo.fetch();
            }
        }
        getNetInfo();
    }, [isConnected, isInternetReachable])

    return <NetworkContext.Provider value={{
        networkConnected,
        apiReachable
    }}>
        {children}
    </NetworkContext.Provider>
}

export default NetworkContext;