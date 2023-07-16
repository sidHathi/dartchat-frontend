import React, { useState, useContext, useRef, useEffect, useCallback } from "react";
import { UIState, UIScreen, Conversation } from "../types/types";
import UIContext from "../contexts/UIContext";
import NavContainer from "./NavContainer";
import ChatSelector from "./ChatSelectionUI/ChatSelector";
import MessagingContainer from "./MessagingUI/MessagingContainer";
import ChatDisplay from "./MessagingUI/ChatDisplay";
import UserConversationsController from "./UserConversationsController";
import { useAppDispatch } from "../redux/hooks";
import { exitConvo } from "../redux/slices/chatSlice";
import IdentityManager from "./IdentityManagement/IdentityManager";
import { View, PanResponder, Pressable } from "react-native";
import SocketContext from "../contexts/SocketContext";

export default function Home(): JSX.Element {
    const timerId = useRef<NodeJS.Timeout | boolean>(false);
    const dispatch = useAppDispatch();
    const { uiState, navSwitch } = useContext(UIContext);
    const { disconnected: socketDisconnected, resetSocket } = useContext(SocketContext);

    const [idle, setIdle] = useState(false);
    const [timeForInactivityInSecond] = useState(1200);

    const handleIdleUser = useCallback(() => idle === false && setIdle(true), [idle]);

    const handleActiveUser = useCallback(() => {
        if (idle && socketDisconnected) resetSocket();
    }, [socketDisconnected, idle]);
    
    useEffect(() => {
        resetInactivityTimeout()
    }, [])

    const panResponder = React.useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder:() => false,
            onMoveShouldSetPanResponderCapture:() => false,
            onStartShouldSetPanResponderCapture: () => {
                handleActiveUser();
                resetInactivityTimeout();
                return false;
            },
        })
    ).current

    const resetInactivityTimeout = () => {
        clearTimeout(timerId.current as any)
        timerId.current = setTimeout(() => {
            handleIdleUser();
        }, timeForInactivityInSecond * 1000)
    }

    const handleConversationExit = () => {
        dispatch(exitConvo());
        navSwitch('conversations');
    }

    const Main = (): JSX.Element => <>
        <NavContainer>
            <ChatSelector openChat={() => navSwitch('messaging')}/>
        </NavContainer>
    </>

    const ProfileScreen = () : JSX.Element => (
        <NavContainer>
            <IdentityManager />
        </NavContainer>
    )

    const getScreen = () => {
        switch (uiState.screen) {
            case 'conversations':
                return <Main />
            case 'social':
                return <Main />
            case 'messaging':
                return <MessagingContainer exit={handleConversationExit}/>
            case 'profile':
                return <ProfileScreen />
            default:
                return <></>
        }
    }

    return <View style={{flex: 1}} {...panResponder.panHandlers}>
        <UserConversationsController>
            {getScreen()}
        </UserConversationsController>
    </View>;
}