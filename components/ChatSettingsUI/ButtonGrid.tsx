import React, { useMemo, useContext } from "react";
import { Box, Center, HStack, Spacer, Text } from 'native-base';
import { Ionicons, Feather, MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity } from "react-native-gesture-handler";
import { useAppSelector } from "../../redux/hooks";
import { chatSelector } from "../../redux/slices/chatSlice";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";

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
                    'like button';

export default function ButtonGrid({onButtonSelect}: {
    onButtonSelect: (buttonLabel: ButtonLabel) => void;
}): JSX.Element {
    const { user } = useContext(AuthIdentityContext);
    const { currentConvo } = useAppSelector(chatSelector);

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
                return <Ionicons name="people" size={24} color="black" />;
            case 'share':
                return <Feather name="share" size={24} color="black" />;
            case 'gallery':
                return <Ionicons name="ios-images" size={24} color="black" />;
            case 'events':
                return <MaterialIcons name="event" size={24} color="black" />;
            case 'polls':
                return <MaterialCommunityIcons name="poll" size={24} color="black" />;
            case 'encryption':
                return <MaterialIcons name="security" size={24} color="black" />;
            case 'leave':
                return <Ionicons name="ios-exit-outline" size={24} color="red" />;
            case 'admin':
                return <MaterialIcons name="admin-panel-settings" size={24} color="black" />;
            case 'notifications': 
                return <MaterialIcons name={notificationsIcon} size={24} color="black" />
            case 'search':
                return <Feather name="search" size={24} color="black" />;
            case 'like button':
                return <FontAwesome name="heart-o" size={24} color="black" />;
            default: 
                return;
        }
    }

    const GridButton = ({label} : {
        label: ButtonLabel
    }) => {
        return <TouchableOpacity onPress={() => onButtonSelect(label)}>
            <Center minWidth='90px'>
            <Box w='60px' h='60px' borderRadius='30px' bgColor='#f1f1f1' shadow='9' style={{shadowOpacity: 0.12}} p='0px' mx='auto'>
                <Center w='100%' h='100%' m='auto'>
                    {getIconForLabel(label)}
                </Center>
            </Box>
            <Text mt='12px' textTransform='capitalize' fontSize='xs' textAlign='center' mx='auto' maxWidth='72px'>
                {`${label}`}
            </Text>
            </Center>
        </TouchableOpacity>
    }

    return <Box w='100%' mt='12px'>
        { (currentConvo && currentConvo.group) ? <>
        <HStack w='100%' space={3} my='12px'>
            <Spacer />
            <GridButton label='members' />
            <GridButton label='like button' />
            {/* <GridButton label='search' /> */}
            <GridButton label='notifications' />
            <Spacer />
        </HStack>
        <HStack w='100%' space={3} my='12px'>
            <Spacer />
                <GridButton label='gallery' />
                <GridButton label='polls' />
                <GridButton label='events' />
            <Spacer />
        </HStack>
        <HStack w='100%' space={3} my='12px'>
            <Spacer />
                {/* <GridButton label='like button' /> */}
                {
                    currentConvo?.publicKey &&
                    <GridButton label='encryption' />
                }
                <GridButton label='leave' />
            <Spacer />
        </HStack> 
        </> : <>
        <HStack w='100%' space={3} my='12px'>
            <Spacer />
            <GridButton label='notifications' />
            <GridButton label='gallery' />
            <GridButton label='encryption' />
            <Spacer />
        </HStack>
        </>}
    </Box>
}
