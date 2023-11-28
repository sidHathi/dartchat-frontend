import React, { useMemo, useContext } from "react";
import { Box, Center, HStack, Spacer, Text } from 'native-base';
import { Ionicons, Feather, MaterialIcons, MaterialCommunityIcons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { TouchableOpacity } from "react-native-gesture-handler";
import { useAppSelector } from "../../redux/hooks";
import { chatSelector } from "../../redux/slices/chatSlice";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import colors from "../colors";
import UIContext from "../../contexts/UIContext";

export type ButtonLabel = 'members' |
                    'share' |
                    'gallery' |
                    'events' |
                    'polls' |
                    'encryption' |
                    'leave' |
                    'notifications' |
                    'search' |
                    'admin' |
                    'like button' |
                    'chat profile';

export default function ButtonGrid({onButtonSelect}: {
    onButtonSelect: (buttonLabel: ButtonLabel) => void;
}): JSX.Element {
    const { user } = useContext(AuthIdentityContext);
    const { currentConvo } = useAppSelector(chatSelector);
    const { theme } = useContext(UIContext);

    const notificationsIcon = useMemo(() => {
        if (!currentConvo || !user) return 'notifications-active';
        const matchingUserProfiles = currentConvo.participants.filter((p) => p.id === user.id);
        if (matchingUserProfiles.length > 0) {
            switch (matchingUserProfiles[0].notifications) {
                case 'all':
                    return 'notifications-active';
                case 'mentions':
                    return 'notification-important';
                case 'none':
                    return 'notifications-off';
            }
        }
        return 'notifications-active';
    }, [currentConvo])

    const getIconForLabel = (label: ButtonLabel) => {
        switch (label) {
            case 'members':
                return <Ionicons name="people" size={24} color={colors.textMainNB[theme]} />;
            case 'share':
                return <Feather name="share" size={24} color={colors.textMainNB[theme]} />;
            case 'gallery':
                return <Ionicons name="ios-images" size={24} color={colors.textMainNB[theme]} />;
            case 'events':
                return <MaterialIcons name="event" size={24} color={colors.textMainNB[theme]} />;
            case 'polls':
                return <MaterialCommunityIcons name="poll" size={24} color={colors.textMainNB[theme]} />;
            case 'encryption':
                return <MaterialIcons name="security" size={24} color={colors.textMainNB[theme]} />;
            case 'leave':
                return <Ionicons name="ios-exit-outline" size={24} color="red" />;
            case 'admin':
                return <MaterialIcons name="admin-panel-settings" size={24} color={colors.textMainNB[theme]} />;
            case 'notifications': 
                return <MaterialIcons name={notificationsIcon} size={24} color={colors.textMainNB[theme]} />
            case 'search':
                return <Feather name="search" size={24} color={colors.textMainNB[theme]} />;
            case 'like button':
                return <FontAwesome name="heart-o" size={24} color={colors.textMainNB[theme]} />;
            case 'chat profile':
                return <Ionicons name="ios-person-circle" size={30} color={colors.textMainNB[theme]} />
            default: 
                return;
        }
    }

    const GridButton = ({label} : {
        label: ButtonLabel
    }) => {
        return <TouchableOpacity onPress={() => onButtonSelect(label)}>
            <Center minWidth='90px'>
            <Box w='60px' h='60px' borderRadius='30px' bgColor={colors.settingsButton[theme]} shadow='9' style={{shadowOpacity: 0.12}} p='0px' mx='auto'>
                <Center w='100%' h='100%' m='auto'>
                    {getIconForLabel(label)}
                </Center>
            </Box>
            <Text mt='12px' textTransform='capitalize' fontSize='xs' color={colors.subTextNB[theme]} textAlign='center' mx='auto' maxWidth='72px' numberOfLines={1}>
                {`${label}`}
            </Text>
            </Center>
        </TouchableOpacity>
    }

    return <Box mt='12px' mx='18px' pt='6px'>
        { (currentConvo && currentConvo.group) ? <>
        <HStack space={2} my='9px'>
            <Spacer />
            <GridButton label='members' />
            <Spacer />
            <GridButton label='like button' />
            <Spacer />
            {/* <GridButton label='search' /> */}
            <GridButton label='notifications' />
            <Spacer />
        </HStack>
        <HStack space={2} my='9px'>
            <Spacer />
                <GridButton label='gallery' />
            <Spacer />
                <GridButton label='polls' />
            <Spacer />
                <GridButton label='events' />
            <Spacer />
        </HStack>
        <HStack space={2} my='9px'>
            <Spacer />
                <GridButton label='chat profile' />
            <Spacer />
                {
                    currentConvo?.publicKey &&
                    <GridButton label='encryption' />
                }
                <Spacer />
                <GridButton label='leave' />
            <Spacer />
        </HStack> 
        </> : <>
        <HStack space={3} my='9px'>
            <Spacer />
            <GridButton label='notifications' />
            <Spacer />
            <GridButton label='gallery' />
            <Spacer />
            <GridButton label='encryption' />
            <Spacer />
        </HStack>
        </>}
    </Box>
}
