import React from 'react';

import { Box } from 'native-base';
import { Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { Octicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';

type IconLabel = 'profile' |
    'search' |
    'settings' |
    'back' |
    'heartFill' |
    'heartEmpty'|
    'reply' |
    'send' |
    'cancel' |
    'delete' |
    'plus' |
    'edit' |
    'download' |
    'message' |
    'leave' |
    'retry';

export default function IconButton({label, size, color, onPress, shadow, disabled, additionalProps}: {
        label: IconLabel,
        size: number,
        color?: string,
        onPress?: () => void,
        shadow?: string,
        disabled?: boolean,
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
            case 'send':
                return <MaterialCommunityIcons name="send-circle" size={size} color={color || 'white'} />
            case 'cancel':
                return <MaterialIcons name="cancel" size={size} color={color || 'white'} />
            case 'delete':
                return <MaterialIcons name="delete-outline" size={size} color={color || 'white'} />
            case 'plus':
                return <Feather name="plus" size={size} color={color || 'white'} />
            case 'edit':
                return <Feather name="edit-3" size={size} color={color || 'white'} />
            case 'download':
                return <Feather name="download" size={size} color={color || 'white'} />
            case 'message':
                return <Feather name="message-circle" size={size} color={color || 'white'} />
            case 'leave':
                return <Ionicons name="ios-exit-outline" size={size} color={color || 'white'} />
            case 'retry':
                return <MaterialCommunityIcons name="reload" size={size} color={color || 'white'} />
            default:
                return <>
                </>
        }
    }

    return <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.5} hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
        <Box bgColor='rgba(255, 255, 255, 0.1)' {...additionalProps} shadow={shadow || 'none'} borderRadius={size/2} opacity={disabled ? '0.5' : '1'}>
            {getIcon()}
        </Box>
    </TouchableOpacity>
}

