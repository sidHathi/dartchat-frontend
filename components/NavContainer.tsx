import React, {PropsWithChildren, ReactNode, useEffect, useState, useContext} from "react";
import ConversationContext from "../contexts/CurrentConversationContext";
import { View, Box, Text, HStack, Button, Pressable, VStack, Center, Spacer } from 'native-base';
import { Dimensions, Image } from "react-native";
import { SvgXml } from "react-native-svg";
import DartChatLogoXML from "../assets/DartChatLogoXML";
import { logOut } from "../firebase/auth";
import { Entypo } from '@expo/vector-icons'; 
import { FontAwesome } from '@expo/vector-icons'; 
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UIScreen } from "../types/types";
import IconButton from "./generics/IconButton";

export default function NavContainer({ children, navState, navSwitch }: 
    PropsWithChildren<{
        children: ReactNode, 
        navState: UIScreen,
        navSwitch: (newScreen: UIScreen) => void}>): JSX.Element {
    const { exitConvo } = useContext(ConversationContext)
    const screenHeight = Dimensions.get('window').height;

    const handleNewMessage = () => {
        exitConvo();
        navSwitch('messaging');
    }

    return <View w='100%' h={screenHeight} backgroundColor='#222'>
        <Box backgroundColor='#fefefe' h='100px' overflow='hidden' zIndex='1001'>
            <Box backgroundColor='#222' borderBottomRightRadius='24px' h='100px' zIndex='999'>
                <HStack w='100%' h='100px' justifyContent='space-between' alignItems='flex-start' paddingTop='50px' paddingX='12px'>
                    <Center paddingTop='0' paddingLeft='6px'>
                        <SvgXml xml={DartChatLogoXML} height='42' width='110'/>
                    </Center>
                    <Spacer />
                    <IconButton label='profile' size={36} additionalProps={{marginTop: '6px'}} onPress={logOut}/>
                </HStack>
            </Box>
        </Box>
        <Box w='100%' h={`${screenHeight - 100} px`} backgroundColor='#fefefe' borderTopLeftRadius='24px' shadow='9' zIndex='1000'>
            {children}
        </Box>
        <Center marginTop='-90px' zIndex='1002'>
            <HStack>
            <Box w='150px' h='50px' backgroundColor='#333' borderRadius='30px' shadow='3' marginX='5px'>
                <Center h='50px'>
                    <HStack w='90px'>
                        <Pressable opacity={navState === 'conversations' ? 1 : 0.5} onPress={() => navSwitch('conversations')}>
                            <Entypo name="home" size={25} color="white" />
                        </Pressable>
                        <Spacer />
                        <Pressable opacity={navState === 'social' ? 1 : 0.5}
                            onPress={() => navSwitch('social')}>
                            <Ionicons name="people" size={25} color="white" />
                        </Pressable>
                    </HStack>
                </Center>
            </Box>
            <Box w='50px' h='50px' backgroundColor='#333' borderRadius='30px' shadow='9' marginX='5px'>
                <Center h='50px'>
                    <Pressable onPress={handleNewMessage}>
                        <MaterialCommunityIcons name="message-draw" size={25} color="white" />
                    </Pressable>
                </Center>
            </Box>
            </HStack>
        </Center>
    </View>
}