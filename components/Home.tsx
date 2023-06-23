import React, {useState} from "react";
import { UIState, UIScreen, Conversation } from "../types/types";
import { View, Box } from "native-base";
import NavContainer from "./NavContainer";
import ConversationsController from "./ConverstionsController";
import MessagingContainer from "./MessagingUI/MessagingContainer";
import ChatDisplay from "./MessagingUI/ChatDisplay";
import { ConversationContextProvider } from "../contexts/ConversationContext";

export default function Home(): JSX.Element {
    const [uiState, setUiState] = useState<UIState>({
        screen: 'conversations',
        selectedConversation: undefined
    });

    const handleNavSwitch = (newScreen: UIScreen) => {
        setUiState({...uiState, screen: newScreen});
    };

    const NavScreen = (): JSX.Element => <>
        <NavContainer navState={uiState.screen} navSwitch={handleNavSwitch}>
            <ConversationsController />
        </NavContainer>
    </>

    const getScreen = () => {
        switch (uiState.screen) {
            case 'conversations':
                return <NavScreen />
            case 'social':
                return <NavScreen />
            case 'messaging':
                return <MessagingContainer exit={() => handleNavSwitch('conversations')}/>
            default:
                return <></>
        }
    }

    return <ConversationContextProvider>
        {getScreen()}
    </ConversationContextProvider>;
}