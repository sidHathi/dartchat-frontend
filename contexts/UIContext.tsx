import React, { PropsWithChildren, ReactNode, createContext, useEffect, useState } from "react";
import { UIState, UIScreen } from "../types/types";
import { useAppSelector } from "../redux/hooks";
import { userDataSelector } from "../redux/slices/userDataSlice";

type UIContextType = {
    uiState: UIState;
    navSwitch: (newScreen: UIScreen) => void;
    theme: 'dark' | 'light';
};

const UIContext = createContext<UIContextType>({
    uiState: {
        screen: 'conversations',
        selectedConversation: undefined
    },
    navSwitch: () => {},
    theme: 'light'
});

export function UIContextProvider({children}: PropsWithChildren<{children: ReactNode}>): JSX.Element {
    const { uiTheme } = useAppSelector(userDataSelector);

    const [uiState, setUiState] = useState<UIState>({
        screen: 'conversations',
        selectedConversation: undefined
    });
    const [theme, setTheme] = useState<'dark' | 'light'>('light');

    const navSwitch = (newScreen: UIScreen) => {
        setUiState({...uiState, screen: newScreen});
    };

    useEffect(() => {
        setTheme(uiTheme || 'light');
    }, [uiTheme])

    return <UIContext.Provider value={{uiState, navSwitch, theme}}>
        {children}
    </UIContext.Provider>
}

export default UIContext;
