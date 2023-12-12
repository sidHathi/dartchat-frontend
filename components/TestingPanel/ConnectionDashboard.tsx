import React, { useCallback, useContext, useMemo } from "react";
import SocketContext from "../../contexts/SocketContext";
import { Box, Icon, Text, HStack, VStack, Spacer, IBoxProps } from 'native-base';
import NetworkContext from "../../contexts/NetworkContext";
import { Pressable, Touchable } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import colors from "../colors";
import UIContext from "../../contexts/UIContext";
import { FontAwesome, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

export default function ConnectionDashboard(): JSX.Element {
    const { socket, isEnabled, enable, disable } = useContext(SocketContext);
    const { networkConnected } = useContext(NetworkContext);
    const { theme } = useContext(UIContext);

    const socketStatus = useMemo(() => {
        if (!isEnabled) {
            return 'Disabled'
        } else if (!socket) {
            return 'Uninitialized'
        } else if (!socket.connected) {
            return 'Disconnected'
        } else {
            return 'Connected';
        }
    }, [socket]);

    const StatusButton = ({
        active,
        icon,
        onPress,
        ...props
    }: {
        active: boolean;
        icon: JSX.Element;
        onPress?: () => void;
    } & IBoxProps): JSX.Element => {
        return <Box w='36px' h='36px' bgColor={active ? colors.input[theme] : colors.card[theme]} opacity={active ? 1 : 0.7} shadow={active ? 9 : 'none'} borderRadius='full' {...props} style={{ shadowOpacity: 0.12 }}>
            <TouchableOpacity onPress={onPress} style={{width: '100%', height: '100%'}}>
                <Box m='auto'>
                    {icon}
                </Box>
            </TouchableOpacity>
        </Box>;
    };

    const toggleSocket = useCallback(() => {
        if (!isEnabled) {
            enable();
        } else {
            disable();
        }
    }, [isEnabled, enable, disable]);

    return <Box w='100%' mx='auto' bgColor={colors.card[theme]} borderRadius='24px' py='12px'>
        <VStack space='2' my='6px'>
            <TouchableOpacity>
                <Box w='90%' mx='auto' bgColor={colors.bgLight[theme]} py='6px' px='12px' borderRadius='12px'>
                    <HStack>
                        <Box>
                            <Text fontWeight='bold' textTransform='uppercase' fontSize='10px' color={colors.textLightNB[theme]}>
                                Socket Status
                            </Text>
                            <Text fontWeight='bold' color={colors.textMainNB[theme]} fontSize='md'>
                                {socketStatus}
                            </Text>
                        </Box>
                        <Spacer />
                        <StatusButton
                            icon={<Icon as={MaterialIcons} name={socketStatus !== 'Disabled' ? 'toggle-on' : 'toggle-off'} size='md' color={colors.textMainNB[theme]} />}
                            active={socketStatus === 'Connected'}
                            onPress={toggleSocket}
                            my='auto'
                        />
                    </HStack>
                </Box>
            </TouchableOpacity>
            <TouchableOpacity>
                <Box w='90%' mx='auto' bgColor={colors.bgLight[theme]} py='6px' px='12px' borderRadius='12px'>
                    <Text textTransform='uppercase' fontSize='10px' color={colors.textLightNB[theme]} fontWeight='bold'>
                        Network Status
                    </Text>
                    <Text fontWeight='bold' color={colors.textMainNB[theme]} fontSize='md'>
                        {networkConnected ? 'Connected' : 'Disconnected'}
                    </Text>
                </Box>
            </TouchableOpacity>
        </VStack>
    </Box>;
}
