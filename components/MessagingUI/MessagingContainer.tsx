import React, { useContext, useMemo } from 'react';
import ChatBuilder from './ChatBuilder';
import { useAppSelector } from '../../redux/hooks';
import { chatSelector } from '../../redux/slices/chatSlice';
import { Center } from 'native-base';
import Spinner from 'react-native-spinkit';
import ChatController from './ChatController';
import UIContext from '../../contexts/UIContext';
import colors from '../colors';

export default function MessagingContainer({exit}: {exit: () => void}): JSX.Element {
    const { conversationSet, conversationLoading, notificationLoading } = useAppSelector(chatSelector);
    const { theme } = useContext(UIContext)

    const ChatGuard = useMemo((): JSX.Element => {
        if (conversationLoading || notificationLoading) {
            return <Center w='100%' h='100%' bgColor={colors.loading[theme]}>
                <Spinner type='ThreeBounce' color={colors.textMainNB[theme]} />
            </Center>
        }
        else if (!conversationSet) return <ChatBuilder exit={exit} />
        return <ChatController exit={exit} />
    }, [conversationSet, conversationLoading, notificationLoading]);

    return (conversationSet) ? <ChatController exit={exit} /> : ChatGuard;
}