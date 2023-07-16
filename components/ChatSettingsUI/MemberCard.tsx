import React, { useMemo, useContext } from "react";
import { UserConversationProfile } from "../../types/types";
import { Box, HStack, Text, Center, Spacer, VStack } from "native-base";
import ProfileImage from "../generics/ProfileImage";
import IconButton from "../generics/IconButton";
import { Ionicons, Feather } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native-gesture-handler";
import AuthIdentityContext from "../../contexts/AuthIdentityContext";

export default function MemberCard({
    profile,
    handleSelect,
    handleRemove,
    handleMessage
}: {
    profile: UserConversationProfile;
    handleSelect: () => void;
    handleRemove: () => void;
    handleMessage: () => void;
}): JSX.Element {
    const { user } = useContext(AuthIdentityContext);

    const isUser = useMemo(() => (user?.id === profile.id), [profile, user]);

    const avatarElem = useMemo(() => {
        if (profile.avatar) {
            return <ProfileImage imageUri={profile.avatar.mainUri} size={60} shadow='9' />;
        }
        return <IconButton label='profile' size={60} />
    }, [profile]);

    const getActionIcon = (label: string) => {
        switch (label) {
            case 'message':
                return <Feather name="message-circle" size={24} color='gray' />
            case 'leave':
                return <Ionicons name="ios-exit-outline" size={24} color='coral' />
            default:
                return <></>;
        }
    };

    const ActionButton = ({label, onPress}: {
        label: string;
        onPress?: () => void;
    }) => (
        <TouchableOpacity onPress={onPress}>
            <Box bgColor='#f5f5f5' shadow='9' style={{shadowOpacity: 0.07}} w='48px' borderRadius='24px' h='48px' my='auto'>
                <Box m='auto'>
                    {getActionIcon(label)}
                </Box>
            </Box>
        </TouchableOpacity>
    )

    return <Box w='100%' h='72px'>
        <TouchableOpacity style={{overflow: 'visible'}} onPress={handleSelect}>
        <Box w='100%' borderRadius='12px' px='12px' backgroundColor='#f5f5f5' maxHeight='60px' overflow='visible'>
            <HStack space={4}>
                <Box overflow='visible'>
                {avatarElem}
                </Box>
                <VStack h='60px'>
                <Spacer/>
                <Text fontWeight='bold' fontSize='md' maxWidth='100px' numberOfLines={1}>
                    {profile.displayName}
                </Text>
                {
                    profile.handle &&
                    <Text fontSize='xs' color='gray.700'>
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
                        <ActionButton label='message' onPress={handleMessage}/>
                        <ActionButton label='leave' onPress={handleRemove}/>
                    </HStack>
                    <Spacer />
                </VStack>
                }
            </HStack>
        </Box>
        </TouchableOpacity>
    </Box>;
}
