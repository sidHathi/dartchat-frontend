import React, { useState, useContext } from "react";
import { UIState, UIScreen, Conversation } from "../types/types";
import UIContext from "../contexts/UIContext";
import NavContainer from "./NavContainer";
import ChatSelector from "./ChatSelectionUI/ChatSelector";
import MessagingContainer from "./MessagingUI/MessagingContainer";
import ChatDisplay from "./MessagingUI/ChatDisplay";
import { CCContextProvider } from "../contexts/CurrentConversationContext";
import UserConversationsController from "./UserConversationsController";
import { useAppDispatch } from "../redux/hooks";
import { exitConvo } from "../redux/slices/chatSlice";

export default function Home(): JSX.Element {
    const dispatch = useAppDispatch();
    const { uiState, navSwitch } = useContext(UIContext);

    const handleConversationExit = () => {
        dispatch(exitConvo());
        navSwitch('conversations');
    }

    const NavScreen = (): JSX.Element => <>
        <NavContainer navState={uiState.screen} navSwitch={navSwitch}>
            <ChatSelector openChat={() => navSwitch('messaging')}/>
        </NavContainer>
    </>

    const getScreen = () => {
        switch (uiState.screen) {
            case 'conversations':
                return <NavScreen />
            case 'social':
                return <NavScreen />
            case 'messaging':
                return <MessagingContainer exit={handleConversationExit}/>
            default:
                return <></>
        }
    }

    return <UserConversationsController>
        {getScreen()}
    </UserConversationsController>;
}