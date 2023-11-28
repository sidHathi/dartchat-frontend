import React, { useState, useContext, useCallback, useEffect } from 'react';
import { View, Box, Pressable } from 'native-base';
import ChatHeader from './ChatHeader';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { chatSelector, pullRecentMessages, setSecretKey } from '../../redux/slices/chatSlice';
import ConversationProfileManager from '../IdentityManagement/ConversationProfileManager';
import { Dimensions } from 'react-native';
import SocketContext from '../../contexts/SocketContext';
import NetworkContext from '../../contexts/NetworkContext';
import NetworkDisconnectionAlert from '../generics/alerts/NetworkDisconnectionAlert';
import ChatDisplay from './ChatDisplay';
import ChatSettingsController from '../ChatSettingsUI/ChatSettingsController';
import ExpandedSettingsMenu, { MenuPage } from '../ChatSettingsUI/ExpandedSettingsMenu';
import { setEnabled } from 'react-native/Libraries/Performance/Systrace';
import { pullLatestPreviews } from '../../redux/slices/userDataSlice';
import useRequest from '../../requests/useRequest';
import UserSecretsContext from '../../contexts/UserSecretsContext';
import { AppState } from 'react-native';
import colors from '../colors';
import UIContext from '../../contexts/UIContext';

export default function ChatController({
    exit
}: {
    exit: () => void;
}): JSX.Element {
    const dispatch = useAppDispatch();
    const { usersApi } = useRequest();
    const screenHeight = Dimensions.get('window').height;
    const { secrets, pullUserSecrets, forgetConversationKeys } = useContext(UserSecretsContext);
    const { currentConvo, silent, silentKeyMap, secretKey: ccSecretKey } = useAppSelector(chatSelector);
    const { disconnected: socketDisconnected } = useContext(SocketContext);
    const { networkConnected, apiReachable } = useContext(NetworkContext);
    const { conversationsApi } = useRequest();
    const { theme } = useContext(UIContext);

    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
    const [expandedSettingsOpen, setExpandedSettingsOpen] = useState(false);
    const [expandedSettingsPage, setExpandedSettingsPage] = useState<MenuPage | undefined>();

    useEffect(() => {
        if (currentConvo && !ccSecretKey && secrets && secrets[currentConvo.id]) {
            dispatch(setSecretKey(secrets[currentConvo.id]));
        }
    }, [secrets]);

    useEffect(() => {
        const eventListener = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                dispatch(pullRecentMessages(conversationsApi));
            }
        });

        return () => {
            eventListener.remove();
        };
    }, []);

    const toggleProfileOpen = useCallback(() => {
        setExpandedSettingsOpen(false);
        setProfileMenuOpen(!profileMenuOpen);
    }, [profileMenuOpen]);

    const toggleSettingsMenuOpen = useCallback(() => {
        setExpandedSettingsOpen(false);
        setSettingsMenuOpen(!settingsMenuOpen);
    }, [settingsMenuOpen]);

    const closeOverlays = useCallback(() => {
        if (settingsMenuOpen) setSettingsMenuOpen(false);
        if (profileMenuOpen) setProfileMenuOpen(false);
    }, [profileMenuOpen, settingsMenuOpen]);

    const openExpandedSettings = (page: MenuPage) => {
        setExpandedSettingsOpen(true);
        setExpandedSettingsPage(page);
    };

    const handleExit = useCallback(() => {
        if (settingsMenuOpen) {
            if (expandedSettingsOpen) {
                setExpandedSettingsOpen(false) 
            } else {
                setSettingsMenuOpen(false) 
            }
        } else {
            if (silent && silentKeyMap && currentConvo && currentConvo.messages.length < 1) {
                // console.log("FORGETTING FROM CONTROLLER")
                forgetConversationKeys(currentConvo.id);
            }
            exit();
            // dispatch(pullLatestPreviews(usersApi));
            // pullUserSecrets();
        }
    }, [exit, currentConvo, silent, settingsMenuOpen, expandedSettingsOpen, forgetConversationKeys, silentKeyMap]);

    return <View flex='1' backgroundColor={colors.navBG[theme]}>
        <Box backgroundColor={colors.bgLight[theme]} h='90px' overflow='hidden' zIndex='1001'>
        <ChatHeader 
                convoName={currentConvo?.name || 'Chat'}
                onSettingsOpen={() => {
                    closeOverlays();
                    toggleSettingsMenuOpen();
                }}
                onProfileOpen={() => {
                    closeOverlays();
                    toggleProfileOpen();
                }}
                onConvoExit={handleExit} 
                settingsMenuOpen={settingsMenuOpen}
                profileMenuOpen={profileMenuOpen}
            />
        </Box>
        <Box w='100%' h={`${screenHeight - 90} px`} backgroundColor={colors.bgLight[theme]} borderTopLeftRadius='24px' shadow='9' zIndex='1000'>
            {expandedSettingsOpen && expandedSettingsPage ? <ExpandedSettingsMenu currPage={expandedSettingsPage} exit={() => {
                setExpandedSettingsOpen(false);
                closeOverlays();
            }} /> :
            <>
            {
                profileMenuOpen &&
                <View
                    style={{
                        zIndex: 1001,
                        height: 0,
                        overflow: 'visible'
                    }}>
                    <Box h={`${screenHeight-90}px`}>
                    <ConversationProfileManager />
                    <Pressable flexGrow='1' flexShrink='0' onPress={closeOverlays}></Pressable>
                    </Box>
                </View>
            }
            {
                settingsMenuOpen &&
                <View
                    style={{
                        zIndex: 1001,
                        height: 0,
                        overflow: 'visible'
                    }}>
                    <Box h={`${screenHeight-90}px`} w='100%'>
                    <ChatSettingsController openExpandedSettings={openExpandedSettings}/>
                    <Pressable flexGrow='1' flexShrink='0' onPress={closeOverlays}></Pressable>
                    </Box>
                </View>
            }
        {
            (!networkConnected || !apiReachable) &&
            <Box marginTop='-180px' zIndex='1003'>
                <NetworkDisconnectionAlert type={networkConnected ? 'server' : 'network'} />
            </Box>
        }
            <ChatDisplay closeOverlays={closeOverlays} />
        </>
        }
        </Box>
    </View>
}