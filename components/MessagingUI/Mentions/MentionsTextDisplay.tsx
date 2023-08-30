import React, { useMemo, useCallback, useState } from 'react';
import {
    Part,
    PartType,
    parseValue,
    isMentionPartType,
  } from 'react-native-controlled-mentions';
import { Text, ITextProps } from 'native-base';
import Autolink from 'react-native-autolink';
import { UserConversationProfile } from '../../../types/types';
import { Pressable } from 'react-native';
import { Linking } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

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
    const [copied, setCopied] = useState(false);

    const renderPart = (
        part: Part,
        index: number,
        ) => {
        // Just plain text
        if (!part.partType) {
            return <Autolink 
                key={`${index}-pattern`}
                text={part.text} 
                linkStyle={{
                    fontWeight: 'bold',
                    color: 'blue'
                }}
                renderLink={(text, match) => (
                    <Text color='blue.500' fontWeight='bold' 
                        onPress={() => {
                            Linking.openURL(match.getAnchorHref())
                        }}
                        onLongPress={async () => {
                            Clipboard.setString(match.getAnchorText());
                            setCopied(true);
                            await new Promise(res => setTimeout(res, 2000));
                            setCopied(false);
                        }}>
                        {text}
                    </Text>
                )}
                url={true}
                email={true}
                phone='text'
                component={Text} 
                selectable
                />;
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
            <Autolink 
                key={`${index}-pattern`}
                text={part.text} 
                linkStyle={{
                    fontWeight: 'bold',
                    color: 'blue'
                }}
                renderLink={(text, match) => (
                    <Text color='blue.500' fontWeight='bold' onPress={() => Linking.openURL(match.getAnchorHref())}>
                        {text}
                    </Text>
                )}
                url={true}
                phone='sms'
                component={Text}
                />
        );
    };

    const types: PartType[] = [
        {trigger: '@'}
    ]

    const {parts} = parseValue(message.content, types);
  
    return <>
        <Text {...props}>{parts.map(renderPart)}</Text>
        {copied && <Text fontSize='10px' color='gray.500' mx='auto'>Copied to clipboard</Text>}
    </>;
}
