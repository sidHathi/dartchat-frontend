import React, { useMemo, useCallback } from 'react';
import {
    Part,
    PartType,
    parseValue,
    isMentionPartType,
  } from 'react-native-controlled-mentions';
import { Text, ITextProps } from 'native-base';
import { UserConversationProfile } from '../../../types/types';

export default function MentionsTextDisplay({
    message,
    handleMentionSelect,
    ...props
}: {
    message: {
        content: string,
        mentions?: {
            id: string,
            displayName: string,
        }[]
    },
    handleMentionSelect?: (id: string) => void
} & ITextProps): JSX.Element {
    const idProfileMap = useMemo(() => {
        if (!message.mentions) return {};
        return Object.fromEntries(
            message.mentions.map((mention) => ([
                mention.id, mention
            ]))
        )
    }, [message]);

    const getProfileForId = useCallback((id: string) => {
        if (id in idProfileMap) {
            return idProfileMap[id];
        }
        return undefined;
    }, [idProfileMap]);

    const renderPart = (
        part: Part,
        index: number,
        ) => {
        // Just plain text
        if (!part.partType) {
            return <Text key={index}>{part.text}</Text>;
        }

        // Mention type part
        if (isMentionPartType(part.partType)) {
            return (
                <Text
                    fontWeight='bold'
                    key={`${index}-${part.data?.trigger}`}
                    style={part.partType.textStyle}
                    onPress={() => handleMentionSelect && part.data && handleMentionSelect(part.data.id)}
                >
                    {part.text}
                </Text>
            );
        }

        // Other styled part types
        return (
            <Text
                key={`${index}-pattern`}
                style={part.partType.textStyle}
                >
                {part.text}
            </Text>
        );
    };

    const types: PartType[] = [
        {trigger: '@'}
    ]

    const {parts} = parseValue(message.content, types);
  
    return <Text {...props}>{parts.map(renderPart)}</Text>;
}
