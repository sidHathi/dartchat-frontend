import React, {useState, useCallback, useMemo, FC, useContext, createContext} from "react";
import { Input, Text } from 'native-base';
import { MentionInput, MentionSuggestionsProps, Suggestion } from "react-native-controlled-mentions";
import { useAppSelector } from "../../../redux/hooks";
import { chatSelector } from "../../../redux/slices/chatSlice";
import MentionSelector from "./MentionSelector";
import { UserConversationProfile } from "../../../types/types";
import { matchMentionQuery } from "../../../utils/messagingUtils";
import { LayoutChangeEvent, TextInputProps } from "react-native";
import MentionSuggestionContext from "../../../contexts/MentionSuggestionContext";

export default function MentionsInput({
    messageText,
    setMessageText,
    ...props
}: {
    messageText: string | undefined,
    setMessageText: (newText: string | undefined) => void;
} & TextInputProps) {
    const { currentConvo } = useAppSelector(chatSelector);
    const [showingSuggestions, setShowingSuggestions] = useState(false);

    const suggestions = useMemo(() => {
        if (!currentConvo) return [];
        return currentConvo.participants.map((p) => ({
            id: p.id,
            name: p.displayName
        }));
    }, [currentConvo]);

    const idProfileMap = useMemo(() => {
        if (!currentConvo) return {};
        return Object.fromEntries(
            currentConvo.participants.map((p) => (
                [p.id, p]
            ))
        )
    }, [currentConvo]);

    const handleChangeText = useCallback((text: string) => {
        // handle formatting the content and storing it
        setMessageText(text);
    }, [messageText, setMessageText]);

    const renderSuggestions: FC<MentionSuggestionsProps> = ({keyword, onSuggestionPress}: MentionSuggestionsProps) => {
        if (!keyword) {
            // setS(false);
            return <MentionSelector 
                profileMatches={[]} 
                onSelect={() => {return;}} />
        }
        const idSuggestionMap: {[id: string]: Suggestion} = {};
        const profiles = suggestions.map((s) => {
            if (s.id in idProfileMap) {
                idSuggestionMap[s.id] = s;
                return idProfileMap[s.id]
            }
            return <></>;
        })
        .filter((s) => s !== undefined) as UserConversationProfile[];
        const profileMatches = matchMentionQuery(keyword, profiles);
        return <MentionSelector profileMatches={profileMatches || []} onSelect={(profile) => {
            if (profile.id in idSuggestionMap) {
                onSuggestionPress(idSuggestionMap[profile.id]);
            }
        }} />
    };

    return (
        <MentionSuggestionContext.Provider value={{
            showingSuggestions,
            setShowingSuggestions
        }}>
        <MentionInput
            {...props}
            value={messageText || ''}
            onChange={handleChangeText}
            partTypes={[
                {
                  trigger: '@', // Should be a single character like '@' or '#'
                  renderSuggestions,
                  textStyle: {fontWeight: 'bold', color: 'black'}, // The mention style in the input
                },
              ]} 
            placeholder='Message'
            style={{
                flexGrow: 1,
                height: 40,
                borderRadius: 20,
                paddingRight: 20,
                paddingLeft: 20,
                backgroundColor: '#f5f5f5',
                width: '100%',
                paddingTop: 12,
                borderTopLeftRadius: showingSuggestions ? 0 : 20,
                borderTopRightRadius: showingSuggestions ? 0 : 20
            }}
            />
        </MentionSuggestionContext.Provider>
    )
}