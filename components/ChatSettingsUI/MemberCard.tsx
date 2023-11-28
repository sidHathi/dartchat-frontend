import React, { useMemo, useContext } from "react";
import { ChatRole, UserConversationProfile } from "../../types/types";
import { Box, HStack, Text, Center, Spacer, VStack } from "native-base";
import IconImage from "../generics/IconImage";
import IconButton from "../generics/IconButton";
import { Ionicons, Feather } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native-gesture-handler";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";
import { hasPermissionForAction } from "../../utils/messagingUtils";
import UIContext from "../../contexts/UIContext";
import colors from "../colors";

export default function MemberCard({
    profile,
    handleSelect,
    handleRemove,
    handleMessage,
    userRole,
}: {
    profile: UserConversationProfile;
    handleSelect: () => void;
    handleRemove: () => void;
    handleMessage: () => void;
    userRole?: ChatRole;
}): JSX.Element {
    const { user } = useContext(AuthIdentityContext);
    const { theme } = useContext(UIContext);

    const isUser = useMemo(() => (user?.id === profile.id), [profile, user]);

    const permissionToRemove = useMemo(() => {
        return hasPermissionForAction('removeUser', userRole, profile.role)
    }, [profile, userRole])

    const avatarElem = useMemo(() => {
        if (profile.avatar) {
            return <IconImage imageUri={profile.avatar.mainUri} size={60} shadow='9' />;
        }
        return <IconButton label='profile' size={60} shadow='9' />
    }, [profile]);

    const getActionIcon = (label: string, dark?: boolean) => {
        switch (label) {
            case 'message':
                return <Feather name="message-circle" size={20} color={dark ? 'white': 'gray'} />
            case 'leave':
                return <Ionicons name="ios-exit-outline" size={20} color='coral' />
            default:
                return <></>;
        }
    };

    const ActionButton = ({label, dark, onPress}: {
        label: string;
        dark?: boolean
        onPress?: () => void;
    }) => (
        <TouchableOpacity onPress={onPress}>
            <Box bgColor={!dark ? '#f5f5f5': '#222'} shadow='9' style={{shadowOpacity: 0.07}} w='40px' borderRadius='24px' h='40px' my='auto'>
                <Box m='auto'>
                    {getActionIcon(label, dark)}
                </Box>
            </Box>
        </TouchableOpacity>
    )

    return <Box w='100%' h='72px'>
        <TouchableOpacity style={{overflow: 'visible'}} onPress={handleSelect}>
        <Box w='100%' borderRadius='24px' px='12px' backgroundColor={colors.message[theme]} maxHeight='60px' overflow='visible'>
            <HStack space={4}>
                <Box overflow='visible'>
                {avatarElem}
                </Box>
                <VStack h='60px'>
                <Spacer/>
                <Text fontWeight='bold' fontSize='sm' maxWidth='100px' numberOfLines={1} color={colors.textMainNB[theme]}>
                    {profile.displayName}
                </Text>
                {
                    profile.handle &&
                    <Text fontSize='xs' color={colors.subTextNB[theme]}>
                        {profile.handle}
                    </Text>
                }
                <Spacer/>
                </VStack>
                <Spacer />
                {!isUser &&
                <VStack>
                    <Spacer />
                    <HStack space={3}>
                        <ActionButton label='message' dark={true} onPress={handleMessage} />
                        {
                            permissionToRemove &&
                            <ActionButton label='leave' onPress={handleRemove} dark={theme === 'dark'} />
                        }
                    </HStack>
                    <Spacer />
                </VStack>
                }
            </HStack>
        </Box>
        </TouchableOpacity>
    </Box>;
}
