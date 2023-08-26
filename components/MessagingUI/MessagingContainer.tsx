import React, { useMemo } from 'react';
import ChatBuilder from './ChatBuilder';
import { useAppSelector } from '../../redux/hooks';
import { chatSelector } from '../../redux/slices/chatSlice';
import { Center } from 'native-base';
import Spinner from 'react-native-spinkit';
import ChatController from './ChatController';

export default function MessagingContainer({exit}: {exit: () => void}): JSX.Element {
    const { conversationSet, conversationLoading } = useAppSelector(chatSelector);

    const ChatGuard = useMemo((): JSX.Element => {
        if (conversationLoading) {
            return <Center w='100%' h='100%' bgColor='#f5f5f5'>
                <Spinner type='ThreeBounce' color='#111' />
            </Center>
        }
        else if (!conversationSet) return <ChatBuilder exit={exit} />
        return <ChatController exit={exit} />
    }, [conversationSet, conversationLoading]);

    return conversationSet ? <ChatController exit={exit} /> : ChatGuard;
}