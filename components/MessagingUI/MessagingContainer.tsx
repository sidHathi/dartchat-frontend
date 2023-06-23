import React, {useContext} from 'react';
import ConversationContext from '../../contexts/ConversationContext';
import ChatBuilder from './ChatBuilder';
import ChatDisplay from './ChatDisplay';

export default function MessagingContainer({exit}: {exit: () => void}): JSX.Element {
    const { currentConvo } = useContext(ConversationContext);

    const ChatGuard = (): JSX.Element => {
        if (!currentConvo) return <ChatBuilder exit={exit} />
        return <ChatDisplay exit={exit} />
    }

    return ChatGuard();
}