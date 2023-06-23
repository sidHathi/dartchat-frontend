import React, { PropsWithChildren, createContext, useState, ReactNode } from "react";
import { Conversation, Message, UserConversationProfile } from "../types/types";

type ConversationContextType = {
    currentConvo: Conversation | undefined,
    newConvo: (
        participants: UserConversationProfile[], 
        name?: string, 
        avatar?: any,
        settings?: any) => void,
    exitConvo: () => void,
    handleNewMessage: (message: Message) => void,
    modifyConversationSettings: (settings: any) => void,
    addParticipant: (newMember: UserConversationProfile) => void,
    removeParticipant: (member: UserConversationProfile) => void,
    handleNewLike: (messageId: string, userId: string) => void,
    handleAvatarUpdate: (newAvatar: any) => void,
};

export const ConversationContext = createContext<ConversationContextType>({
    currentConvo: undefined,
    newConvo: () => {},
    exitConvo: () => {},
    handleNewMessage: () => {},
    modifyConversationSettings: () => {},
    addParticipant: () => {},
    removeParticipant: () => {},
    handleNewLike: () => {},
    handleAvatarUpdate: () => {},
});

export function ConversationContextProvider({children}:
    PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const [currentConvo, setCurrentConvo] = useState<Conversation | undefined>(undefined);

    const newConvo = (
        participants: UserConversationProfile[], 
        name?: string, 
        avatar?: any,
        settings?: any) => {
        setCurrentConvo({
            settings: settings || {},
            participants,
            messages: [],
            name,
            avatar
        });
    };

    const exitConvo = () => {
        setCurrentConvo(undefined);
    };

    const handleNewMessage = (message: Message) => {
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

    const handleNewLike = (messageId: string, userId: string) => {
        if (!currentConvo) return;
        setCurrentConvo({
        ...currentConvo,
            messages: currentConvo.messages.map(m => {
                if (m.id === messageId) {
                    const prevLikes = m.likes.filter(l => l !== userId);
                    if (m.likes.length > prevLikes.length) {
                        m.likes = prevLikes;
                    } else {
                        m.likes.push(userId);
                    }
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

    return <ConversationContext.Provider value={
        {
            currentConvo,
            newConvo,
            exitConvo,
            handleNewMessage,
            modifyConversationSettings,
            addParticipant,
            removeParticipant,
            handleNewLike,
            handleAvatarUpdate
        }
    }>
        {children}
    </ConversationContext.Provider>;
};

export default ConversationContext;