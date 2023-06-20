import React from 'react';

import { Pressable, Box } from 'native-base';
import { Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { Octicons } from '@expo/vector-icons';

type IconLabel = 'profile' |
    'search' |
    'settings' |
    'back' |
    'heartFill' |
    'heartEmpty'|
    'reply';

export default function IconButton({label, size, color, onPress, additionalProps}: {
        label: IconLabel,
        size: number,
        color?: string,
        onPress?: () => void,
        additionalProps?: any
    }): JSX.Element {

    const getIcon = (): JSX.Element => {
        switch (label) {
            case 'profile':
                return <Image source={require('../../assets/profile-01.png')} 
                    style={{
                        width: size,
                        height: size
                    }}/>
            case 'settings':
                return <MaterialIcons name="settings" size={size} color={color || 'white'} />
            case 'search':
                return <MaterialIcons name="search" size={size} color={color || 'white'} />
            case 'back':
                return <Ionicons name="ios-chevron-back" size={size} color={color || 'white'} />
            case 'heartEmpty':
                return <FontAwesome name="heart-o" size={size} color={color || 'white'} />
            case 'heartFill':
                return <FontAwesome name="heart" size={size} color={color || 'white'} />
            case 'reply':
                return <Octicons name="reply" size={size} color={color || 'white'} />
            default:
                return <>
                </>
        }
    }

    return <Pressable onPress={onPress}>
        <Box borderRadius={`${size/2} px`} shadow='9' {...additionalProps}>
            {getIcon()}
        </Box>
    </Pressable>
}

