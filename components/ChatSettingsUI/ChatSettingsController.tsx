import React, { useState, useCallback } from 'react';
import ChatSettingsHome from './ChatSettingsHome';
import NotificationsSettings from './NotifcationsSettings';
import { View } from 'native-base';
import { MenuPage } from './ExpandedSettingsMenu';

export type ChatSettingsPanel = 'main' | 'notifications'

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
                return <NotificationsSettings exit={() => setSettingsPanel('main')}/>;
            default:
                return <></>;
        }
    }, [settingsPanel]);

    return <View flexGrow='0' flexShrink='1'>
        {getCurrentPanel()}
    </View>
}
