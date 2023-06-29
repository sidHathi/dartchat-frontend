import React, { PropsWithChildren, createContext, useState, ReactNode, useContext, useEffect } from "react";
import { Conversation, Message, UserConversationProfile, SocketEvent } from "../types/types";
import SocketContext from "./SocketContext";
import AuthIdentityContext from "./AuthIdentityContext";
import uuid from 'react-native-uuid';

type CCContextType = {
    currentConvo: Conversation | undefined,
    setConvo: (convo: Conversation) => void,
    exitConvo: () => void,
    sendNewMessage: (message: Message) => void,
    receiveNewMessage: (message: Message) => void,
    modifyConversationSettings: (settings: any) => void,
    addParticipant: (newMember: UserConversationProfile) => void,
    removeParticipant: (member: UserConversationProfile) => void,
    sendNewLike: (messageId: string, userId: string) => void,
    receiveNewLike: (messageId: string, userId: string, event: SocketEvent) => void,
    handleAvatarUpdate: (newAvatar: any) => void,
};

const CurrentConversationContext = createContext<CCContextType>({
    currentConvo: undefined,
    setConvo: () => {},
    exitConvo: () => {},
    sendNewMessage: () => {},
    receiveNewMessage: () => {},
    modifyConversationSettings: () => {},
    addParticipant: () => {},
    removeParticipant: () => {},
    sendNewLike: () => {},
    receiveNewLike: () => {},
    handleAvatarUpdate: () => {},
});

export function CCContextProvider({children}:
    PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const [currentConvo, setCurrentConvo] = useState<Conversation | undefined>(undefined);
    const { user, modifyUser } = useContext(AuthIdentityContext);
    const { socket } = useContext(SocketContext);

    const setConvo = (convo: Conversation) => {
        setCurrentConvo(convo);
    };

    const exitConvo = () => {
        setCurrentConvo(undefined);
    };

    const sendNewMessage = (message: Message) => {
        if (!currentConvo) return;
        console.log(message);
        socket?.emit('newMessage', currentConvo.id, message);
        setCurrentConvo({
          ...currentConvo,
            messages: [...currentConvo.messages, message]
        });
        if (user && user.conversations) {
            modifyUser({
                ...user,
                conversations: [
                    {
                        ...user.conversations.filter((c) => c.cid === currentConvo.id)[0],
                        cid: currentConvo.id,
                        lastMessageContent: message.content,
                        unSeenMessages: 0,
                        lastMessageTime: message.timestamp
                    },
                    ...user.conversations.filter((c) => c.cid !== currentConvo.id)
                ]
            })
        }
    };

    const receiveNewMessage = (message: Message) => {
        if (!currentConvo) return;
        setCurrentConvo({
          ...currentConvo,
            messages: [...currentConvo.messages, message]
        });
    };

    const modifyConversationSettings = (settings: any) => {
        if (!currentConvo) return;
        setCurrentConvo({
          ...currentConvo,
            settings
        });
    };

    const addParticipant = (newMember: UserConversationProfile) => {
        if (!currentConvo) return;
        setCurrentConvo({
          ...currentConvo,
            participants: [...currentConvo.participants, newMember]
        });
    };

    const removeParticipant = (member: UserConversationProfile) => {
        if (!currentConvo) return;
        setCurrentConvo({
         ...currentConvo,
            participants: currentConvo.participants.filter(p => p!== member)
        });
    };

    const sendNewLike = (messageId: string, userId: string) => {
        if (!currentConvo) return;
        let type= 'newLike';
        setCurrentConvo({
        ...currentConvo,
            messages: currentConvo.messages.map(m => {
                if (m.id === messageId) {
                    const prevLikes = m.likes.filter(l => l !== userId);
                    if (m.likes.length > prevLikes.length) {
                        m.likes = prevLikes;
                        type = 'disLike';
                    } else {
                        m.likes.push(userId);
                    }
                }
                return m;
            })
        });
        if (socket) {
            const event: SocketEvent = {
                id: uuid.v4() as string,
                type,
                timestamp: new Date()
            }
            socket.emit('newLikeEvent', currentConvo.id, messageId, event);
        }
    };

    const receiveNewLike = (messageId: string, userId: string, event: SocketEvent) => {
        console.log('liking message');
        console.log(currentConvo?.messages.map((m) => m.id));
        if (!currentConvo) return;
        console.log('currentConvo exists');
        setCurrentConvo({
        ...currentConvo,
            messages: currentConvo.messages.map(m => {
                if (m.id === messageId) {
                    console.log('modifying convo');
                    const prevLikes = m.likes.filter(l => l !== userId);
                    console.log(prevLikes);
                    if (m.likes.length > prevLikes.length && event.type === 'disLike') {
                        console.log('removing like');
                        m.likes = prevLikes;
                    } else if (event.type === 'newLike') {
                        console.log('pushing new like');
                        m.likes.push(userId);
                    }
                    console.log(m);
                }
                return m;
            })
        });
    };

    const handleAvatarUpdate = (newAvatar: any) => {
        if (!currentConvo) return;
        setCurrentConvo({
          ...currentConvo,
            avatar: newAvatar
        });
    };

    return <CurrentConversationContext.Provider value={
        {
            currentConvo,
            setConvo,
            exitConvo,
            sendNewMessage,
            receiveNewMessage,
            modifyConversationSettings,
            addParticipant,
            removeParticipant,
            sendNewLike,
            receiveNewLike,
            handleAvatarUpdate
        }
    }>
        {children}
    </CurrentConversationContext.Provider>;
};

export default CurrentConversationContext;