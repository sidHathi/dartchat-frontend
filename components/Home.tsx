import React, { useState, useContext, useRef, useEffect, useCallback } from "react";
import { UIState, UIScreen, Conversation } from "../types/types";
import UIContext from "../contexts/UIContext";
import NavContainer from "./NavContainer";
import ChatSelector from "./ChatSelectionUI/ChatSelector";
import MessagingContainer from "./MessagingUI/MessagingContainer";
import ChatDisplay from "./MessagingUI/ChatDisplay";
import UserConversationsController from "./UserConversationsController";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { chatSelector, exitConvo } from "../redux/slices/chatSlice";
import IdentityManager from "./IdentityManagement/IdentityManager";
import { View, PanResponder, Pressable } from "react-native";
import SocketContext from "../contexts/SocketContext";
import People from "./PeoplePanel/People";
import UserSecretsContext from "../contexts/UserSecretsContext";

export default function Home(): JSX.Element {
    const timerId = useRef<NodeJS.Timeout | boolean>(false);
    const dispatch = useAppDispatch();
    const { uiState, navSwitch } = useContext(UIContext);
    const { forgetConversationKeys } = useContext(UserSecretsContext);
    const { disconnected: socketDisconnected, resetSocket } = useContext(SocketContext);
    const { silent, silentKeyMap, currentConvo, conversationLoading, conversationSet } = useAppSelector(chatSelector);

    const handleConversationExit = useCallback(() => {
        dispatch(exitConvo());
        navSwitch('conversations');
    }, [silent, currentConvo, forgetConversationKeys]);

    const Main = (): JSX.Element => <>
        <NavContainer>
            <ChatSelector openChat={() => navSwitch('messaging')} closeChat={() => navSwitch('conversations')} />
        </NavContainer>
    </>

    const ProfileScreen = () : JSX.Element => (
        <NavContainer>
            <IdentityManager />
        </NavContainer>
    );

    const PeopleView = () : JSX.Element => (
        <NavContainer>
            <People />
        </NavContainer>
    )

    const Messaging = useCallback((): JSX.Element => {
        if (conversationSet || conversationLoading) {
            return <MessagingContainer exit={handleConversationExit}/>
        } else {
            return <NavContainer>
                <MessagingContainer exit={handleConversationExit} />
            </NavContainer>
        }
    }, [conversationSet, conversationLoading]);

    const getScreen = () => {
        switch (uiState.screen) {
            case 'conversations':
                return <Main />
            case 'social':
                return <PeopleView />
            case 'messaging':
                return <Messaging />
            case 'profile':
                return <ProfileScreen />
            default:
                return <></>
        }
    }

    return <View style={{flex: 1}}>
        <UserConversationsController>
            {getScreen()}
        </UserConversationsController>
    </View>;
}