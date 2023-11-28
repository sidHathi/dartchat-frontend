import React, {PropsWithChildren, ReactNode, useEffect, useState, useContext, useCallback} from "react";
import { View, Box, Text, HStack, Button, Pressable, VStack, Center, Spacer } from 'native-base';
import { Dimensions, Image } from "react-native";
import { SvgXml } from "react-native-svg";
import DartChatLogoXML from "../assets/DartChatLogoXML";
import { logOut } from "../firebase/auth";
import { Entypo } from '@expo/vector-icons'; 
import { FontAwesome } from '@expo/vector-icons'; 
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import IconButton from "./generics/IconButton";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { exitConvo as reduxExit } from "../redux/slices/chatSlice";
import NetworkContext from "../contexts/NetworkContext";
import NetworkDisconnectionAlert from "./generics/alerts/NetworkDisconnectionAlert";
import SocketContext from "../contexts/SocketContext";
import UIContext from "../contexts/UIContext";
import AuthIdentityContext from "../contexts/AuthIdentityContext";
import IconImage from "./generics/IconImage";
import colors from "./colors";

export default function NavContainer({ children }: 
    PropsWithChildren<{
        children: ReactNode
    }>): JSX.Element {
    const dispatch = useAppDispatch();
    const { user } = useContext(AuthIdentityContext)
    const { uiState: navState, navSwitch, theme } = useContext(UIContext);
    const screenHeight = Dimensions.get('window').height;
    const { networkConnected, apiReachable } = useContext(NetworkContext);
    const { disconnected: socketDisconnected } = useContext(SocketContext); 

    const handleNewMessage = useCallback(() => {
        if (!networkConnected) return;
        dispatch(reduxExit());
        navSwitch('messaging');
    }, [navSwitch, networkConnected]);

    return <View w='100%' h={screenHeight} backgroundColor={colors.navBG[theme]}>
        <Box backgroundColor={colors.bgLight[theme]} h='100px' overflow='hidden' zIndex='1001'>
            <Box backgroundColor={colors.navBG[theme]} borderBottomRightRadius='24px' h='100px' zIndex='999'>
                <HStack w='100%' h='100px' justifyContent='space-between' alignItems='flex-start' paddingTop='50px' paddingX='12px'>
                    <Center paddingTop='0' paddingLeft='6px'>
                        <SvgXml xml={DartChatLogoXML} height='42' width='110'/>
                    </Center>
                    <Spacer />
                    {
                    navState.screen !== 'profile' &&
                    (
                        user?.avatar?.tinyUri ? 
                        <IconImage imageUri={user.avatar.tinyUri} size={36}
                        shadow='9' onPress={() => navSwitch('profile')} nbProps={{mt: '6px'}}/> :
                        <IconButton label='profile' size={36} additionalProps={{marginTop: '6px'}} onPress={() => navSwitch('profile')} shadow='9' />
                     )
                    }
                </HStack>
            </Box>
        </Box>
        <Box w='100%' h={`${screenHeight - 90} px`} backgroundColor={colors.bgLight[theme]} borderTopLeftRadius='24px' shadow='9' zIndex='1000' overflow='hidden'>
            {children}
        </Box>
        <Center marginTop='-90px' zIndex='1002'>
            <HStack>
            <Box w='160px' h='60px' backgroundColor={colors.navBG[theme]} borderRadius='full' shadow='9' marginX='5px'>
                <Center h='60px'>
                    <HStack w='90px'>
                        <Pressable opacity={navState.screen === 'conversations' ? 1 : 0.5} onPress={() => navSwitch('conversations')}>
                            <Entypo name="home" size={28} color="white" />
                        </Pressable>
                        <Spacer />
                        <Pressable opacity={navState.screen === 'social' ? 1 : 0.5}
                            onPress={() => navSwitch('social')}>
                            <Ionicons name="people" size={28} color="white" />
                        </Pressable>
                    </HStack>
                </Center>
            </Box>
            <Box w='60px' h='60px' backgroundColor={colors.navBG[theme]} borderRadius='full' shadow='9' marginX='5px' opacity={networkConnected ? '1' : '0.2'}>
                <Center h='60px'>
                    <Pressable onPress={handleNewMessage}>
                        <MaterialCommunityIcons name="message-draw" size={28} color="white" />
                    </Pressable>
                </Center>
            </Box>
            </HStack>
        </Center>
        {
            (!networkConnected || !apiReachable) &&
            <Box marginTop='-150px' zIndex='1003'>
                <NetworkDisconnectionAlert type={networkConnected ? 'server' : 'network'} />
            </Box>
        }
    </View>
}