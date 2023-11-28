import React, { useState, useCallback } from 'react';
import ChatSettingsHome from './ChatSettingsHome';
import NotificationsSettings from './NotifcationsSettings';
import { View } from 'native-base';
import { MenuPage } from './ExpandedSettingsMenu';
import LikeButtonSelector from './LikeButtonSelector';
import UserDetailsModal from './UserDetailsModal';
import ConversationProfileManager from '../IdentityManagement/ConversationProfileManager';

export type ChatSettingsPanel = 'main' | 'notifications' | 'likeButton' | 'chatProfile';

export default function ChatSettingsController({
    openExpandedSettings
} : {
    openExpandedSettings: (page: MenuPage) => void
}): JSX.Element {
    const [settingsPanel, setSettingsPanel] = useState<ChatSettingsPanel>('main');

    const getCurrentPanel = useCallback((): JSX.Element => {
        switch (settingsPanel) {
            case 'main':
                return <ChatSettingsHome setSettingsPanel={setSettingsPanel} openExpandedView={openExpandedSettings}/>;
            case 'notifications':
                return <NotificationsSettings exit={() => setSettingsPanel('main')} />;
            case 'likeButton':
                return <LikeButtonSelector exit={() => setSettingsPanel('main')}/>;
            case 'chatProfile':
                return <ConversationProfileManager exit={() => setSettingsPanel('main')} />;
            default:
                return <></>;
        }
    }, [settingsPanel]);

    return <View flexGrow='0' flexShrink='1' zIndex='9999'>
        {getCurrentPanel()}
    </View>
}
