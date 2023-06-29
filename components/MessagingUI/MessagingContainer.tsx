import React, { useContext, useEffect } from 'react';
import SocketContext from '../../contexts/SocketContext';
import CurrentConversationContext from '../../contexts/CurrentConversationContext';
import { Socket } from 'socket.io-client';
import ChatBuilder from './ChatBuilder';
import ChatDisplay from './ChatDisplay';
import { Message } from '../../types/types';
import { SocketMessage } from '../../types/rawTypes';

export default function MessagingContainer({exit}: {exit: () => void}): JSX.Element {
    const { currentConvo } = useContext(CurrentConversationContext);
    // const { socket } = useContext(SocketContext);

    const ChatGuard = (): JSX.Element => {
        if (!currentConvo) return <ChatBuilder exit={exit} />
        return <ChatDisplay exit={exit} />
    }

    return ChatGuard();
}