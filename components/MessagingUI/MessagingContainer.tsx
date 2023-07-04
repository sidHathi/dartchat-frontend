import React, { useContext, useEffect } from 'react';
import SocketContext from '../../contexts/SocketContext';
import { Socket } from 'socket.io-client';
import ChatBuilder from './ChatBuilder';
import ChatDisplay from './ChatDisplay';
import { Message } from '../../types/types';
import { SocketMessage } from '../../types/rawTypes';
import { useAppSelector } from '../../redux/hooks';
import { chatSelector } from '../../redux/slices/chatSlice';
import { Center } from 'native-base';
import Spinner from 'react-native-spinkit';

export default function MessagingContainer({exit}: {exit: () => void}): JSX.Element {
    const { currentConvo, requestLoading } = useAppSelector(chatSelector);

    const ChatGuard = (): JSX.Element => {
        if (!currentConvo && requestLoading) {
            return <Center w='100%' h='100%' bgColor='#f5f5f5'>
                <Spinner type='CircleFlip' color='#111' />
            </Center>
        }
        else if (!currentConvo) return <ChatBuilder exit={exit} />
        return <ChatDisplay exit={exit} />
    }

    return ChatGuard();
}