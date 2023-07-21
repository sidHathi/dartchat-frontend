import React, { useState, useContext, useCallback } from 'react';
import { View, Box, Pressable } from 'native-base';
import ChatHeader from './ChatHeader';
import { useAppSelector } from '../../redux/hooks';
import { chatSelector } from '../../redux/slices/chatSlice';
import ConversationProfileManager from '../IdentityManagement/ConversationProfileManager';
import { Dimensions } from 'react-native';
import SocketContext from '../../contexts/SocketContext';
import NetworkContext from '../../contexts/NetworkContext';
import NetworkDisconnectionAlert from '../generics/alerts/NetworkDisconnectionAlert';
import ChatDisplay from './ChatDisplay';
import ChatSettingsController from '../ChatSettingsUI/ChatSettingsController';
import ExpandedSettingsMenu, { MenuPage } from '../ChatSettingsUI/ExpandedSettingsMenu';

export default function ChatController({
    exit
}: {
    exit: () => void;
}): JSX.Element {
    const screenHeight = Dimensions.get('window').height;
    const { currentConvo } = useAppSelector(chatSelector);
    const { disconnected: socketDisconnected } = useContext(SocketContext);
    const { networkConnected } = useContext(NetworkContext);

    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
    const [expandedSettingsOpen, setExpandedSettingsOpen] = useState(false);
    const [expandedSettingsPage, setExpandedSettingsPage] = useState<MenuPage | undefined>();

    const toggleProfileOpen = useCallback(() => {
        setProfileMenuOpen(!profileMenuOpen);
    }, [profileMenuOpen]);

    const toggleSettingsMenuOpen = useCallback(() => {
        setSettingsMenuOpen(!settingsMenuOpen);
    }, [settingsMenuOpen]);

    const closeOverlays = useCallback(() => {
        if (settingsMenuOpen) setSettingsMenuOpen(false);
        if (profileMenuOpen) setProfileMenuOpen(false);
    }, [profileMenuOpen, settingsMenuOpen]);

    const openExpandedSettings = (page: MenuPage) => {
        setExpandedSettingsOpen(true);
        setExpandedSettingsPage(page);
    }

    return <View flex='1' backgroundColor='#111'>
        <Box backgroundColor='#fefefe' h='90px' overflow='hidden' zIndex='1001'>
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
                onConvoExit={() => {
                    settingsMenuOpen ? 
                        expandedSettingsOpen ? setExpandedSettingsOpen(false) :  setSettingsMenuOpen(false) 
                    : exit()
                }} 
            />
        </Box>
        <Box w='100%' h={`${screenHeight - 90} px`} backgroundColor='#fefefe' borderTopLeftRadius='24px' shadow='9' zIndex='1000'>
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
            (!networkConnected || socketDisconnected) &&
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