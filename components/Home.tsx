import React, { useState, useContext } from "react";
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

export default function Home(): JSX.Element {
    const dispatch = useAppDispatch();
    const { uiState, navSwitch } = useContext(UIContext);

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

    return <UserConversationsController>
        {getScreen()}
    </UserConversationsController>;
}