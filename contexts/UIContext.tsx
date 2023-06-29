import React, { PropsWithChildren, ReactNode, createContext, useState } from "react";
import { UIState, UIScreen } from "../types/types";

type UIContextType = {
    uiState: UIState;
    navSwitch: (newScreen: UIScreen) => void;
};

const UIContext = createContext<UIContextType>({
    uiState: {
        screen: 'conversations',
        selectedConversation: undefined
    },
    navSwitch: () => {},
});

export function UIContextProvider({children}: PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const [uiState, setUiState] = useState<UIState>({
        screen: 'conversations',
        selectedConversation: undefined
    });

    const navSwitch = (newScreen: UIScreen) => {
        setUiState({...uiState, screen: newScreen});
    };

    return <UIContext.Provider value={{uiState, navSwitch}}>
        {children}
    </UIContext.Provider>
}

export default UIContext;
